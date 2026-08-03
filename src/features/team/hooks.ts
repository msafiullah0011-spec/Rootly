import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import type { Invite, Member, MemberRole } from '@/api/schemas';
import { useUiStore } from '@/store/ui.store';
import {
  activateWorkspace,
  completeAssignment,
  fetchSharedFolder,
  fetchSharedFolderLinks,
  fetchWorkspace,
  fetchWorkspaces,
  removeMember,
  resendInvite,
  revokeInvite,
  sendInvite,
  updateMemberRole,
  type InviteInput,
} from './api';

export type { InviteInput };

export function useWorkspace() {
  return useQuery({
    queryKey: queryKeys.workspace.current(),
    queryFn: ({ signal }) => fetchWorkspace(signal),
  });
}

/** The switcher's list of workspaces the user belongs to. */
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspace.list(),
    queryFn: ({ signal }) => fetchWorkspaces(signal),
  });
}

/**
 * Switching workspaces. Everything under `/workspace` is scoped to whichever
 * one is active, so the whole domain is invalidated rather than patched — the
 * members, folders, assignments and invites on screen all belong to the old one.
 */
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (workspaceId: string) => activateWorkspace(workspaceId),
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast(`Now in ${workspace.name}.`, 'success');
    },
  });
}

/** One assignment ticked off. It leaves "Assigned to you" on the next read. */
export function useCompleteAssignment() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    // `title` rides along purely so the toast can name what was finished.
    mutationFn: ({ assignmentId }: { assignmentId: string; title: string }) =>
      completeAssignment(assignmentId),
    onSuccess: (_assignment, { title }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast(`“${title}” marked done.`, 'success');
    },
  });
}

/**
 * A single member, read out of the workspace the list already loaded. The member
 * sheet opens from that list, so refetching one row would only add a spinner to
 * data we hold.
 */
export function useMember(memberId: string): Member | undefined {
  const workspace = useWorkspace();
  return workspace.data?.members.find((member) => member.id === memberId);
}

/** The signed-in member — who may or may not be allowed to manage the others. */
export function useCurrentMember(): Member | undefined {
  const workspace = useWorkspace();
  return workspace.data?.members.find((member) => member.isCurrentUser);
}

export function useSharedFolder(folderId: string) {
  return useQuery({
    queryKey: queryKeys.workspace.folder(folderId),
    queryFn: ({ signal }) => fetchSharedFolder(folderId, signal),
    enabled: Boolean(folderId),
  });
}

export function useSharedFolderLinks(folderId: string) {
  return useQuery({
    queryKey: queryKeys.workspace.folderLinks(folderId),
    queryFn: ({ signal }) => fetchSharedFolderLinks(folderId, signal),
    enabled: Boolean(folderId),
  });
}

export function useSendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteInput) => sendInvite(input),
    // The invite screen renders field errors inline against the email input.
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
    },
  });
}

/** One outstanding invite, read out of the workspace the list already loaded. */
export function useInvite(inviteId: string): Invite | undefined {
  const workspace = useWorkspace();
  return workspace.data?.pendingInvites.find((invite) => invite.id === inviteId);
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    // `email` rides along so the toast can name who lost their invite.
    mutationFn: ({ inviteId }: { inviteId: string; email: string }) => revokeInvite(inviteId),
    onSuccess: (_result, { email }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast(`Invite to ${email} revoked.`, 'success');
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (inviteId: string) => resendInvite(inviteId),
    onSuccess: (invite) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast(`Invite resent to ${invite.email}.`, 'success');
    },
  });
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'the owner',
  admin: 'an admin',
  member: 'a member',
};

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    // `name` rides along purely so the toast can name the person.
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole; name: string }) =>
      updateMemberRole(memberId, role),
    onSuccess: (_member, { role, name }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast(`${name} is now ${ROLE_LABELS[role]}.`, 'success');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ memberId }: { memberId: string; name: string }) => removeMember(memberId),
    onSuccess: (_result, { name }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
      showToast(`${name} was removed from the workspace.`, 'success');
    },
  });
}
