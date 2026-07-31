import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { useUiStore } from '@/store/ui.store';
import {
  createRoot,
  deleteRoot,
  fetchHomeFeed,
  fetchRoot,
  fetchRootShelves,
  fetchRoots,
  updateRoot,
  type CreateRootInput,
} from './api';

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
