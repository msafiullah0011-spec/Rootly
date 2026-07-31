import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { ApiError } from './errors';

/**
 * The HTTP client. One place that knows about timeouts, auth headers, retries,
 * token refresh and error normalisation — nothing else in the app calls `fetch`.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  /** Serialised as JSON. Omit for GET/DELETE. */
  body?: unknown;
  /** Appended as a query string; `undefined` and `null` values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  /** Overrides the default timeout for slow endpoints (uploads, AI answers). */
  timeoutMs?: number;
  /** Caller-supplied cancellation, merged with the timeout signal. */
  signal?: AbortSignal;
  /** Skips the Authorization header — used by sign-in and refresh. */
  skipAuth?: boolean;
  /** Overrides retry count. Non-idempotent methods default to 0. */
  retries?: number;
}

/**
 * Auth is injected rather than imported, because the auth store imports the
 * client — wiring it up in `configureApiClient` breaks the cycle.
 */
export interface AuthBridge {
  getAccessToken: () => string | null;
  /** Performs a refresh; resolves to the new access token or null on failure. */
  refreshSession: () => Promise<string | null>;
  /** Called when refresh fails and the session is unrecoverable. */
  onUnauthenticated: () => void;
}

let authBridge: AuthBridge | null = null;

export function configureApiClient(bridge: AuthBridge) {
  authBridge = bridge;
}

const IDEMPOTENT: HttpMethod[] = ['GET', 'PUT', 'DELETE'];
const DEFAULT_RETRIES = 2;

/**
 * Concurrent 401s must not each fire a refresh. The first one starts it and
 * everyone else awaits the same promise.
 */
let refreshInFlight: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  if (!authBridge) return Promise.resolve(null);
  refreshInFlight ??= authBridge
    .refreshSession()
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const maxRetries = options.retries ?? (IDEMPOTENT.includes(method) ? DEFAULT_RETRIES : 0);

  let attempt = 0;
  let hasRetriedAuth = false;
  while (true) {
    try {
      return await performRequest<T>(path, options, method);
    } catch (error) {
      const apiError = ApiError.from(error, { method, path });

      // A 401 gets exactly one refresh-and-replay before we give up.
      if (apiError.kind === 'auth' && !options.skipAuth && !hasRetriedAuth) {
        hasRetriedAuth = true;
        const token = await refreshOnce();
        if (token) continue;
        authBridge?.onUnauthenticated();
        throw apiError;
      }

      if (attempt >= maxRetries || !shouldRetry(apiError)) throw apiError;

      const delay = backoffDelay(attempt, apiError.retryAfterSec);
      logger.debug(`Retrying ${method} ${path} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      attempt += 1;
    }
  }
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
  method: HttpMethod,
): Promise<T> {
  const url = buildUrl(path, options.query);
  const timeoutMs = options.timeoutMs ?? env.requestTimeoutMs;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(new DOMExceptionLike('TimeoutError')), timeoutMs);
  const signal = mergeSignals(timeoutController.signal, options.signal);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.skipAuth) {
    const token = authBridge?.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    // Distinguish "we timed out" from "the caller cancelled".
    if (timeoutController.signal.aborted) {
      throw new ApiError({
        kind: 'timeout',
        message: `Request timed out after ${timeoutMs}ms.`,
        cause: error,
        request: { method, path },
      });
    }
    throw ApiError.from(error, { method, path });
  } finally {
    clearTimeout(timeoutId);
  }

  const requestId = response.headers.get('x-request-id') ?? undefined;

  if (!response.ok) {
    throw await errorFromResponse(response, { method, path }, requestId);
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  if (!raw) return undefined as T;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new ApiError({
      kind: 'parse',
      message: 'Server returned a malformed response.',
      status: response.status,
      requestId,
      cause: error,
      request: { method, path },
    });
  }
}

/**
 * Reads an error response. Tolerates any body shape — servers fail in creative
 * ways, and an unparseable error body must not mask the status code.
 */
async function errorFromResponse(
  response: Response,
  request: { method: string; path: string },
  requestId?: string,
): Promise<ApiError> {
  let payload: Record<string, unknown> = {};
  try {
    const raw = await response.text();
    if (raw) payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Body wasn't JSON. The status is still authoritative.
  }

  const retryAfterHeader = response.headers.get('retry-after');
  const retryAfterSec = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;

  return new ApiError({
    kind: ApiError.kindForStatus(response.status),
    message:
      pickString(payload, 'message') ??
      pickString(payload, 'error') ??
      `Request failed with status ${response.status}.`,
    status: response.status,
    code: pickString(payload, 'code'),
    fieldErrors: pickFieldErrors(payload),
    requestId: requestId ?? pickString(payload, 'requestId'),
    retryAfterSec: Number.isFinite(retryAfterSec) ? retryAfterSec : undefined,
    request,
  });
}

function pickString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}

function pickFieldErrors(payload: Record<string, unknown>): Record<string, string> | undefined {
  const errors = payload.errors ?? payload.fieldErrors;
  if (!errors || typeof errors !== 'object') return undefined;

  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    if (typeof value === 'string') result[field] = value;
    else if (Array.isArray(value) && typeof value[0] === 'string') result[field] = value[0];
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function shouldRetry(error: ApiError): boolean {
  return (
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    error.kind === 'server' ||
    error.kind === 'rateLimit'
  );
}

/** Exponential backoff with jitter, capped at 8s; honours `Retry-After`. */
function backoffDelay(attempt: number, retryAfterSec?: number): number {
  if (retryAfterSec && retryAfterSec > 0) return Math.min(retryAfterSec * 1000, 30_000);
  const base = Math.min(500 * 2 ** attempt, 8_000);
  return base + Math.random() * 250;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = env.apiUrl.replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${base}/${path.replace(/^\//, '')}`;
  if (!query) return url;

  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return params.length > 0 ? `${url}?${params.join('&')}` : url;
}

/**
 * `AbortSignal.any` is not available in Hermes, so signals are merged by hand.
 */
function mergeSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
  if (!b) return a;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (a.aborted || b.aborted) controller.abort();
  else {
    a.addEventListener('abort', abort, { once: true });
    b.addEventListener('abort', abort, { once: true });
  }
  return controller.signal;
}

/** Hermes lacks `DOMException`; this carries the `name` abort reason needs. */
class DOMExceptionLike extends Error {
  constructor(name: string) {
    super(name);
    this.name = name;
  }
}
