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
  },

  shelves: {
    detail: (shelfId: string) => `/shelves/${shelfId}`,
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
  },

  workspace: {
    current: '/workspace',
    members: '/workspace/members',
    invites: '/workspace/invites',
    invite: (inviteId: string) => `/workspace/invites/${inviteId}`,
  },

  settings: {
    get: '/settings',
    update: '/settings',
  },
} as const;
