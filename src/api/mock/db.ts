import type {
  AppNotification,
  AppSettings,
  ConnectedAccount,
  Link,
  Root,
  Shelf,
  Suggestion,
  TimelineEvent,
  User,
  Workspace,
} from '../schemas';
import {
  seedConnectedAccounts,
  seedCurrentWorkspaceId,
  seedFolderLinks,
  seedLinks,
  seedMergedDuplicates,
  seedNotifications,
  seedResumeLinkId,
  seedRoots,
  seedSettings,
  seedShelves,
  seedSuggestions,
  seedTimeline,
  seedUser,
  seedWorkspaces,
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
  /** Every workspace the user belongs to; the switcher moves between them. */
  workspaces: Workspace[];
  /** Which of `workspaces` the `/workspace*` endpoints read and write. */
  currentWorkspaceId: string;
  /**
   * The link Home's "Jump back in" card resumes to — the last one the user
   * opened. Seeded so the first Home matches the handoff, then rewritten by
   * `POST /links/:linkId/open` for the rest of the session.
   */
  resumeLinkId: string;
  /** Shared folder id → the link ids it holds. */
  folderLinks: Record<string, string[]>;
  /** Timeline event id → the archived link ids its "Undo" restores. */
  mergedDuplicates: Record<string, string[]>;
  settings: AppSettings;
  connectedAccounts: ConnectedAccount[];
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
  workspaces: clone(seedWorkspaces),
  currentWorkspaceId: seedCurrentWorkspaceId,
  resumeLinkId: seedResumeLinkId,
  folderLinks: clone(seedFolderLinks),
  mergedDuplicates: clone(seedMergedDuplicates),
  settings: clone(seedSettings),
  connectedAccounts: clone(seedConnectedAccounts),
  onboardingComplete: true,
};

/**
 * The workspace every `/workspace*` endpoint operates on. Falls back to the
 * first rather than throwing — a dangling id should degrade, not crash the app.
 */
export function currentWorkspace(): Workspace {
  return db.workspaces.find((w) => w.id === db.currentWorkspaceId) ?? db.workspaces[0];
}

export function resetDb() {
  db.user = clone(seedUser);
  db.roots = clone(seedRoots);
  db.shelves = clone(seedShelves);
  db.links = clone(seedLinks);
  db.notifications = clone(seedNotifications);
  db.timeline = clone(seedTimeline);
  db.suggestions = clone(seedSuggestions);
  db.workspaces = clone(seedWorkspaces);
  db.currentWorkspaceId = seedCurrentWorkspaceId;
  db.resumeLinkId = seedResumeLinkId;
  db.folderLinks = clone(seedFolderLinks);
  db.mergedDuplicates = clone(seedMergedDuplicates);
  db.settings = clone(seedSettings);
  db.connectedAccounts = clone(seedConnectedAccounts);
  db.onboardingComplete = true;
}

/** Empties the roots list so the zero-state Home (frame 8) can be exercised. */
export function clearRoots() {
  db.roots = [];
  db.shelves = [];
  db.links = [];
  // Nothing left to jump back into.
  db.resumeLinkId = '';
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

/**
 * Keeps the settings row's count in step with the connected-accounts list, so
 * connecting or disconnecting updates both screens.
 */
export function recalculateConnectedAccounts() {
  db.settings.connectedAccountCount = db.connectedAccounts.filter(
    (account) => account.status !== 'available',
  ).length;
}

/**
 * Keeps the workspace's derived counts honest after a member, invite or link
 * mutation. The header count is members *plus* outstanding invites — that's why
 * the design shows "Members 4" above three rows and one pending invite.
 */
export function recalculateWorkspace(workspace: Workspace = currentWorkspace()) {
  const memberIds = new Set(workspace.members.map((m) => m.id));

  workspace.memberCount = workspace.members.length + workspace.pendingInvites.length;

  for (const folder of workspace.sharedFolders) {
    // Someone removed from the workspace loses their folder access with it.
    folder.members = folder.members.filter((m) => memberIds.has(m.id));
    folder.memberCount = folder.members.length;
    folder.linkCount = folderLinkIds(folder.id).length;
  }
}

/** The live link ids in a shared folder — archived and deleted links dropped. */
export function folderLinkIds(folderId: string): string[] {
  return (db.folderLinks[folderId] ?? []).filter((linkId) =>
    db.links.some((link) => link.id === linkId && !link.archived),
  );
}

/** Recomputes a shelf's link count after a link mutation. */
export function recalculateShelf(shelfId: string) {
  const shelf = db.shelves.find((s) => s.id === shelfId);
  if (!shelf) return;
  shelf.linkCount = db.links.filter((l) => l.shelfId === shelfId && !l.archived).length;
}
