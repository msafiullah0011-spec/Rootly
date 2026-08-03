import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { useUiStore } from '@/store/ui.store';
import { appUrl, shareText } from '@/lib/share';
import {
  createRoot,
  createShelf,
  deleteRoot,
  deleteShelf,
  fetchHomeFeed,
  fetchRoot,
  fetchRootLinks,
  fetchRootShelves,
  fetchRoots,
  updateRoot,
  updateShelf,
  type CreateRootInput,
  type CreateShelfInput,
} from './api';
import { formatRootExport } from './export';

/**
 * Root/shelf data hooks.
 *
 * `signal` is threaded through from TanStack Query so navigating away mid-flight
 * actually aborts the request instead of resolving into a dead component.
 */

export function useHomeFeed() {
  return useQuery({
    queryKey: queryKeys.home.feed(),
    queryFn: ({ signal }) => fetchHomeFeed(signal),
  });
}

export function useRoots() {
  return useQuery({
    queryKey: queryKeys.roots.list(),
    queryFn: ({ signal }) => fetchRoots(signal),
  });
}

export function useRoot(rootId: string) {
  return useQuery({
    queryKey: queryKeys.roots.detail(rootId),
    queryFn: ({ signal }) => fetchRoot(rootId, signal),
    enabled: Boolean(rootId),
  });
}

export function useRootShelves(rootId: string) {
  return useQuery({
    queryKey: queryKeys.roots.shelves(rootId),
    queryFn: ({ signal }) => fetchRootShelves(rootId, signal),
    enabled: Boolean(rootId),
  });
}

/**
 * Every live link in a root, across its shelves.
 *
 * Root detail uses this to tell which shelves are carrying a dead link — that's
 * a property of the links, and the shelf record only carries a count.
 */
export function useRootLinks(rootId: string) {
  return useQuery({
    queryKey: queryKeys.links.list({ rootId }),
    queryFn: ({ signal }) => fetchRootLinks(rootId, signal),
    enabled: Boolean(rootId),
  });
}

export function useCreateRoot() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateRootInput) => createRoot(input),
    onSuccess: (root) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      showToast(`${root.name} is ready.`, 'success');
    },
  });
}

export function useUpdateRoot(rootId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateRootInput>) => updateRoot(rootId, input),
    onSuccess: (root) => {
      queryClient.setQueryData(queryKeys.roots.detail(rootId), root);
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });
}

export function useDeleteRoot() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (rootId: string) => deleteRoot(rootId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      showToast('Root deleted.', 'success');
    },
  });
}

/**
 * Adds a shelf to a root.
 *
 * Silent because the sheet renders the failure inline — a duplicate name needs
 * to point at the field the user is looking at, not float past in a toast.
 */
export function useCreateShelf(rootId: string) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: CreateShelfInput) => createShelf(rootId, input),
    meta: { silent: true },
    onSuccess: (shelf) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.shelves(rootId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.detail(rootId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      showToast(`${shelf.name} is ready.`, 'success');
    },
  });
}

/**
 * Renames or restyles a shelf.
 *
 * Silent for the same reason as `useCreateShelf` — a duplicate name belongs on
 * the field the user is looking at, not in a toast.
 */
export function useUpdateShelf(shelfId: string, rootId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateShelfInput>) => updateShelf(shelfId, input),
    meta: { silent: true },
    onSuccess: (shelf) => {
      queryClient.setQueryData(queryKeys.shelves.detail(shelfId), shelf);
      invalidateShelfScopes(queryClient, rootId);
    },
  });
}

/** Deletes a shelf and everything filed on it. */
export function useDeleteShelf(rootId: string) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (shelfId: string) => deleteShelf(shelfId),
    onSuccess: (_data, shelfId) => {
      queryClient.removeQueries({ queryKey: queryKeys.shelves.detail(shelfId) });
      queryClient.removeQueries({ queryKey: queryKeys.shelves.links(shelfId) });
      invalidateShelfScopes(queryClient, rootId);
      showToast('Shelf deleted.', 'success');
    },
  });
}

/**
 * Everything a shelf mutation can be seen through: the root's ring and rows,
 * the home feed's counts, the link lists carrying its name, and the timeline.
 */
function invalidateShelfScopes(queryClient: ReturnType<typeof useQueryClient>, rootId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.roots.shelves(rootId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roots.detail(rootId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roots.list() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
}

/**
 * Builds the Markdown export for a root.
 *
 * Reads through the API rather than the query cache on purpose: an export is a
 * deliberate act and should reflect the server, not whatever the screen happens
 * to be holding. Going direct also keeps a failure to one toast instead of two.
 */
export function useExportRoot(rootId: string) {
  return useMutation({
    mutationFn: async () => {
      const [root, shelves, links] = await Promise.all([
        fetchRoot(rootId),
        fetchRootShelves(rootId),
        fetchRootLinks(rootId),
      ]);
      return formatRootExport(root, shelves, links);
    },
  });
}

/**
 * The share and export actions, which the root detail screen and its options
 * sheet both offer. Both end in the OS share sheet; the clipboard is the
 * fallback, and the toast tells the user which one they got.
 */
export function useRootActions(rootId: string) {
  const showToast = useUiStore((state) => state.showToast);
  const exportRoot = useExportRoot(rootId);

  const shareRoot = async (rootName: string) => {
    const outcome = await shareText({
      title: rootName,
      message: `${rootName} on Rootly\n${appUrl(`/roots/${rootId}`)}`,
    });

    if (outcome === 'copied') showToast(`Link to ${rootName} copied.`, 'success');
    else if (outcome === 'failed') showToast("Couldn't share this root.", 'error');
  };

  const exportRootLinks = async (rootName: string) => {
    let markdown: string;
    try {
      markdown = await exportRoot.mutateAsync();
    } catch {
      // The mutation cache already raised the toast for this one.
      return;
    }

    const outcome = await shareText({ title: `${rootName} — Rootly export`, message: markdown });

    if (outcome === 'copied') showToast(`${rootName} copied as text.`, 'success');
    else if (outcome === 'failed') showToast("Couldn't export this root.", 'error');
  };

  return { shareRoot, exportRootLinks, isExporting: exportRoot.isPending };
}
