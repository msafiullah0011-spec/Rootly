import { ApiError } from '../errors';
import type { AccessLevel, Link, Shelf } from '../schemas';
import { clearRoots, db, nextId, recalculateRoot, recalculateShelf } from './db';
import { seedAskAnswer, seedAskSuggestions, seedResumeLinkId } from './seed';

/**
 * Mock route table. Keys are `"<METHOD> /path/with/:params"`.
 *
 * Each handler returns the JSON body the real API would. Keep them honest —
 * mutate `db` the way a server would, so optimistic updates and cache
 * invalidation are exercised properly.
 */

export interface MockContext {
  params: Record<string, string>;
  body: unknown;
  query: Record<string, unknown>;
}

export type MockHandler = (ctx: MockContext) => unknown | Promise<unknown>;

function notFound(what: string): never {
  throw new ApiError({ kind: 'notFound', message: `${what} not found.`, status: 404 });
}

function asRecord(body: unknown): Record<string, unknown> {
  return (body ?? {}) as Record<string, unknown>;
}

function str(body: unknown, key: string, fallback = ''): string {
  const value = asRecord(body)[key];
  return typeof value === 'string' ? value : fallback;
}

export const handlers: Record<string, MockHandler> = {
  /* ------------------------------------------------------------------ auth */

  'POST /auth/sign-in': ({ body }) => {
    const email = str(body, 'email');
    const password = str(body, 'password');

    if (!email.includes('@')) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Enter a valid email address.',
        status: 422,
        fieldErrors: { email: 'Enter a valid email address.' },
      });
    }
    if (password.length < 6) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'That password is too short.',
        status: 422,
        fieldErrors: { password: 'Must be at least 6 characters.' },
      });
    }

    return {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      user: { ...db.user, email },
      needsOnboarding: !db.onboardingComplete,
    };
  },

  'POST /auth/sign-up': ({ body }) => {
    const email = str(body, 'email');
    // A new account starts with nothing, which lands the user on onboarding.
    clearRoots();
    return {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      user: { ...db.user, email, name: email.split('@')[0] },
      needsOnboarding: true,
    };
  },

  'POST /auth/oauth/:provider': ({ params }) => {
    throw new ApiError({
      kind: 'badRequest',
      message: `${params.provider === 'apple' ? 'Apple' : 'Google'} sign-in isn't connected yet.`,
      status: 501,
    });
  },

  'POST /auth/refresh': () => ({
    accessToken: `mock-access-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
    user: db.user,
    needsOnboarding: !db.onboardingComplete,
  }),

  'GET /auth/session': () => ({
    accessToken: `mock-access-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
    user: db.user,
    needsOnboarding: !db.onboardingComplete,
  }),

  'POST /auth/sign-out': () => ({ ok: true }),

  /* ------------------------------------------------------------------ home */

  'GET /home/feed': () => {
    const resume = db.links.find((l) => l.id === seedResumeLinkId) ?? db.links[0];
    return {
      greetingName: db.user.name.split(' ')[0],
      user: db.user,
      roots: db.roots,
      resume: resume
        ? {
            id: resume.id,
            title: resume.title,
            rootName: resume.rootName,
            shelfName: resume.shelfName,
            accent: 'pink',
            icon: 'megaphone',
          }
        : null,
      suggestion: db.suggestions[0] ?? null,
    };
  },

  /* ----------------------------------------------------------------- roots */

  'GET /roots': () => db.roots,

  'GET /roots/:rootId': ({ params }) =>
    db.roots.find((r) => r.id === params.rootId) ?? notFound('Root'),

  'GET /roots/:rootId/shelves': ({ params }) =>
    db.shelves.filter((s) => s.rootId === params.rootId),

  'POST /roots': ({ body }) => {
    const payload = asRecord(body);
    const root = {
      id: nextId('root'),
      name: str(body, 'name', 'New root'),
      accent: (payload.accent as string) || 'pink',
      icon: (payload.icon as string) || 'store',
      linkCount: 0,
      shelfCount: 0,
      deadLinkCount: 0,
      memberCount: 1,
      members: [{ id: db.user.id, initial: db.user.name.charAt(0), accent: db.user.accent }],
    };
    db.roots.unshift(root as never);
    db.onboardingComplete = true;
    return root;
  },

  'PATCH /roots/:rootId': ({ params, body }) => {
    const root = db.roots.find((r) => r.id === params.rootId) ?? notFound('Root');
    Object.assign(root, asRecord(body));
    return root;
  },

  'DELETE /roots/:rootId': ({ params }) => {
    db.roots = db.roots.filter((r) => r.id !== params.rootId);
    db.shelves = db.shelves.filter((s) => s.rootId !== params.rootId);
    db.links = db.links.filter((l) => l.rootId !== params.rootId);
    return null;
  },

  /* ---------------------------------------------------------------- shelves */

  'GET /shelves/:shelfId': ({ params }) =>
    db.shelves.find((s) => s.id === params.shelfId) ?? notFound('Shelf'),

  'GET /shelves/:shelfId/links': ({ params }) =>
    db.links.filter((l) => l.shelfId === params.shelfId && !l.archived),

  /* ------------------------------------------------------------------ links */

  'GET /links': ({ query }) => {
    const rootId = query.rootId as string | undefined;
    const shelfId = query.shelfId as string | undefined;
    return db.links.filter(
      (l) =>
        !l.archived && (!rootId || l.rootId === rootId) && (!shelfId || l.shelfId === shelfId),
    );
  },

  'GET /links/:linkId': ({ params }) =>
    db.links.find((l) => l.id === params.linkId) ?? notFound('Link'),

  'POST /links': ({ body }) => {
    const payload = asRecord(body);
    const shelf = db.shelves.find((s) => s.id === payload.shelfId);
    const root = db.roots.find((r) => r.id === (payload.rootId ?? shelf?.rootId));

    if (!root) notFound('Root');

    const link: Link = {
      id: nextId('link'),
      rootId: root.id,
      rootName: root.name,
      shelfId: shelf?.id ?? '',
      shelfName: shelf?.name ?? '',
      title: str(body, 'title', 'Untitled link'),
      url: str(body, 'url'),
      description: str(body, 'description'),
      accent: (payload.accent as Link['accent']) ?? root.accent,
      status: 'live',
      loginEmail: str(body, 'loginEmail') || undefined,
      notes: str(body, 'notes') || undefined,
      tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
      related: [],
      checkedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      archived: false,
    };

    db.links.unshift(link);
    recalculateRoot(link.rootId);
    if (link.shelfId) recalculateShelf(link.shelfId);

    db.timeline.unshift({
      id: nextId('tl'),
      kind: 'added',
      lead: 'Added',
      body: ` ${link.title} to ${link.rootName} → ${link.shelfName}`,
      createdAt: new Date().toISOString(),
      actionLabel: 'Open',
      actionTone: 'default',
      scope: 'personal',
    });

    return link;
  },

  'PATCH /links/:linkId': ({ params, body }) => {
    const link = db.links.find((l) => l.id === params.linkId) ?? notFound('Link');
    Object.assign(link, asRecord(body));

    // Re-resolve denormalised names if the link moved.
    const shelf = db.shelves.find((s) => s.id === link.shelfId);
    if (shelf) {
      link.shelfName = shelf.name;
      link.rootId = shelf.rootId;
      link.rootName = db.roots.find((r) => r.id === shelf.rootId)?.name ?? link.rootName;
    }

    recalculateRoot(link.rootId);
    recalculateShelf(link.shelfId);
    return link;
  },

  'POST /links/:linkId/archive': ({ params }) => {
    const link = db.links.find((l) => l.id === params.linkId) ?? notFound('Link');
    link.archived = true;
    recalculateRoot(link.rootId);
    recalculateShelf(link.shelfId);
    return link;
  },

  'POST /links/:linkId/move': ({ params, body }) => {
    const link = db.links.find((l) => l.id === params.linkId) ?? notFound('Link');
    const previousShelf = link.shelfId;
    const target = db.shelves.find((s) => s.id === str(body, 'shelfId'));
    if (!target) notFound('Shelf');

    link.shelfId = target.id;
    link.shelfName = target.name;
    link.rootId = target.rootId;
    link.rootName = db.roots.find((r) => r.id === target.rootId)?.name ?? link.rootName;

    recalculateShelf(previousShelf);
    recalculateShelf(target.id);
    recalculateRoot(link.rootId);
    return link;
  },

  'DELETE /links/:linkId': ({ params }) => {
    const link = db.links.find((l) => l.id === params.linkId);
    db.links = db.links.filter((l) => l.id !== params.linkId);
    if (link) {
      recalculateRoot(link.rootId);
      recalculateShelf(link.shelfId);
    }
    return null;
  },

  /* -------------------------------------------------------------- assistant */

  'GET /assistant/suggestions': () => db.suggestions,

  'POST /assistant/suggestions/:suggestionId/dismiss': ({ params }) => {
    db.suggestions = db.suggestions.filter((s) => s.id !== params.suggestionId);
    return null;
  },

  'POST /assistant/ask': ({ body }) => {
    const question = str(body, 'question');
    if (!question.trim()) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Ask a question first.',
        status: 422,
        fieldErrors: { question: 'Ask a question first.' },
      });
    }
    // The mock always answers with the handoff's example, but echoes the real
    // question so the screen reads correctly.
    return { ...seedAskAnswer, id: nextId('ask'), question };
  },

  'POST /assistant/auto-root': ({ body }) => {
    const url = str(body, 'url');
    const root = db.roots[0];
    const shelf = db.shelves.find((s) => s.rootId === root?.id);
    return {
      url,
      title: guessTitle(url),
      rootId: root?.id ?? '',
      rootName: root?.name ?? '',
      shelfId: shelf?.id ?? '',
      shelfName: shelf?.name ?? '',
      tags: ['paid', 'google'],
      confidence: 0.92,
    };
  },

  /* ---------------------------------------------------------- notifications */

  'GET /notifications': () => db.notifications,

  'POST /notifications/read-all': () => {
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
    return db.notifications;
  },

  'POST /notifications/:notificationId/read': ({ params }) => {
    const notification =
      db.notifications.find((n) => n.id === params.notificationId) ?? notFound('Notification');
    notification.read = true;
    return notification;
  },

  /* -------------------------------------------------------------- timeline */

  'GET /timeline': ({ query }) => {
    const scope = query.scope as string | undefined;
    if (!scope || scope === 'all') return db.timeline;
    return db.timeline.filter((event) => event.scope === scope);
  },

  /* ------------------------------------------------------------- workspace */

  'GET /workspace': () => db.workspace,

  'GET /workspace/members': () => db.workspace.members,

  'GET /workspace/invites': () => db.workspace.pendingInvites,

  'POST /workspace/invites': ({ body }) => {
    const email = str(body, 'email');
    const access = (str(body, 'access', 'edit') as AccessLevel) ?? 'edit';

    if (!email.includes('@')) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Enter a valid email address.',
        status: 422,
        fieldErrors: { email: 'Enter a valid email address.' },
      });
    }
    if (db.workspace.pendingInvites.some((i) => i.email === email)) {
      throw new ApiError({
        kind: 'conflict',
        message: `${email} has already been invited.`,
        status: 409,
      });
    }

    const invite = {
      id: nextId('inv'),
      email,
      access,
      invitedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    db.workspace.pendingInvites.push(invite);
    return invite;
  },

  'DELETE /workspace/invites/:inviteId': ({ params }) => {
    db.workspace.pendingInvites = db.workspace.pendingInvites.filter((i) => i.id !== params.inviteId);
    return null;
  },

  /* --------------------------------------------------------------- settings */

  'GET /settings': () => db.settings,

  'PATCH /settings': ({ body }) => {
    Object.assign(db.settings, asRecord(body));
    return db.settings;
  },
};

/** Cheap title inference so the quick-add sheet has something to show. */
function guessTitle(url: string): string {
  const host = url.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  const name = host.replace(/^www\./, '').split('.')[0] ?? 'Link';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Exported for the ask screen's starter chips. */
export const askSuggestions = seedAskSuggestions;

/** Used by the shelf picker in the manual add/edit form. */
export function allShelves(): Shelf[] {
  return db.shelves;
}
