import { z } from 'zod';

/**
 * The API contract, expressed once.
 *
 * These schemas are the single source of truth: every response is parsed
 * through them (see `http.ts`) and every domain type is inferred from them, so
 * a backend shape change surfaces as a typed validation error rather than an
 * `undefined is not an object` crash three components deep.
 *
 * When you wire up the real API, this is the file to reconcile with its spec.
 */

export const accentNameSchema = z.enum(['pink', 'blue', 'yellow', 'green', 'lavender', 'red']);
export type AccentNameValue = z.infer<typeof accentNameSchema>;

/** Shelf/root glyphs. Maps to a Lucide icon in `@/components/icons`. */
export const iconKeySchema = z.enum([
  'megaphone',
  'chart',
  'card',
  'server',
  'file',
  'store',
  'house',
  'person',
  'star',
  'folder',
]);
export type IconKey = z.infer<typeof iconKeySchema>;

export const linkStatusSchema = z.enum(['live', 'slow', 'dead']);
export type LinkStatus = z.infer<typeof linkStatusSchema>;

export const memberRoleSchema = z.enum(['owner', 'admin', 'member']);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const accessLevelSchema = z.enum(['edit', 'view']);
export type AccessLevel = z.infer<typeof accessLevelSchema>;

/* ------------------------------------------------------------------ people */

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  accent: accentNameSchema,
  plan: z.enum(['free', 'pro']).default('free'),
});
export type User = z.infer<typeof userSchema>;

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  accent: accentNameSchema,
  role: memberRoleSchema,
  isCurrentUser: z.boolean().default(false),
});
export type Member = z.infer<typeof memberSchema>;

/** Trimmed member used in the overlapping avatar stacks on root rows. */
export const memberAvatarSchema = z.object({
  id: z.string(),
  initial: z.string(),
  accent: accentNameSchema,
});
export type MemberAvatar = z.infer<typeof memberAvatarSchema>;

/* ------------------------------------------------------------------- roots */

export const rootSchema = z.object({
  id: z.string(),
  name: z.string(),
  accent: accentNameSchema,
  icon: iconKeySchema.default('store'),
  linkCount: z.number(),
  shelfCount: z.number(),
  deadLinkCount: z.number().default(0),
  members: z.array(memberAvatarSchema).default([]),
  /** Total member count, which can exceed `members.length` (the `+N` chip). */
  memberCount: z.number().default(0),
});
export type Root = z.infer<typeof rootSchema>;

export const shelfSchema = z.object({
  id: z.string(),
  rootId: z.string(),
  name: z.string(),
  accent: accentNameSchema,
  icon: iconKeySchema,
  linkCount: z.number(),
});
export type Shelf = z.infer<typeof shelfSchema>;

/* ------------------------------------------------------------------- links */

export const linkBillingSchema = z.object({
  renewsAt: z.string(),
  cardLast4: z.string(),
});

export const relatedLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  accent: accentNameSchema,
  glyph: z.string(),
});
export type RelatedLink = z.infer<typeof relatedLinkSchema>;

export const linkSchema = z.object({
  id: z.string(),
  rootId: z.string(),
  rootName: z.string(),
  shelfId: z.string(),
  shelfName: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string().default(''),
  accent: accentNameSchema,
  status: linkStatusSchema,
  loginEmail: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  billing: linkBillingSchema.optional(),
  aiSummary: z.string().optional(),
  related: z.array(relatedLinkSchema).default([]),
  checkedAt: z.string().optional(),
  lastOpenedAt: z.string().optional(),
  archived: z.boolean().default(false),
});
export type Link = z.infer<typeof linkSchema>;

/** The "Jump back in" card on Home. */
export const resumeLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  rootName: z.string(),
  shelfName: z.string(),
  accent: accentNameSchema,
  icon: iconKeySchema,
});
export type ResumeLink = z.infer<typeof resumeLinkSchema>;

/* --------------------------------------------------------------- assistant */

export const suggestionSchema = z.object({
  id: z.string(),
  /** Full sentence; `emphasis` is the substring rendered bold. */
  body: z.string(),
  emphasis: z.string().optional(),
  actionLabel: z.string(),
  kind: z.enum(['archive', 'merge', 'review']),
  rootId: z.string().optional(),
});
export type Suggestion = z.infer<typeof suggestionSchema>;

export const askCitationSchema = z.object({
  linkId: z.string(),
  title: z.string(),
  path: z.string(),
  accent: accentNameSchema,
  initial: z.string(),
});

export const askAnswerSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  /** Substrings of `answer` to render bold, in the order they appear. */
  emphasis: z.array(z.string()).default([]),
  citations: z.array(askCitationSchema).default([]),
});
export type AskAnswer = z.infer<typeof askAnswerSchema>;

/* ----------------------------------------------------------------- targets */

/**
 * Where something in the app points. Anything that references a place in the
 * hierarchy — a timeline row, an alert, a workspace assignment — carries one of
 * these three, and `hrefForTarget` turns it into a route.
 *
 * Absent when there's nothing to open: those rows say so rather than
 * navigating nowhere.
 */
export const targetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('link'), linkId: z.string() }),
  z.object({ type: z.literal('shelf'), rootId: z.string(), shelfId: z.string() }),
  z.object({ type: z.literal('root'), rootId: z.string() }),
]);
export type Target = z.infer<typeof targetSchema>;

/* ----------------------------------------------------------- notifications */

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.enum(['dead_link', 'renewal', 'duplicate', 'digest']),
  title: z.string(),
  body: z.string(),
  emphasis: z.string().optional(),
  actionLabel: z.string().optional(),
  createdAt: z.string(),
  read: z.boolean().default(false),
  /** What the card and its action open. */
  target: targetSchema.optional(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

/* --------------------------------------------------------------- timeline */

export const timelineKindSchema = z.enum([
  'added',
  'ai_summary',
  'dead_link',
  'merged',
  'renamed',
  'archived',
  'comment',
]);
export type TimelineKind = z.infer<typeof timelineKindSchema>;

/** Where the row's action lands. See `targetSchema`. */
export const timelineTargetSchema = targetSchema;
export type TimelineTarget = Target;

/**
 * What the row's action *does*, as opposed to what it says. `open` navigates to
 * the target; the other two hit an endpoint, so the server decides whether the
 * action is still available — an undone merge comes back as `open`.
 */
export const timelineActionKindSchema = z.enum(['open', 'undo', 'reply']);
export type TimelineActionKind = z.infer<typeof timelineActionKindSchema>;

export const timelineEventSchema = z.object({
  id: z.string(),
  kind: timelineKindSchema,
  /** Bold lead-in, e.g. "Added". */
  lead: z.string(),
  /** Remainder of the sentence. */
  body: z.string(),
  /** Optional bold tail, used by the "archived"/"comment" variants. */
  trailingEmphasis: z.string().optional(),
  createdAt: z.string(),
  actionLabel: z.string().optional(),
  /** `danger` renders the action in red, per the "Fix" affordance. */
  actionTone: z.enum(['default', 'danger']).default('default'),
  actionKind: timelineActionKindSchema.default('open'),
  scope: z.enum(['personal', 'team']).default('personal'),
  target: timelineTargetSchema.optional(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

/* --------------------------------------------------------------- workspace */

export const sharedFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  accent: accentNameSchema,
  icon: iconKeySchema,
  linkCount: z.number(),
  memberCount: z.number(),
  /** The people the folder is shared with, for the tile's avatar stack. */
  members: z.array(memberAvatarSchema).default([]),
});
export type SharedFolder = z.infer<typeof sharedFolderSchema>;

export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  assignedBy: z.string(),
  dueLabel: z.string(),
  /** What "Start" opens. Same shape as a timeline row's target. */
  target: targetSchema.optional(),
  /** Done assignments drop off the list, but the server still returns them. */
  done: z.boolean().default(false),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const inviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  access: accessLevelSchema,
  invitedAt: z.string(),
  status: z.enum(['pending', 'accepted']).default('pending'),
});
export type Invite = z.infer<typeof inviteSchema>;

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  accent: accentNameSchema,
  memberCount: z.number(),
  inviteUrl: z.string(),
  members: z.array(memberSchema).default([]),
  sharedFolders: z.array(sharedFolderSchema).default([]),
  assignments: z.array(assignmentSchema).default([]),
  pendingInvites: z.array(inviteSchema).default([]),
});
export type Workspace = z.infer<typeof workspaceSchema>;

/**
 * A row in the workspace switcher. Deliberately thinner than `Workspace` — the
 * switcher only needs enough to draw the list, and loading four full workspaces
 * to render four lines would be wasteful.
 */
export const workspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  accent: accentNameSchema,
  memberCount: z.number(),
  /** The workspace the rest of the app is currently reading. */
  isCurrent: z.boolean().default(false),
  /** Role the signed-in user holds here — shown as the row's badge. */
  role: memberRoleSchema.default('member'),
});
export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;

/* -------------------------------------------------------------------- auth */

export const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
  /** True when the user still needs to create their first root. */
  needsOnboarding: z.boolean().default(false),
});
export type Session = z.infer<typeof sessionSchema>;

/* ---------------------------------------------------------------- settings */

export const settingsSchema = z.object({
  notificationsEnabled: z.boolean().default(true),
  connectedAccountCount: z.number().default(0),
  planRenewsAt: z.string().optional(),
});
export type AppSettings = z.infer<typeof settingsSchema>;

/**
 * `available` is a provider the user hasn't connected yet. It shares the shape
 * of a live connection deliberately — the screen renders one list, and a
 * connect/disconnect only flips this field.
 */
export const connectedAccountStatusSchema = z.enum(['connected', 'expired', 'available']);
export type ConnectedAccountStatus = z.infer<typeof connectedAccountStatusSchema>;

export const connectedAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Why the account matters — "Ads and Analytics". */
  purpose: z.string(),
  /** The signed-in identity. Absent until the account is connected. */
  accountLabel: z.string().optional(),
  /** Resolved through `iconForKey`, so any glyph in the vocabulary works. */
  icon: z.string().default('link'),
  accent: accentNameSchema,
  status: connectedAccountStatusSchema.default('available'),
  /** Links whose logins live behind this account. */
  linkCount: z.number().default(0),
  connectedAt: z.string().optional(),
  syncedAt: z.string().optional(),
});
export type ConnectedAccount = z.infer<typeof connectedAccountSchema>;

/* ------------------------------------------------------------ collections */

export const rootListSchema = z.array(rootSchema);
export const shelfListSchema = z.array(shelfSchema);
export const linkListSchema = z.array(linkSchema);
export const notificationListSchema = z.array(notificationSchema);
export const memberListSchema = z.array(memberSchema);
export const timelineListSchema = z.array(timelineEventSchema);
export const suggestionListSchema = z.array(suggestionSchema);
export const connectedAccountListSchema = z.array(connectedAccountSchema);
export const inviteListSchema = z.array(inviteSchema);
export const workspaceSummaryListSchema = z.array(workspaceSummarySchema);

/** Everything Home needs, in one round trip. */
export const homeFeedSchema = z.object({
  greetingName: z.string(),
  user: userSchema,
  roots: rootListSchema,
  resume: resumeLinkSchema.nullable().default(null),
  suggestion: suggestionSchema.nullable().default(null),
});
export type HomeFeed = z.infer<typeof homeFeedSchema>;
