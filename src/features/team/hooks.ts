import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { del, get, post } from '@/api/http';
import { queryKeys } from '@/api/query-keys';
import { inviteSchema, workspaceSchema, type AccessLevel } from '@/api/schemas';
import { useUiStore } from '@/store/ui.store';

export function useWorkspace() {
  return useQuery({
    queryKey: queryKeys.workspace.current(),
    queryFn: ({ signal }) => get(endpoints.workspace.current, { schema: workspaceSchema, signal }),
  });
}

export interface InviteInput {
  email: string;
  access: AccessLevel;
}

export function useSendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteInput) =>
      post(endpoints.workspace.invites, input, { schema: inviteSchema }),
    // The invite screen renders field errors inline against the email input.
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (inviteId: string) => del(endpoints.workspace.invite(inviteId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast('Invite revoked.', 'success');
    },
  });
}
