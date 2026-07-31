import { endpoints } from '@/api/endpoints';
import { del, get, patch, post } from '@/api/http';
import {
  linkListSchema,
  linkSchema,
  shelfSchema,
  type AccentNameValue,
} from '@/api/schemas';

/** Endpoint functions for links and shelf contents. */

export function fetchShelf(shelfId: string, signal?: AbortSignal) {
  return get(endpoints.shelves.detail(shelfId), { schema: shelfSchema, signal });
}

export function fetchShelfLinks(shelfId: string, signal?: AbortSignal) {
  return get(endpoints.shelves.links(shelfId), { schema: linkListSchema, signal });
}

export function fetchLink(linkId: string, signal?: AbortSignal) {
  return get(endpoints.links.detail(linkId), { schema: linkSchema, signal });
}

export interface LinkInput {
  url: string;
  title: string;
  rootId: string;
  shelfId: string;
  description?: string;
  loginEmail?: string;
  notes?: string;
  tags?: string[];
  accent?: AccentNameValue;
}

export function createLink(input: LinkInput) {
  return post(endpoints.links.create, input, { schema: linkSchema });
}

export function updateLink(linkId: string, input: Partial<LinkInput>) {
  return patch(endpoints.links.update(linkId), input, { schema: linkSchema });
}

export function archiveLink(linkId: string) {
  return post(endpoints.links.archive(linkId), {}, { schema: linkSchema });
}

export function moveLink(linkId: string, shelfId: string) {
  return post(endpoints.links.move(linkId), { shelfId }, { schema: linkSchema });
}

export function deleteLink(linkId: string) {
  return del(endpoints.links.remove(linkId));
}
