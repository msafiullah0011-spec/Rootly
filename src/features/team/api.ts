import { endpoints } from '@/api/endpoints';
import { del, get, patch, post } from '@/api/http';
import {
  assignmentSchema,
  inviteSchema,
  linkListSchema,
  memberSchema,
  sharedFolderSchema,
  workspaceSchema,
  workspaceSummaryListSchema,
  type AccessLevel,
  type MemberRole,
} from '@/api/schemas';

/** Endpoint functions for the team workspace. No React here. */

export function fetchWorkspace(signal?: AbortSignal) {
  return get(endpoints.workspace.current, { schema: workspaceSchema, signal });
}

/** Every workspace the user belongs to — the switcher's list. */
export function fetchWorkspaces(signal?: AbortSignal) {
  return get(endpoints.workspace.list, { schema: workspaceSummaryListSchema, signal });
}

export function activateWorkspace(workspaceId: string) {
  return post(endpoints.workspace.activate(workspaceId), {}, { schema: workspaceSchema });
}

export function fetchSharedFolder(folderId: string, signal?: AbortSignal) {
  return get(endpoints.workspace.folder(folderId), { schema: sharedFolderSchema, signal });
}

export function fetchSharedFolderLinks(folderId: string, signal?: AbortSignal) {
  return get(endpoints.workspace.folderLinks(folderId), { schema: linkListSchema, signal });
}

export interface InviteInput {
  email: string;
  access: AccessLevel;
}

export function sendInvite(input: InviteInput) {
  return post(endpoints.workspace.invites, input, { schema: inviteSchema });
}

export function revokeInvite(inviteId: string) {
  return del(endpoints.workspace.invite(inviteId));
}

/** Re-stamps an outstanding invite rather than creating a second one. */
export function resendInvite(inviteId: string) {
  return post(endpoints.workspace.resendInvite(inviteId), {}, { schema: inviteSchema });
}

export function completeAssignment(assignmentId: string) {
  return patch(
    endpoints.workspace.assignment(assignmentId),
    { done: true },
    { schema: assignmentSchema },
  );
}

export function updateMemberRole(memberId: string, role: MemberRole) {
  return patch(endpoints.workspace.member(memberId), { role }, { schema: memberSchema });
}

export function removeMember(memberId: string) {
  return del(endpoints.workspace.member(memberId));
}
