import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { RequestOptions } from '../client';
import { ApiError } from '../errors';
import { handlers, type MockHandler } from './handlers';

/**
 * A tiny in-process HTTP server.
 *
 * Route patterns use `:param` segments. Handlers get the parsed params, the
 * request body and the query, and return plain JSON — exactly what the real API
 * would send, so `http.ts` validates mock and live responses through the same
 * schemas.
 */

interface CompiledRoute {
  method: string;
  segments: string[];
  handler: MockHandler;
}

const routes: CompiledRoute[] = Object.entries(handlers).map(([key, handler]) => {
  const [method, pattern] = key.split(' ');
  return { method, segments: pattern.split('/').filter(Boolean), handler };
});

/**
 * Forces the next N requests to fail with the given error. Wired to the dev
 * panel so every error state is reachable without editing code.
 */
let forcedFailures = 0;
let forcedKind: ApiError['kind'] = 'server';

export function forceMockFailure(count = 1, kind: ApiError['kind'] = 'server') {
  forcedFailures = count;
  forcedKind = kind;
}

export function clearMockFailures() {
  forcedFailures = 0;
}

export async function mockRequest(path: string, options: RequestOptions): Promise<unknown> {
  const method = options.method ?? 'GET';
  const [rawPath] = path.split('?');
  const segments = rawPath.split('/').filter(Boolean);

  await delay(env.mockLatencyMs);

  if (options.signal?.aborted) {
    throw new ApiError({ kind: 'cancelled', message: 'Request cancelled.', request: { method, path } });
  }

  if (forcedFailures > 0) {
    forcedFailures -= 1;
    throw failureFor(forcedKind, { method, path });
  }

  if (env.mockFailureRate > 0 && Math.random() < env.mockFailureRate) {
    throw failureFor('server', { method, path });
  }

  const match = findRoute(method, segments);
  if (!match) {
    logger.warn(`No mock handler for ${method} ${rawPath}`);
    throw new ApiError({
      kind: 'notFound',
      message: `No mock handler for ${method} ${rawPath}`,
      status: 404,
      request: { method, path },
    });
  }

  try {
    return await match.handler({
      params: match.params,
      body: options.body,
      query: options.query ?? {},
    });
  } catch (error) {
    throw ApiError.from(error, { method, path });
  }
}

function findRoute(
  method: string,
  segments: string[],
): { handler: MockHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    if (route.segments.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < route.segments.length; i += 1) {
      const pattern = route.segments[i];
      const actual = segments[i];
      if (pattern.startsWith(':')) params[pattern.slice(1)] = decodeURIComponent(actual);
      else if (pattern !== actual) {
        matched = false;
        break;
      }
    }

    if (matched) return { handler: route.handler, params };
  }
  return null;
}

function failureFor(kind: ApiError['kind'], request: { method: string; path: string }): ApiError {
  const messages: Partial<Record<ApiError['kind'], { message: string; status?: number }>> = {
    network: { message: 'Simulated network failure.' },
    timeout: { message: 'Simulated timeout.' },
    server: { message: 'Simulated server error.', status: 500 },
    auth: { message: 'Simulated expired session.', status: 401 },
    rateLimit: { message: 'Simulated rate limit.', status: 429 },
    notFound: { message: 'Simulated not found.', status: 404 },
  };
  const config = messages[kind] ?? { message: 'Simulated failure.' };
  return new ApiError({ kind, message: config.message, status: config.status, request });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
