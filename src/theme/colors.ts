/**
 * Rootly colour tokens — transcribed verbatim from the design handoff.
 *
 * Nothing outside this directory should contain a hex literal. If a screen
 * needs a colour that isn't here, add it here first.
 */

/** Raw palette. Prefer the semantic groups below when consuming. */
export const palette = {
  /** Gallery canvas — only used behind the design reference, not in-app. */
  canvas: '#EAE0CE',
  /** Warm cream — the primary screen background. */
  cream: '#FBF3E7',
  /** Near-black used for text, dark cards and primary buttons. */
  ink: '#111111',
  /** Secondary text, inactive icons, meta lines. */
  inkMuted: '#6B6660',
  /** Placeholders and disabled glyphs. */
  inkFaint: '#9A938A',
  white: '#FFFFFF',
  /** Segmented-control track, overflow avatars, neutral badges. */
  sand: '#EDE6D8',
  /** Inline tag/meta pills. */
  chipBeige: '#F6EFE1',
} as const;

/**
 * Accent palette. Roots, shelves and avatars rotate through these in order —
 * see `accentOrder` / `accentForKey` in `@/lib/format`.
 */
export const accents = {
  pink: '#F7B6D6',
  blue: '#A9C6F0',
  yellow: '#F2D45C',
  green: '#9CB55F',
  lavender: '#D9C4F5',
  red: '#E4574B',
} as const;

export type AccentName = keyof typeof accents;

/** Ordered accent rotation, matching the splash ring's colour sequence. */
export const accentOrder: AccentName[] = ['pink', 'blue', 'yellow', 'green', 'lavender'];

/**
 * Some accents are dark enough to need white glyphs on top; the rest keep ink.
 * Transcribed from the handoff rather than computed, so it matches exactly.
 */
export const accentForeground: Record<AccentName, string> = {
  pink: palette.ink,
  blue: palette.ink,
  yellow: palette.ink,
  green: palette.white,
  lavender: palette.ink,
  red: palette.white,
};

/**
 * Link health. Note `slow` deliberately pairs amber text with a yellow dot —
 * that mismatch is in the design, not a mistake.
 */
export const status = {
  live: { text: '#9CB55F', dot: '#9CB55F' },
  slow: { text: '#C79A1E', dot: '#F2D45C' },
  dead: { text: '#E4574B', dot: '#E4574B' },
  pending: { text: '#F2A63C', dot: '#F2A63C' },
} as const;

export type StatusName = keyof typeof status;

/** Translucent layers — kept as literals because RN has no colour-mix. */
export const alpha = {
  /** 1px hairline on white cards. */
  hairline: 'rgba(0,0,0,0.06)',
  /** Standard input / secondary-button border. */
  border: 'rgba(0,0,0,0.1)',
  /** Slightly stronger border on circular icon buttons. */
  borderStrong: 'rgba(0,0,0,0.12)',
  /** Social sign-in buttons. */
  borderHeavy: 'rgba(0,0,0,0.16)',
  /** Dashed pending-invite border. */
  borderDashed: 'rgba(0,0,0,0.18)',
  /** Bubble behind icons on pink cards. */
  onPinkBubble: 'rgba(0,0,0,0.1)',
  /** Meta text on pink cards. */
  onPinkMuted: 'rgba(0,0,0,0.5)',
  onPinkMutedStrong: 'rgba(0,0,0,0.55)',
  /** Text and surfaces on ink-coloured cards. */
  onInkStrong: 'rgba(255,255,255,0.6)',
  onInkMuted: 'rgba(255,255,255,0.55)',
  onInkFaint: 'rgba(255,255,255,0.4)',
  onInkSurface: 'rgba(255,255,255,0.12)',
  onInkRing: 'rgba(255,255,255,0.15)',
  /** Pending-invite badge background. */
  pendingBadge: 'rgba(242,212,92,0.3)',
  /** Modal scrims (the add-flow uses both, stacked). */
  scrimWarm: '#3A332A',
  scrimDark: 'rgba(0,0,0,0.28)',
  /** Sheet grabber. */
  grabber: 'rgba(0,0,0,0.15)',
  /** Empty-state dashed box. */
  emptyDash: 'rgba(0,0,0,0.2)',
  emptyGlyph: 'rgba(0,0,0,0.35)',
  /** Inactive onboarding step dots. */
  stepDot: 'rgba(0,0,0,0.18)',
  /** Frosted URL chip on the link preview. */
  frosted: 'rgba(255,255,255,0.85)',
} as const;

/** Semantic aliases — what screens should actually import. */
export const colors = {
  ...palette,
  screen: palette.cream,
  surface: palette.white,
  onInk: palette.white,
  primary: palette.ink,
  onPrimary: palette.white,
  brand: accents.pink,
  danger: accents.red,
  accents,
  status,
  alpha,
} as const;

export type Colors = typeof colors;
