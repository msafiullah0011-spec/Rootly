/**
 * Every API path in one place — no route strings scattered through features.
 * When the real backend's paths differ, this is the only file to edit.
 */
export const endpoints = {
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    signOut: '/auth/sign-out',
    refresh: '/auth/refresh',
    session: '/auth/session',
    oauth: (provider: 'google' | 'apple') => `/auth/oauth/${provider}`,
    /** The signed-in user's own profile — read and edited by `/profile`. */
    profile: '/auth/profile',
  },

  home: {
    feed: '/home/feed',
  },

  roots: {
    list: '/roots',
    create: '/roots',
    detail: (rootId: string) => `/roots/${rootId}`,
    update: (rootId: string) => `/roots/${rootId}`,
    remove: (rootId: string) => `/roots/${rootId}`,
    shelves: (rootId: string) => `/roots/${rootId}/shelves`,
    createShelf: (rootId: string) => `/roots/${rootId}/shelves`,
  },

  shelves: {
    detail: (shelfId: string) => `/shelves/${shelfId}`,
    update: (shelfId: string) => `/shelves/${shelfId}`,
    remove: (shelfId: string) => `/shelves/${shelfId}`,
    links: (shelfId: string) => `/shelves/${shelfId}/links`,
  },

  links: {
    list: '/links',
    create: '/links',
    detail: (linkId: string) => `/links/${linkId}`,
    update: (linkId: string) => `/links/${linkId}`,
    remove: (linkId: string) => `/links/${linkId}`,
    archive: (linkId: string) => `/links/${linkId}/archive`,
    move: (linkId: string) => `/links/${linkId}/move`,
    /** Records that the user opened this link — what Home resumes to. */
    open: (linkId: string) => `/links/${linkId}/open`,
  },

  assistant: {
    suggestions: '/assistant/suggestions',
    dismiss: (suggestionId: string) => `/assistant/suggestions/${suggestionId}/dismiss`,
    ask: '/assistant/ask',
    /** AI metadata inference for the quick-add sheet. */
    autoRoot: '/assistant/auto-root',
  },

  notifications: {
    list: '/notifications',
    markAllRead: '/notifications/read-all',
    markRead: (notificationId: string) => `/notifications/${notificationId}/read`,
  },

  timeline: {
    list: '/timeline',
    detail: (eventId: string) => `/timeline/${eventId}`,
    undo: (eventId: string) => `/timeline/${eventId}/undo`,
    replies: (eventId: string) => `/timeline/${eventId}/replies`,
  },

  workspace: {
    /** Every workspace the user belongs to, for the switcher. */
    list: '/workspaces',
    create: '/workspaces',
    activate: (workspaceId: string) => `/workspaces/${workspaceId}/activate`,
    current: '/workspace',
    members: '/workspace/members',
    member: (memberId: string) => `/workspace/members/${memberId}`,
    invites: '/workspace/invites',
    invite: (inviteId: string) => `/workspace/invites/${inviteId}`,
    resendInvite: (inviteId: string) => `/workspace/invites/${inviteId}/resend`,
    assignment: (assignmentId: string) => `/workspace/assignments/${assignmentId}`,
    folders: '/workspace/folders',
    folder: (folderId: string) => `/workspace/folders/${folderId}`,
    folderLinks: (folderId: string) => `/workspace/folders/${folderId}/links`,
  },

  settings: {
    get: '/settings',
    update: '/settings',
    connectedAccounts: '/settings/connected-accounts',
    connectAccount: (accountId: string) => `/settings/connected-accounts/${accountId}/connect`,
    disconnectAccount: (accountId: string) => `/settings/connected-accounts/${accountId}`,
  },
} as const;
