import type { z } from 'zod';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { request, type RequestOptions } from './client';
import { ApiError } from './errors';
import { mockRequest } from './mock/server';

/**
 * The layer every feature calls.
 *
 * Two jobs:
 *  1. Route to the mock server or the network, depending on `EXPO_PUBLIC_USE_MOCKS`.
 *     Feature code is identical either way.
 *  2. Validate the response against its schema before returning it, so nothing
 *     downstream has to defend against a surprise shape.
 */

async function send<T>(path: string, options: RequestOptions): Promise<unknown> {
  if (env.useMocks) {
    return mockRequest(path, options);
  }
  return request<T>(path, options);
}

/** Parses `data` through `schema`, converting failures into a typed ApiError. */
export function parseWith<S extends z.ZodType>(
  schema: S,
  data: unknown,
  context: { method: string; path: string },
): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const issue = result.error.issues[0];
  const fieldPath = issue?.path.join('.') || '(root)';

  logger.error(`Response validation failed for ${context.method} ${context.path}`, result.error.issues);

  throw new ApiError({
    kind: 'validation',
    message: `Unexpected response shape at "${fieldPath}": ${issue?.message ?? 'invalid'}`,
    request: context,
    fieldErrors: Object.fromEntries(
      result.error.issues.map((i) => [i.path.join('.') || '(root)', i.message]),
    ),
    cause: result.error,
  });
}

interface TypedOptions<S extends z.ZodType> extends Omit<RequestOptions, 'method' | 'body'> {
  schema: S;
}

export async function get<S extends z.ZodType>(
  path: string,
  { schema, ...options }: TypedOptions<S>,
): Promise<z.infer<S>> {
  const data = await send(path, { ...options, method: 'GET' });
  return parseWith(schema, data, { method: 'GET', path });
}

export async function post<S extends z.ZodType>(
  path: string,
  body: unknown,
  { schema, ...options }: TypedOptions<S>,
): Promise<z.infer<S>> {
  const data = await send(path, { ...options, method: 'POST', body });
  return parseWith(schema, data, { method: 'POST', path });
}

export async function patch<S extends z.ZodType>(
  path: string,
  body: unknown,
  { schema, ...options }: TypedOptions<S>,
): Promise<z.infer<S>> {
  const data = await send(path, { ...options, method: 'PATCH', body });
  return parseWith(schema, data, { method: 'PATCH', path });
}

export async function put<S extends z.ZodType>(
  path: string,
  body: unknown,
  { schema, ...options }: TypedOptions<S>,
): Promise<z.infer<S>> {
  const data = await send(path, { ...options, method: 'PUT', body });
  return parseWith(schema, data, { method: 'PUT', path });
}

/** DELETE endpoints usually 204; pass a schema only when they return a body. */
export async function del<S extends z.ZodType>(
  path: string,
  options: Partial<TypedOptions<S>> = {},
): Promise<z.infer<S> | void> {
  const { schema, ...rest } = options;
  const data = await send(path, { ...rest, method: 'DELETE' });
  if (!schema) return;
  return parseWith(schema, data, { method: 'DELETE', path });
}
