import type {
  AppNotification,
  AppSettings,
  AskAnswer,
  Link,
  Root,
  Shelf,
  Suggestion,
  TimelineEvent,
  User,
  Workspace,
} from '../schemas';

/**
 * Seed data transcribed from the design handoff.
 *
 * Copy, counts, names and colours match `Rootly.dc.html` frame for frame, so
 * the running app can be diffed against the reference side by side. Timestamps
 * are relative to boot rather than hard-coded, so "2h ago" stays "2h ago".
 */

const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(now + n * 86_400_000).toISOString();

export const seedUser: User = {
  id: 'user_umar',
  name: 'Umar Farooq',
  email: 'umar@mystore.pk',
  accent: 'lavender',
  plan: 'pro',
};

export const seedRoots: Root[] = [
  {
    id: 'root_mystore',
    name: 'mystore.pk',
    accent: 'pink',
    icon: 'store',
    linkCount: 18,
    shelfCount: 5,
    deadLinkCount: 0,
    memberCount: 10,
    members: [
      { id: 'm_g', initial: 'G', accent: 'pink' },
      { id: 'm_a', initial: 'A', accent: 'blue' },
      { id: 'm_s', initial: 'S', accent: 'yellow' },
    ],
  },
  {
    id: 'root_head_office',
    name: 'Head Office',
    accent: 'blue',
    icon: 'house',
    linkCount: 22,
    shelfCount: 6,
    deadLinkCount: 3,
    memberCount: 12,
    members: [
      { id: 'm_c', initial: 'c', accent: 'green' },
      { id: 'm_x', initial: '!', accent: 'red' },
      { id: 'm_s2', initial: 'S', accent: 'lavender' },
    ],
  },
  {
    id: 'root_alkaram',
    name: 'Al-Karam',
    accent: 'lavender',
    icon: 'store',
    linkCount: 14,
    shelfCount: 3,
    deadLinkCount: 0,
    memberCount: 4,
    members: [
      { id: 'm_k', initial: 'K', accent: 'yellow' },
      { id: 'm_r', initial: 'R', accent: 'green' },
    ],
  },
  {
    id: 'root_personal',
    name: 'Personal',
    accent: 'green',
    icon: 'person',
    linkCount: 14,
    shelfCount: 4,
    deadLinkCount: 0,
    memberCount: 14,
    members: [
      { id: 'm_y', initial: 'Y', accent: 'lavender' },
      { id: 'm_n', initial: 'N', accent: 'blue' },
    ],
  },
];

export const seedShelves: Shelf[] = [
  { id: 'shelf_ads', rootId: 'root_mystore', name: 'Ads', accent: 'pink', icon: 'megaphone', linkCount: 12 },
  { id: 'shelf_analytics', rootId: 'root_mystore', name: 'Analytics', accent: 'blue', icon: 'chart', linkCount: 8 },
  { id: 'shelf_accounts', rootId: 'root_mystore', name: 'Accounts', accent: 'yellow', icon: 'card', linkCount: 6 },
  { id: 'shelf_infra', rootId: 'root_mystore', name: 'Infrastructure', accent: 'green', icon: 'server', linkCount: 9 },
  { id: 'shelf_docs', rootId: 'root_mystore', name: 'Docs', accent: 'lavender', icon: 'file', linkCount: 5 },

  { id: 'shelf_billing', rootId: 'root_head_office', name: 'Billing', accent: 'green', icon: 'card', linkCount: 7 },
  { id: 'shelf_ho_docs', rootId: 'root_head_office', name: 'Docs', accent: 'lavender', icon: 'file', linkCount: 8 },
  { id: 'shelf_ho_infra', rootId: 'root_head_office', name: 'Infrastructure', accent: 'blue', icon: 'server', linkCount: 7 },

  { id: 'shelf_ak_ads', rootId: 'root_alkaram', name: 'Ads', accent: 'pink', icon: 'megaphone', linkCount: 6 },
  { id: 'shelf_ak_docs', rootId: 'root_alkaram', name: 'Docs', accent: 'lavender', icon: 'file', linkCount: 8 },

  { id: 'shelf_p_finance', rootId: 'root_personal', name: 'Finance', accent: 'yellow', icon: 'card', linkCount: 5 },
  { id: 'shelf_p_reading', rootId: 'root_personal', name: 'Reading', accent: 'blue', icon: 'file', linkCount: 9 },
];

export const seedLinks: Link[] = [
  {
    id: 'link_google_ads',
    rootId: 'root_mystore',
    rootName: 'mystore.pk',
    shelfId: 'shelf_ads',
    shelfName: 'Ads',
    title: 'Google Ads',
    url: 'https://ads.google.com/aw/campaigns',
    description: 'Main search & PMax campaigns for the store. Spend ↑ 12% this week.',
    accent: 'pink',
    status: 'live',
    loginEmail: 'ads@mystore.pk',
    tags: ['paid', 'google'],
    billing: { renewsAt: daysAhead(12), cardLast4: '4471' },
    aiSummary:
      'Where you manage paid search and Performance Max for the store. This account owns conversion tracking used by GA4 and Meta.',
    related: [
      { id: 'link_ga4', title: 'GA4 property', reason: 'shares conversion tags', accent: 'blue', glyph: '4' },
      { id: 'link_stripe', title: 'Stripe', reason: 'same billing card', accent: 'yellow', glyph: 'S' },
    ],
    checkedAt: hoursAgo(2),
    lastOpenedAt: hoursAgo(2),
    archived: false,
  },
  {
    id: 'link_meta',
    rootId: 'root_mystore',
    rootName: 'mystore.pk',
    shelfId: 'shelf_ads',
    shelfName: 'Ads',
    title: 'Meta Business Suite',
    url: 'https://business.facebook.com',
    description: 'Instagram + Facebook ad sets. 2 ads pending review since Friday.',
    accent: 'blue',
    status: 'slow',
    loginEmail: 'meta@mystore.pk',
    tags: ['paid', 'social'],
    related: [],
    checkedAt: hoursAgo(6),
    lastOpenedAt: daysAgo(1),
    archived: false,
  },
  {
    id: 'link_tiktok',
    rootId: 'root_mystore',
    rootName: 'mystore.pk',
    shelfId: 'shelf_ads',
    shelfName: 'Ads',
    title: 'TikTok Ads Manager',
    url: 'https://ads.tiktok.com',
    description: 'Login redirects to a 404 — account may have been suspended.',
    // Dead links render a neutral sand tile regardless of accent — the card
    // derives that from `status`, so this value is only used if it revives.
    accent: 'blue',
    status: 'dead',
    loginEmail: 'ads@mystore.pk',
    tags: ['paid'],
    related: [],
    checkedAt: hoursAgo(3),
    lastOpenedAt: daysAgo(14),
    archived: false,
  },
  {
    id: 'link_search_console',
    rootId: 'root_mystore',
    rootName: 'mystore.pk',
    shelfId: 'shelf_ads',
    shelfName: 'Ads',
    title: 'Search Console',
    url: 'https://search.google.com/search-console',
    description: 'Organic impressions steady. 1 coverage issue flagged on /sale.',
    accent: 'green',
    status: 'live',
    loginEmail: 'seo@mystore.pk',
    tags: ['seo', 'google'],
    related: [],
    checkedAt: hoursAgo(8),
    lastOpenedAt: daysAgo(2),
    archived: false,
  },
  {
    id: 'link_ga4',
    rootId: 'root_mystore',
    rootName: 'mystore.pk',
    shelfId: 'shelf_analytics',
    shelfName: 'Analytics',
    title: 'GA4 property',
    url: 'https://ga.google.com/analytics',
    description: 'Feeds conversion data into Google Ads.',
    accent: 'blue',
    status: 'live',
    loginEmail: 'analytics@mystore.pk',
    notes: 'Feeds conversion data into Google Ads. Ask Sana before changing attribution.',
    tags: ['data', 'reporting'],
    related: [],
    checkedAt: hoursAgo(4),
    lastOpenedAt: daysAgo(1),
    archived: false,
  },
  {
    id: 'link_stripe',
    rootId: 'root_mystore',
    rootName: 'mystore.pk',
    shelfId: 'shelf_accounts',
    shelfName: 'Accounts',
    title: 'Stripe dashboard',
    url: 'https://dashboard.stripe.com',
    description: 'Payouts, disputes and the shared billing card.',
    accent: 'yellow',
    status: 'live',
    loginEmail: 'billing@mystore.pk',
    tags: ['billing'],
    billing: { renewsAt: daysAhead(30), cardLast4: '4471' },
    related: [],
    checkedAt: minutesAgo(12),
    lastOpenedAt: minutesAgo(12),
    archived: false,
  },
  {
    id: 'link_stormfiber',
    rootId: 'root_head_office',
    rootName: 'Head Office',
    shelfId: 'shelf_billing',
    shelfName: 'Billing',
    title: 'StormFiber portal',
    url: 'https://customer.stormfiber.com',
    description: 'Karachi office internet billing and usage.',
    accent: 'green',
    status: 'live',
    loginEmail: 'accounts@headoffice.pk',
    tags: ['utilities'],
    billing: { renewsAt: daysAhead(3), cardLast4: '2210' },
    related: [],
    checkedAt: hoursAgo(20),
    lastOpenedAt: daysAgo(5),
    archived: false,
  },
  {
    id: 'link_cpanel',
    rootId: 'root_head_office',
    rootName: 'Head Office',
    shelfId: 'shelf_ho_infra',
    shelfName: 'Infrastructure',
    title: 'cPanel — Hostinger',
    url: 'https://hpanel.hostinger.com',
    description: 'Mail and DNS for the head office domain.',
    accent: 'lavender',
    status: 'live',
    loginEmail: 'it@headoffice.pk',
    tags: ['hosting'],
    related: [],
    checkedAt: daysAgo(1),
    lastOpenedAt: daysAgo(6),
    archived: false,
  },
];

/** The most-recently-opened link, surfaced by the "Jump back in" card. */
export const seedResumeLinkId = 'link_meta';

export const seedSuggestions: Suggestion[] = [
  {
    id: 'sug_stale',
    body: "4 links in Head Office haven't been opened in 90+ days. Archive them?",
    emphasis: 'Head Office',
    actionLabel: 'Review',
    kind: 'archive',
    rootId: 'root_head_office',
  },
  {
    id: 'sug_duplicate',
    body: '1 duplicate in Ads — “Google Ads” saved twice.',
    emphasis: 'Ads',
    actionLabel: 'Merge',
    kind: 'merge',
    rootId: 'root_mystore',
  },
];

export const seedAskAnswer: AskAnswer = {
  id: 'ask_1',
  question: 'Where do I pay for the Karachi office internet?',
  answer:
    'You pay through the StormFiber customer portal, billed to accounts@headoffice.pk. The next invoice is due 3 Aug.',
  emphasis: ['StormFiber', 'accounts@headoffice.pk', '3 Aug'],
  citations: [
    {
      linkId: 'link_stormfiber',
      title: 'StormFiber portal',
      path: 'Head Office → Billing',
      accent: 'green',
      initial: 'S',
    },
  ],
};

export const seedAskSuggestions = [
  'The ad account we onboarded in March',
  'Which Gmail owns the GA4 property?',
  'All renewals due this month',
];

export const seedNotifications: AppNotification[] = [
  {
    id: 'notif_dead',
    kind: 'dead_link',
    title: 'Dead link',
    body: 'TikTok Ads Manager in mystore.pk → Ads returns a 404. Archive it?',
    emphasis: 'TikTok Ads Manager',
    actionLabel: 'Review link',
    createdAt: hoursAgo(2),
    read: false,
  },
  {
    id: 'notif_renewal',
    kind: 'renewal',
    title: 'Renewal in 6 days',
    body: 'Google Ads billing renews 12 Aug on card •• 4471.',
    emphasis: 'Google Ads',
    actionLabel: 'View link',
    createdAt: hoursAgo(5),
    read: false,
  },
  {
    id: 'notif_duplicate',
    kind: 'duplicate',
    title: 'Duplicate found',
    body: '“Google Ads” is saved twice in Ads. Merge into one?',
    emphasis: 'Ads',
    actionLabel: 'Merge',
    createdAt: daysAgo(3),
    read: false,
  },
  {
    id: 'notif_digest',
    kind: 'digest',
    title: 'Weekly digest',
    body: 'Cleaned up Head Office — 4 stale links archived.',
    createdAt: daysAgo(5),
    read: true,
  },
];

export const seedTimeline: TimelineEvent[] = [
  {
    id: 'tl_added',
    kind: 'added',
    lead: 'Added',
    body: ' Stripe dashboard to mystore.pk → Accounts',
    createdAt: minutesAgo(12),
    actionLabel: 'Open',
    actionTone: 'default',
    scope: 'personal',
  },
  {
    id: 'tl_ai',
    kind: 'ai_summary',
    lead: 'AI summary',
    body: ' written for “GA4 property” — tracks store conversions',
    createdAt: hoursAgo(1),
    actionLabel: 'View',
    actionTone: 'default',
    scope: 'personal',
  },
  {
    id: 'tl_dead',
    kind: 'dead_link',
    lead: 'Dead link',
    body: ' detected — TikTok Ads Manager returns 404',
    createdAt: hoursAgo(3),
    actionLabel: 'Fix',
    actionTone: 'danger',
    scope: 'personal',
  },
  {
    id: 'tl_merged',
    kind: 'merged',
    lead: 'Merged',
    body: ' 2 duplicates of “Google Ads” in Ads',
    createdAt: daysAgo(1),
    actionLabel: 'Undo',
    actionTone: 'default',
    scope: 'team',
  },
  {
    id: 'tl_renamed',
    kind: 'renamed',
    lead: 'Shelf renamed',
    body: ' “Finance” → “Accounts” in mystore.pk',
    createdAt: daysAgo(1),
    actionTone: 'default',
    scope: 'team',
  },
  {
    id: 'tl_archived',
    kind: 'archived',
    lead: '',
    body: 'Archived 4 stale links in ',
    trailingEmphasis: 'Head Office',
    createdAt: daysAgo(4),
    actionTone: 'default',
    scope: 'personal',
  },
  {
    id: 'tl_comment',
    kind: 'comment',
    lead: '',
    body: 'Sana commented on ',
    trailingEmphasis: 'cPanel — Hostinger',
    createdAt: daysAgo(6),
    actionLabel: 'Reply',
    actionTone: 'default',
    scope: 'team',
  },
];

export const seedWorkspace: Workspace = {
  id: 'ws_mystore',
  name: 'mystore.pk',
  accent: 'pink',
  memberCount: 4,
  inviteUrl: 'rootly.app/j/mystore-8fk2',
  members: [
    {
      id: 'user_umar',
      name: 'Umar Farooq',
      email: 'umar@mystore.pk',
      accent: 'lavender',
      role: 'owner',
      isCurrentUser: true,
    },
    {
      id: 'user_sana',
      name: 'Sana Malik',
      email: 'sana@mystore.pk',
      accent: 'blue',
      role: 'admin',
      isCurrentUser: false,
    },
    {
      id: 'user_bilal',
      name: 'Bilal Ahmed',
      email: 'bilal@mystore.pk',
      accent: 'yellow',
      role: 'member',
      isCurrentUser: false,
    },
  ],
  sharedFolders: [
    { id: 'sf_ads', name: 'Ads', accent: 'pink', icon: 'megaphone', linkCount: 5, memberCount: 3 },
    { id: 'sf_analytics', name: 'Analytics', accent: 'blue', icon: 'chart', linkCount: 4, memberCount: 2 },
  ],
  assignments: [
    {
      id: 'as_review',
      title: 'Review 2 bookmarks in Accounts',
      assignedBy: 'Sana',
      dueLabel: 'due Fri',
    },
  ],
  pendingInvites: [
    { id: 'inv_hina', email: 'hina@mystore.pk', access: 'edit', invitedAt: daysAgo(2), status: 'pending' },
  ],
};

export const seedSettings: AppSettings = {
  notificationsEnabled: true,
  connectedAccountCount: 6,
  planRenewsAt: daysAhead(32),
};
