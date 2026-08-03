import { endpoints } from '@/api/endpoints';
import { get, patch, post, del } from '@/api/http';
import {
  homeFeedSchema,
  linkListSchema,
  rootListSchema,
  rootSchema,
  shelfListSchema,
  shelfSchema,
  type AccentNameValue,
  type IconKey,
} from '@/api/schemas';

/** Endpoint functions for roots and shelves. No React here — hooks wrap these. */

export function fetchHomeFeed(signal?: AbortSignal) {
  return get(endpoints.home.feed, { schema: homeFeedSchema, signal });
}

export function fetchRoots(signal?: AbortSignal) {
  return get(endpoints.roots.list, { schema: rootListSchema, signal });
}

export function fetchRoot(rootId: string, signal?: AbortSignal) {
  return get(endpoints.roots.detail(rootId), { schema: rootSchema, signal });
}

export function fetchRootShelves(rootId: string, signal?: AbortSignal) {
  return get(endpoints.roots.shelves(rootId), { schema: shelfListSchema, signal });
}

/** Every live link in a root, across all of its shelves — used by the export. */
export function fetchRootLinks(rootId: string, signal?: AbortSignal) {
  return get(endpoints.links.list, { schema: linkListSchema, query: { rootId }, signal });
}

export interface CreateRootInput {
  name: string;
  accent: AccentNameValue;
  icon: IconKey;
}

export function createRoot(input: CreateRootInput) {
  return post(endpoints.roots.create, input, { schema: rootSchema });
}

export function updateRoot(rootId: string, input: Partial<CreateRootInput>) {
  return patch(endpoints.roots.update(rootId), input, { schema: rootSchema });
}

export function deleteRoot(rootId: string) {
  return del(endpoints.roots.remove(rootId));
}

export interface CreateShelfInput {
  name: string;
  accent: AccentNameValue;
  icon: IconKey;
}

export function createShelf(rootId: string, input: CreateShelfInput) {
  return post(endpoints.roots.createShelf(rootId), input, { schema: shelfSchema });
}

export function updateShelf(shelfId: string, input: Partial<CreateShelfInput>) {
  return patch(endpoints.shelves.update(shelfId), input, { schema: shelfSchema });
}

export function deleteShelf(shelfId: string) {
  return del(endpoints.shelves.remove(shelfId));
}
