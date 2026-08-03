import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import type { AppSettings } from '@/api/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import {
  connectAccount,
  disconnectAccount,
  fetchConnectedAccounts,
  fetchProfile,
  fetchSettings,
  updateProfile,
  updateSettings,
  type ProfileInput,
} from './api';

export type { ProfileInput };

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: ({ signal }) => fetchSettings(signal),
  });
}

/**
 * The signed-in user, read from the server rather than the session copy.
 *
 * The store's `user` is what the session was issued with; this is the record of
 * record. The session copy stands in as placeholder data so the screen paints
 * straight away — `placeholderData` rather than `initialData` because it must
 * not be cached as if it were a server response, and the fetch has to run.
 */
export function useProfile() {
  const sessionUser = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.settings.profile(),
    queryFn: ({ signal }) => fetchProfile(signal),
    placeholderData: sessionUser ?? undefined,
  });
}

/**
 * Profile edits. The name and email show up on Home, in Settings and on the
 * user's workspace rows, so the session copy is updated and every screen that
 * renders a member list is invalidated.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (input: Partial<ProfileInput>) => updateProfile(input),
    // The profile screen maps `fieldErrors` onto its own inputs.
    meta: { silent: true },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.settings.profile(), user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast('Profile saved.', 'success');
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<AppSettings>) => updateSettings(input),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings.detail(), settings);
    },
  });
}

export function useConnectedAccounts() {
  return useQuery({
    queryKey: queryKeys.settings.connectedAccounts(),
    queryFn: ({ signal }) => fetchConnectedAccounts(signal),
  });
}

/** The name rides along so the toast can say which provider changed. */
export interface AccountMutationInput {
  id: string;
  name: string;
}

export function useConnectAccount() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ id }: AccountMutationInput) => connectAccount(id),
    onSuccess: (_account, { name }) => {
      // Invalidating the whole domain refreshes the list *and* the count on the
      // settings row behind this screen.
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      showToast(`${name} connected.`, 'success');
    },
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ id }: AccountMutationInput) => disconnectAccount(id),
    onSuccess: (_account, { name }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      showToast(`${name} disconnected.`, 'success');
    },
  });
}
