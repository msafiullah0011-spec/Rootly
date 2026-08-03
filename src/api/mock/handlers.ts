import { ApiError } from '../errors';
import { accentNameSchema } from '../schemas';
import type { AccessLevel, Link, MemberRole, Shelf, Workspace } from '../schemas';
import {
  clearRoots,
  currentWorkspace,
  db,
  folderLinkIds,
  nextId,
  recalculateConnectedAccounts,
  recalculateRoot,
  recalculateShelf,
  recalculateWorkspace,
} from './db';
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

/** How long a timeline reply may be. */
const REPLY_MAX = 500;

/** Accents a new workspace picks from, in the order the switcher shows them. */
const WORKSPACE_ACCENTS = accentNameSchema.options;

/** `Al-Karam Studio` → `al-karam-studio`, for a shareable join URL. */
function joinSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace'
  );
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
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

  'GET /auth/profile': () => db.user,

  /**
   * Profile edits. The user's name and email show up on Home, in Settings and
   * on their workspace rows, so this writes through to the workspace member
   * records rather than letting the two drift apart.
   */
  'PATCH /auth/profile': ({ body }) => {
    const payload = asRecord(body);
    const name = str(body, 'name', db.user.name).trim();
    const email = str(body, 'email', db.user.email).trim();

    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = 'Your name can’t be empty.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = 'Enter a valid email address.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Check the highlighted fields.',
        status: 422,
        fieldErrors,
      });
    }

    db.user = {
      ...db.user,
      name,
      email,
      accent: (payload.accent as typeof db.user.accent) ?? db.user.accent,
    };

    for (const workspace of db.workspaces) {
      const self = workspace.members.find((member) => member.isCurrentUser);
      if (!self) continue;
      self.name = db.user.name;
      self.email = db.user.email;
      self.accent = db.user.accent;
    }

    return db.user;
  },

  /* ------------------------------------------------------------------ home */

  'GET /home/feed': () => {
    /**
     * Whatever was opened last, as long as it's still there — archiving or
     * deleting it falls back to the newest live link rather than resuming into
     * a 404.
     */
    const live = (link: Link | undefined): link is Link => Boolean(link && !link.archived);
    const tracked = db.links.find((l) => l.id === db.resumeLinkId);
    const resume = live(tracked) ? tracked : db.links.find((l) => !l.archived);

    // The card wears the shelf's identity, not the link's own accent — that's
    // what makes it read as "the Ads shelf, in mystore.pk" at a glance.
    const shelf = resume ? db.shelves.find((s) => s.id === resume.shelfId) : undefined;

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
            accent: shelf?.accent ?? resume.accent,
            icon: shelf?.icon ?? 'folder',
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

  'POST /roots/:rootId/shelves': ({ params, body }) => {
    const root = db.roots.find((r) => r.id === params.rootId) ?? notFound('Root');
    const payload = asRecord(body);
    const name = str(body, 'name').trim();

    if (!name) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Give this shelf a name.',
        status: 422,
        fieldErrors: { name: 'Give this shelf a name.' },
      });
    }
    if (db.shelves.some((s) => s.rootId === root.id && s.name.toLowerCase() === name.toLowerCase())) {
      throw new ApiError({
        kind: 'conflict',
        message: `${root.name} already has a shelf called ${name}.`,
        status: 409,
      });
    }

    const shelf: Shelf = {
      id: nextId('shelf'),
      rootId: root.id,
      name,
      accent: (payload.accent as Shelf['accent']) ?? root.accent,
      icon: (payload.icon as Shelf['icon']) ?? 'folder',
      linkCount: 0,
    };

    db.shelves.push(shelf);
    recalculateRoot(root.id);

    db.timeline.unshift({
      id: nextId('tl'),
      kind: 'added',
      lead: 'Added',
      body: ` the ${shelf.name} shelf to ${root.name}`,
      createdAt: new Date().toISOString(),
      actionLabel: 'Open',
      actionTone: 'default',
      actionKind: 'open',
      scope: 'personal',
      target: { type: 'shelf', rootId: shelf.rootId, shelfId: shelf.id },
    });

    return shelf;
  },

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

  'PATCH /shelves/:shelfId': ({ params, body }) => {
    const shelf = db.shelves.find((s) => s.id === params.shelfId) ?? notFound('Shelf');
    const payload = asRecord(body);

    if ('name' in payload) {
      const name = str(body, 'name').trim();
      if (!name) {
        throw new ApiError({
          kind: 'badRequest',
          message: 'Give this shelf a name.',
          status: 422,
          fieldErrors: { name: 'Give this shelf a name.' },
        });
      }
      // Same guard as creation — two shelves called "Ads" in one root would
      // make every picker ambiguous.
      if (
        db.shelves.some(
          (s) =>
            s.id !== shelf.id &&
            s.rootId === shelf.rootId &&
            s.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        const root = db.roots.find((r) => r.id === shelf.rootId);
        throw new ApiError({
          kind: 'conflict',
          message: `${root?.name ?? 'This root'} already has a shelf called ${name}.`,
          status: 409,
        });
      }
      payload.name = name;
    }

    Object.assign(shelf, payload);

    // The shelf name is denormalised onto every link that sits on it.
    for (const link of db.links) {
      if (link.shelfId === shelf.id) link.shelfName = shelf.name;
    }

    return shelf;
  },

  'DELETE /shelves/:shelfId': ({ params }) => {
    const shelf = db.shelves.find((s) => s.id === params.shelfId) ?? notFound('Shelf');

    db.shelves = db.shelves.filter((s) => s.id !== shelf.id);
    db.links = db.links.filter((l) => l.shelfId !== shelf.id);
    recalculateRoot(shelf.rootId);

    return null;
  },

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
      actionKind: 'open',
      scope: 'personal',
      target: { type: 'link', linkId: link.id },
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

  /**
   * "I looked at this." Home's "Jump back in" card reads the result, so opening
   * a link is what makes it the one you resume to next time.
   */
  'POST /links/:linkId/open': ({ params }) => {
    const link = db.links.find((l) => l.id === params.linkId) ?? notFound('Link');
    link.lastOpenedAt = new Date().toISOString();
    db.resumeLinkId = link.id;
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

  /**
   * Stands in for the model that reads a pasted URL and guesses where it goes.
   *
   * The guess is drawn from the links already saved: a URL on a host the user
   * has filed before lands on that same shelf, which is both a better
   * suggestion than "the first shelf" and the behaviour a real model would
   * approximate. Anything unrecognised falls back to the first shelf of the
   * first root, so the sheet always opens with something selected.
   */
  'POST /assistant/auto-root': ({ body }) => {
    const url = str(body, 'url');
    const host = hostOf(url);

    const sibling = host
      ? db.links.find((link) => !link.archived && hostOf(link.url) === host)
      : undefined;

    const shelf = sibling
      ? db.shelves.find((s) => s.id === sibling.shelfId)
      : db.shelves.find((s) => s.rootId === db.roots[0]?.id);
    const root = db.roots.find((r) => r.id === (shelf?.rootId ?? db.roots[0]?.id));

    return {
      url,
      title: sibling?.title ?? guessTitle(url),
      rootId: root?.id ?? '',
      rootName: root?.name ?? '',
      shelfId: shelf?.id ?? '',
      shelfName: shelf?.name ?? '',
      tags: sibling?.tags ?? [],
      confidence: sibling ? 0.94 : 0.62,
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

  'GET /timeline/:eventId': ({ params }) =>
    db.timeline.find((e) => e.id === params.eventId) ?? notFound('Activity'),

  /**
   * Reverses a merge: the duplicates it folded away come back, the original row
   * stops offering "Undo", and the reversal lands at the top of the feed as its
   * own event — that's what an activity log does, rather than erasing history.
   */
  'POST /timeline/:eventId/undo': ({ params }) => {
    const event = db.timeline.find((e) => e.id === params.eventId) ?? notFound('Activity');

    if (event.actionKind !== 'undo') {
      throw new ApiError({
        kind: 'conflict',
        message: "That activity can't be undone.",
        status: 409,
      });
    }

    const restored = (db.mergedDuplicates[event.id] ?? [])
      .map((linkId) => db.links.find((l) => l.id === linkId))
      .filter((link): link is Link => Boolean(link));

    if (restored.length === 0) {
      throw new ApiError({
        kind: 'conflict',
        message: 'Those duplicates are gone, so this merge can no longer be undone.',
        status: 409,
      });
    }

    for (const link of restored) link.archived = false;
    for (const shelfId of new Set(restored.map((l) => l.shelfId))) recalculateShelf(shelfId);
    for (const rootId of new Set(restored.map((l) => l.rootId))) recalculateRoot(rootId);
    delete db.mergedDuplicates[event.id];

    // The merge itself still happened — it just isn't reversible twice.
    event.actionKind = 'open';
    event.actionLabel = undefined;

    const [first] = restored;
    const undone = {
      id: nextId('tl'),
      kind: 'merged' as const,
      lead: 'Merge undone',
      body: ` — ${restored.length} duplicates restored to ${first.shelfName}`,
      createdAt: new Date().toISOString(),
      actionLabel: 'Open',
      actionTone: 'default' as const,
      actionKind: 'open' as const,
      scope: event.scope,
      target: { type: 'shelf' as const, rootId: first.rootId, shelfId: first.shelfId },
    };

    db.timeline.unshift(undone);
    return undone;
  },

  /** A reply is a new comment event on the same subject — threads aren't a thing yet. */
  'POST /timeline/:eventId/replies': ({ params, body }) => {
    const event = db.timeline.find((e) => e.id === params.eventId) ?? notFound('Activity');

    if (event.actionKind !== 'reply') {
      throw new ApiError({
        kind: 'conflict',
        message: "There's nothing to reply to here.",
        status: 409,
      });
    }

    const message = str(body, 'body').trim();
    if (!message) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Write a reply first.',
        status: 422,
        fieldErrors: { body: 'Write a reply first.' },
      });
    }
    if (message.length > REPLY_MAX) {
      throw new ApiError({
        kind: 'badRequest',
        message: `Replies are capped at ${REPLY_MAX} characters.`,
        status: 422,
        fieldErrors: { body: `Keep it under ${REPLY_MAX} characters.` },
      });
    }

    const reply = {
      id: nextId('tl'),
      kind: 'comment' as const,
      lead: 'You replied',
      body: ` “${truncate(message, 60)}”${event.trailingEmphasis ? ' on ' : ''}`,
      trailingEmphasis: event.trailingEmphasis,
      createdAt: new Date().toISOString(),
      actionLabel: event.target ? 'View' : undefined,
      actionTone: 'default' as const,
      actionKind: 'open' as const,
      scope: event.scope,
      target: event.target,
    };

    db.timeline.unshift(reply);
    return reply;
  },

  /* ------------------------------------------------------------- workspace */

  /** Every workspace the user belongs to, thinned down for the switcher. */
  'GET /workspaces': () =>
    db.workspaces.map((workspace) => {
      recalculateWorkspace(workspace);
      return {
        id: workspace.id,
        name: workspace.name,
        accent: workspace.accent,
        memberCount: workspace.memberCount,
        isCurrent: workspace.id === db.currentWorkspaceId,
        role: workspace.members.find((member) => member.isCurrentUser)?.role ?? 'member',
      };
    }),

  /**
   * A new workspace, with the signed-in user as its owner and nothing else in
   * it. Creating one also switches to it — a workspace you can't see is not
   * something anyone asked for.
   */
  'POST /workspaces': ({ body }) => {
    const name = str(body, 'name').trim();

    if (!name) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Give this workspace a name.',
        status: 422,
        fieldErrors: { name: 'Give this workspace a name.' },
      });
    }
    if (db.workspaces.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
      throw new ApiError({
        kind: 'conflict',
        message: `You're already in a workspace called ${name}.`,
        status: 409,
      });
    }

    const workspace: Workspace = {
      id: nextId('ws'),
      name,
      // Continue the accent rotation so a new workspace doesn't clash with the
      // one above it in the switcher.
      accent: WORKSPACE_ACCENTS[db.workspaces.length % WORKSPACE_ACCENTS.length],
      memberCount: 1,
      inviteUrl: `rootly.app/j/${joinSlug(name)}-${Math.random().toString(36).slice(2, 6)}`,
      members: [
        {
          id: db.user.id,
          name: db.user.name,
          email: db.user.email,
          accent: db.user.accent,
          role: 'owner',
          isCurrentUser: true,
        },
      ],
      sharedFolders: [],
      assignments: [],
      pendingInvites: [],
    };

    db.workspaces.push(workspace);
    db.currentWorkspaceId = workspace.id;
    recalculateWorkspace(workspace);

    return workspace;
  },

  'POST /workspaces/:workspaceId/activate': ({ params }) => {
    const workspace =
      db.workspaces.find((w) => w.id === params.workspaceId) ?? notFound('Workspace');
    db.currentWorkspaceId = workspace.id;
    recalculateWorkspace(workspace);
    return workspace;
  },

  'GET /workspace': () => {
    const workspace = currentWorkspace();
    recalculateWorkspace(workspace);
    // Completed assignments stay on the record but leave "Assigned to you" —
    // the list is what's outstanding, not a history.
    return { ...workspace, assignments: workspace.assignments.filter((a) => !a.done) };
  },

  'GET /workspace/members': () => currentWorkspace().members,

  /**
   * Role changes. The owner is fixed — transferring ownership is a flow of its
   * own, and the sheet doesn't offer it, so the server says no rather than
   * quietly leaving a workspace with two owners.
   */
  'PATCH /workspace/members/:memberId': ({ params, body }) => {
    const member =
      currentWorkspace().members.find((m) => m.id === params.memberId) ?? notFound('Member');
    const role = str(body, 'role') as MemberRole;

    if (!['owner', 'admin', 'member'].includes(role)) {
      throw new ApiError({ kind: 'badRequest', message: `${role} isn't a role.`, status: 422 });
    }
    if (member.role === 'owner' || role === 'owner') {
      throw new ApiError({
        kind: 'forbidden',
        message: "Ownership can't be changed from here yet.",
        status: 403,
      });
    }

    member.role = role;
    return member;
  },

  'DELETE /workspace/members/:memberId': ({ params }) => {
    const workspace = currentWorkspace();
    const member = workspace.members.find((m) => m.id === params.memberId) ?? notFound('Member');

    if (member.role === 'owner') {
      throw new ApiError({
        kind: 'forbidden',
        message: "The workspace owner can't be removed.",
        status: 403,
      });
    }

    workspace.members = workspace.members.filter((m) => m.id !== member.id);
    recalculateWorkspace(workspace);
    return null;
  },

  'GET /workspace/invites': () => currentWorkspace().pendingInvites,

  'POST /workspace/invites': ({ body }) => {
    const workspace = currentWorkspace();
    const email = str(body, 'email').trim();
    const access = (str(body, 'access', 'edit') as AccessLevel) ?? 'edit';

    if (!email.includes('@')) {
      throw new ApiError({
        kind: 'badRequest',
        message: 'Enter a valid email address.',
        status: 422,
        fieldErrors: { email: 'Enter a valid email address.' },
      });
    }
    if (workspace.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      throw new ApiError({
        kind: 'conflict',
        message: `${email} is already in ${workspace.name}.`,
        status: 409,
        fieldErrors: { email: 'They’re already a member.' },
      });
    }
    if (workspace.pendingInvites.some((i) => i.email.toLowerCase() === email.toLowerCase())) {
      throw new ApiError({
        kind: 'conflict',
        message: `${email} has already been invited.`,
        status: 409,
        fieldErrors: { email: 'This invite is already outstanding.' },
      });
    }

    const invite = {
      id: nextId('inv'),
      email,
      access,
      invitedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    workspace.pendingInvites.push(invite);
    recalculateWorkspace(workspace);
    return invite;
  },

  /**
   * Resending doesn't create a second invite — it re-stamps the existing one,
   * which is why the row's "Invited 2 days ago" resets to just now.
   */
  'POST /workspace/invites/:inviteId/resend': ({ params }) => {
    const workspace = currentWorkspace();
    const invite =
      workspace.pendingInvites.find((i) => i.id === params.inviteId) ?? notFound('Invite');

    invite.invitedAt = new Date().toISOString();
    return invite;
  },

  'DELETE /workspace/invites/:inviteId': ({ params }) => {
    const workspace = currentWorkspace();
    if (!workspace.pendingInvites.some((i) => i.id === params.inviteId)) notFound('Invite');

    workspace.pendingInvites = workspace.pendingInvites.filter((i) => i.id !== params.inviteId);
    recalculateWorkspace(workspace);
    return null;
  },

  /** Ticking an assignment off. Done ones drop out of "Assigned to you". */
  'PATCH /workspace/assignments/:assignmentId': ({ params, body }) => {
    const workspace = currentWorkspace();
    const assignment =
      workspace.assignments.find((a) => a.id === params.assignmentId) ?? notFound('Assignment');

    const payload = asRecord(body);
    assignment.done = typeof payload.done === 'boolean' ? payload.done : true;
    return assignment;
  },

  'GET /workspace/folders': () => {
    const workspace = currentWorkspace();
    recalculateWorkspace(workspace);
    return workspace.sharedFolders;
  },

  'GET /workspace/folders/:folderId': ({ params }) => {
    const workspace = currentWorkspace();
    recalculateWorkspace(workspace);
    return (
      workspace.sharedFolders.find((f) => f.id === params.folderId) ?? notFound('Shared folder')
    );
  },

  'GET /workspace/folders/:folderId/links': ({ params }) => {
    const folder = currentWorkspace().sharedFolders.find((f) => f.id === params.folderId);
    if (!folder) notFound('Shared folder');
    // Ordered by the folder's own list, not the link table's.
    return folderLinkIds(folder.id).map((linkId) => db.links.find((l) => l.id === linkId)!);
  },

  /* --------------------------------------------------------------- settings */

  'GET /settings': () => db.settings,

  'PATCH /settings': ({ body }) => {
    Object.assign(db.settings, asRecord(body));
    return db.settings;
  },

  'GET /settings/connected-accounts': () => db.connectedAccounts,

  /**
   * Stands in for the OAuth round trip: the real flow hands back an identity,
   * so the mock signs the account in as the current user.
   */
  'POST /settings/connected-accounts/:accountId/connect': ({ params }) => {
    const account =
      db.connectedAccounts.find((a) => a.id === params.accountId) ?? notFound('Account');
    const nowIso = new Date().toISOString();

    account.status = 'connected';
    account.accountLabel = account.accountLabel ?? db.user.email;
    account.connectedAt = account.connectedAt ?? nowIso;
    account.syncedAt = nowIso;
    recalculateConnectedAccounts();

    return account;
  },

  'DELETE /settings/connected-accounts/:accountId': ({ params }) => {
    const account =
      db.connectedAccounts.find((a) => a.id === params.accountId) ?? notFound('Account');

    account.status = 'available';
    account.accountLabel = undefined;
    account.connectedAt = undefined;
    account.syncedAt = undefined;
    account.linkCount = 0;
    recalculateConnectedAccounts();

    return account;
  },
};

/** The bare hostname, used to spot a URL the user has already filed somewhere. */
function hostOf(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    ?.replace(/^www\./i, '')
    .toLowerCase() ?? '';
}

/** Cheap title inference so the quick-add sheet has something to show. */
function guessTitle(url: string): string {
  const name = hostOf(url).split('.')[0];
  if (!name) return 'Untitled link';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Exported for the ask screen's starter chips. */
export const askSuggestions = seedAskSuggestions;

/** Used by the shelf picker in the manual add/edit form. */
export function allShelves(): Shelf[] {
  return db.shelves;
}
