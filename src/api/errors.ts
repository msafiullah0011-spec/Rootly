/**
 * One error type for the whole app.
 *
 * Every failure — transport, HTTP, JSON, schema — is normalised into `ApiError`
 * before it leaves the API layer, so screens branch on a small closed set of
 * `kind`s instead of sniffing at unknown throwables.
 */

export type ApiErrorKind =
  /** Device offline, DNS failure, connection reset. */
  | 'network'
  /** Request exceeded the client timeout. */
  | 'timeout'
  /** Request was aborted deliberately (screen unmounted, query cancelled). */
  | 'cancelled'
  /** Response body was not valid JSON. */
  | 'parse'
  /** Response JSON did not match its schema. */
  | 'validation'
  /** 401 — no session, or the session expired and refresh failed. */
  | 'auth'
  /** 403 — authenticated but not permitted. */
  | 'forbidden'
  /** 404. */
  | 'notFound'
  /** 409 — conflicting write. */
  | 'conflict'
  /** 422 — the server rejected the submitted fields. */
  | 'badRequest'
  /** 429. */
  | 'rateLimit'
  /** Any 5xx. */
  | 'server'
  | 'unknown';

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  message: string;
  /** HTTP status, when there was a response. */
  status?: number;
  /** Machine-readable code from the API envelope, e.g. `root_not_found`. */
  code?: string;
  /** Field-level messages, keyed by field name — feeds inline form errors. */
  fieldErrors?: Record<string, string>;
  /** Server correlation id, surfaced in logs and support copy. */
  requestId?: string;
  /** Seconds to wait, parsed from `Retry-After` on 429/503. */
  retryAfterSec?: number;
  /** The original throwable, preserved for logging. */
  cause?: unknown;
  /** Request that produced this error, for logging. */
  request?: { method: string; path: string };
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;
  readonly requestId?: string;
  readonly retryAfterSec?: number;
  readonly request?: { method: string; path: string };

  constructor(options: ApiErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.requestId = options.requestId;
    this.retryAfterSec = options.retryAfterSec;
    this.request = options.request;
  }

  /** Wraps anything thrown into an ApiError without losing the original. */
  static from(error: unknown, request?: { method: string; path: string }): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof Error) {
      // fetch rejects with a TypeError for transport-level failures, and
      // AbortController surfaces as AbortError / TimeoutError.
      if (error.name === 'AbortError') {
        return new ApiError({ kind: 'cancelled', message: 'Request cancelled.', cause: error, request });
      }
      if (error.name === 'TimeoutError') {
        return new ApiError({ kind: 'timeout', message: 'Request timed out.', cause: error, request });
      }
      if (error.name === 'TypeError') {
        return new ApiError({ kind: 'network', message: error.message, cause: error, request });
      }
      return new ApiError({ kind: 'unknown', message: error.message, cause: error, request });
    }

    return new ApiError({ kind: 'unknown', message: 'Something went wrong.', cause: error, request });
  }

  /** Maps an HTTP status onto the closest error kind. */
  static kindForStatus(status: number): ApiErrorKind {
    if (status === 401) return 'auth';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'notFound';
    if (status === 409) return 'conflict';
    if (status === 422 || status === 400) return 'badRequest';
    if (status === 429) return 'rateLimit';
    if (status >= 500) return 'server';
    return 'unknown';
  }
}

/** Retry only what could plausibly succeed on a second attempt. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return (
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    error.kind === 'server' ||
    error.kind === 'rateLimit'
  );
}

/** True when the user is signed out and should be bounced to the auth stack. */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'auth';
}

/**
 * The single source of user-facing error copy, written in the product's voice.
 * Screens must not compose their own messages — call this.
 */
export function toUserMessage(error: unknown): { title: string; description: string } {
  const apiError = error instanceof ApiError ? error : ApiError.from(error);

  switch (apiError.kind) {
    case 'network':
      return {
        title: "Can't reach Rootly",
        description: 'Check your connection and try again.',
      };
    case 'timeout':
      return {
        title: 'That took too long',
        description: 'The server is being slow. Give it another try.',
      };
    case 'cancelled':
      return { title: 'Cancelled', description: 'That request was stopped.' };
    case 'parse':
    case 'validation':
      return {
        title: 'Something looks off',
        description: "We got an unexpected reply from the server. We're on it.",
      };
    case 'auth':
      return {
        title: 'Session expired',
        description: 'Sign in again to pick up where you left off.',
      };
    case 'forbidden':
      return {
        title: 'No access',
        description: "You don't have permission to do that in this workspace.",
      };
    case 'notFound':
      return {
        title: 'Not found',
        description: "That link may have been moved or archived.",
      };
    case 'conflict':
      return {
        title: 'Already changed',
        description: 'Someone else updated this first. Refresh and try again.',
      };
    case 'badRequest':
      return {
        title: "That didn't work",
        description: apiError.message || 'Check the details and try again.',
      };
    case 'rateLimit':
      return {
        title: 'Slow down a moment',
        description: apiError.retryAfterSec
          ? `Too many requests. Try again in ${apiError.retryAfterSec}s.`
          : 'Too many requests. Try again shortly.',
      };
    case 'server':
      return {
        title: 'Rootly is having a moment',
        description: 'Our end broke, not yours. Try again in a bit.',
      };
    default:
      return {
        title: 'Something went wrong',
        description: 'Try that again — and let us know if it keeps happening.',
      };
  }
}

/** Short single-line variant for toasts, where there's no room for a title. */
export function toToastMessage(error: unknown): string {
  const { title, description } = toUserMessage(error);
  return `${title}. ${description}`;
}
