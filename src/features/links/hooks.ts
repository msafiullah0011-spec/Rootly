import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import type { Link } from '@/api/schemas';
import { useUiStore } from '@/store/ui.store';
import {
  archiveLink,
  createLink,
  deleteLink,
  fetchLink,
  fetchShelf,
  fetchShelfLinks,
  moveLink,
  updateLink,
  type LinkInput,
} from './api';

export function useShelf(shelfId: string) {
  return useQuery({
    queryKey: queryKeys.shelves.detail(shelfId),
    queryFn: ({ signal }) => fetchShelf(shelfId, signal),
    enabled: Boolean(shelfId),
  });
}

export function useShelfLinks(shelfId: string) {
  return useQuery({
    queryKey: queryKeys.shelves.links(shelfId),
    queryFn: ({ signal }) => fetchShelfLinks(shelfId, signal),
    enabled: Boolean(shelfId),
  });
}

export function useLink(linkId: string) {
  return useQuery({
    queryKey: queryKeys.links.detail(linkId),
    queryFn: ({ signal }) => fetchLink(linkId, signal),
    enabled: Boolean(linkId),
  });
}

/** Invalidates everything a link mutation could have changed. */
function invalidateLinkScopes(
  queryClient: ReturnType<typeof useQueryClient>,
  link: Pick<Link, 'rootId' | 'shelfId'>,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.shelves.links(link.shelfId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roots.detail(link.rootId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roots.shelves(link.rootId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roots.list() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
  // A link can also sit in a shared folder, whose counts and list come from the
  // workspace rather than the shelf.
  void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LinkInput) => createLink(input),
    onSuccess: (link) => invalidateLinkScopes(queryClient, link),
  });
}

export function useUpdateLink(linkId: string) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: Partial<LinkInput>) => updateLink(linkId, input),
    onSuccess: (link) => {
      queryClient.setQueryData(queryKeys.links.detail(linkId), link);
      invalidateLinkScopes(queryClient, link);
      showToast('Link saved.', 'success');
    },
  });
}

/**
 * Archive with an optimistic removal — the row should disappear the instant
 * the swipe completes, and come back if the server refuses.
 */
export function useArchiveLink(shelfId: string) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);
  const listKey = queryKeys.shelves.links(shelfId);

  return useMutation({
    mutationFn: (linkId: string) => archiveLink(linkId),
    // The rollback below restores the list, so the generic error toast would be
    // redundant noise on top of it.
    meta: { silent: true },

    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Link[]>(listKey);
      queryClient.setQueryData<Link[]>(listKey, (links) =>
        (links ?? []).filter((link) => link.id !== linkId),
      );
      return { previous };
    },

    onError: (_error, _linkId, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
      showToast("Couldn't archive that link. It's back where it was.", 'error');
    },

    onSuccess: (link) => {
      invalidateLinkScopes(queryClient, link);
      showToast(`${link.title} archived.`, 'success');
    },
  });
}

export function useMoveLink(shelfId: string) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);
  const listKey = queryKeys.shelves.links(shelfId);

  return useMutation({
    mutationFn: ({ linkId, targetShelfId }: { linkId: string; targetShelfId: string }) =>
      moveLink(linkId, targetShelfId),
    meta: { silent: true },

    onMutate: async ({ linkId }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Link[]>(listKey);
      queryClient.setQueryData<Link[]>(listKey, (links) =>
        (links ?? []).filter((link) => link.id !== linkId),
      );
      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
      showToast("Couldn't move that link.", 'error');
    },

    onSuccess: (link) => {
      invalidateLinkScopes(queryClient, link);
      void queryClient.invalidateQueries({ queryKey: listKey });
      showToast(`Moved to ${link.shelfName}.`, 'success');
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (linkId: string) => deleteLink(linkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.shelves.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      showToast('Link deleted.', 'success');
    },
  });
}
