import type {
  AppNotification,
  AppSettings,
  Link,
  Root,
  Shelf,
  Suggestion,
  TimelineEvent,
  User,
  Workspace,
} from '../schemas';
import {
  seedLinks,
  seedNotifications,
  seedRoots,
  seedSettings,
  seedShelves,
  seedSuggestions,
  seedTimeline,
  seedUser,
  seedWorkspace,
} from './seed';

/**
 * In-memory database backing the mock server.
 *
 * Mutations (adding a link, archiving, inviting) write here so the app behaves
 * like a real client within a session. State resets on reload — that's
 * deliberate: persisting it would mean writing migration code we'd throw away
 * the moment a real backend lands.
 */

interface Db {
  user: User;
  roots: Root[];
  shelves: Shelf[];
  links: Link[];
  notifications: AppNotification[];
  timeline: TimelineEvent[];
  suggestions: Suggestion[];
  workspace: Workspace;
  settings: AppSettings;
  /** Cleared by the onboarding flow's "no roots yet" demo. */
  onboardingComplete: boolean;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const db: Db = {
  user: clone(seedUser),
  roots: clone(seedRoots),
  shelves: clone(seedShelves),
  links: clone(seedLinks),
  notifications: clone(seedNotifications),
  timeline: clone(seedTimeline),
  suggestions: clone(seedSuggestions),
  workspace: clone(seedWorkspace),
  settings: clone(seedSettings),
  onboardingComplete: true,
};

export function resetDb() {
  db.user = clone(seedUser);
  db.roots = clone(seedRoots);
  db.shelves = clone(seedShelves);
  db.links = clone(seedLinks);
  db.notifications = clone(seedNotifications);
  db.timeline = clone(seedTimeline);
  db.suggestions = clone(seedSuggestions);
  db.workspace = clone(seedWorkspace);
  db.settings = clone(seedSettings);
  db.onboardingComplete = true;
}

/** Empties the roots list so the zero-state Home (frame 8) can be exercised. */
export function clearRoots() {
  db.roots = [];
  db.shelves = [];
  db.links = [];
  db.onboardingComplete = false;
}

export function nextId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Keeps a root's denormalised counts honest after a link/shelf mutation. */
export function recalculateRoot(rootId: string) {
  const root = db.roots.find((r) => r.id === rootId);
  if (!root) return;
  const links = db.links.filter((l) => l.rootId === rootId && !l.archived);
  root.linkCount = links.length;
  root.shelfCount = db.shelves.filter((s) => s.rootId === rootId).length;
  root.deadLinkCount = links.filter((l) => l.status === 'dead').length;
}

/** Recomputes a shelf's link count after a link mutation. */
export function recalculateShelf(shelfId: string) {
  const shelf = db.shelves.find((s) => s.id === shelfId);
  if (!shelf) return;
  shelf.linkCount = db.links.filter((l) => l.shelfId === shelfId && !l.archived).length;
}
