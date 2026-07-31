/**
 * Hierarchical query keys.
 *
 * Every key nests under a domain root so a broad invalidation works:
 * `queryClient.invalidateQueries({ queryKey: queryKeys.roots.all })` clears the
 * list *and* every root detail. Never inline a key array at a call site.
 */
export const queryKeys = {
  session: ['session'] as const,

  home: {
    all: ['home'] as const,
    feed: () => [...queryKeys.home.all, 'feed'] as const,
  },

  roots: {
    all: ['roots'] as const,
    list: () => [...queryKeys.roots.all, 'list'] as const,
    detail: (rootId: string) => [...queryKeys.roots.all, 'detail', rootId] as const,
    shelves: (rootId: string) => [...queryKeys.roots.all, 'shelves', rootId] as const,
  },

  shelves: {
    all: ['shelves'] as const,
    detail: (shelfId: string) => [...queryKeys.shelves.all, 'detail', shelfId] as const,
    links: (shelfId: string) => [...queryKeys.shelves.all, 'links', shelfId] as const,
  },

  links: {
    all: ['links'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.links.all, 'list', filters ?? {}] as const,
    detail: (linkId: string) => [...queryKeys.links.all, 'detail', linkId] as const,
  },

  assistant: {
    all: ['assistant'] as const,
    suggestions: () => [...queryKeys.assistant.all, 'suggestions'] as const,
    ask: (question: string) => [...queryKeys.assistant.all, 'ask', question] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },

  timeline: {
    all: ['timeline'] as const,
    list: (scope: string) => [...queryKeys.timeline.all, 'list', scope] as const,
  },

  workspace: {
    all: ['workspace'] as const,
    current: () => [...queryKeys.workspace.all, 'current'] as const,
    members: () => [...queryKeys.workspace.all, 'members'] as const,
    invites: () => [...queryKeys.workspace.all, 'invites'] as const,
  },

  settings: {
    all: ['settings'] as const,
    detail: () => [...queryKeys.settings.all, 'detail'] as const,
  },
} as const;
