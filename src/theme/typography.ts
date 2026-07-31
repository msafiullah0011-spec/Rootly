import { Platform, type TextStyle } from 'react-native';

/**
 * Font family names.
 *
 * Inter Tight ships from npm (`@expo-google-fonts/inter-tight`) so it is always
 * available. General Sans is a Fontshare face that has to be downloaded by hand
 * into `assets/fonts/` — see `useAppFonts`. Until those files exist we fall back
 * to the platform UI font, which keeps metrics close enough that layout doesn't
 * shift when they are added.
 */
export const fontFamilies = {
  display: {
    500: 'InterTight_500Medium',
    600: 'InterTight_600SemiBold',
    700: 'InterTight_700Bold',
    800: 'InterTight_800ExtraBold',
  },
  body: {
    400: 'GeneralSans-Regular',
    500: 'GeneralSans-Medium',
    600: 'GeneralSans-Semibold',
    700: 'GeneralSans-Bold',
  },
} as const;

const systemBody = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'system-ui',
}) as string;

const systemBodyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'system-ui',
}) as string;

/**
 * Set by `useAppFonts` once loading resolves. When General Sans is missing we
 * emit `undefined` for the family and lean on `fontWeight` instead, which the
 * platform font honours.
 */
let bodyFontsLoaded = false;

export function setBodyFontsLoaded(loaded: boolean) {
  bodyFontsLoaded = loaded;
}

export function areBodyFontsLoaded() {
  return bodyFontsLoaded;
}

export type DisplayWeight = keyof typeof fontFamilies.display;
export type BodyWeight = keyof typeof fontFamilies.body;

/**
 * Inter Tight — wordmarks, screen titles, numerals and avatar initials.
 * Large sizes carry negative tracking, matching the handoff.
 */
export function display(size: number, weight: DisplayWeight = 700, letterSpacing?: number): TextStyle {
  return {
    fontFamily: fontFamilies.display[weight],
    fontSize: size,
    letterSpacing: letterSpacing ?? defaultTracking(size),
  };
}

/** General Sans — all body copy, labels and button text. */
export function body(size: number, weight: BodyWeight = 400, lineHeight?: number): TextStyle {
  const style: TextStyle = { fontSize: size };

  if (bodyFontsLoaded) {
    style.fontFamily = fontFamilies.body[weight];
  } else {
    // System-font fallback: no custom family, express weight numerically.
    style.fontFamily = weight >= 500 ? systemBodyMedium : systemBody;
    style.fontWeight = String(weight) as TextStyle['fontWeight'];
  }

  if (lineHeight !== undefined) {
    style.lineHeight = lineHeight <= 3 ? Math.round(size * lineHeight) : lineHeight;
  }

  return style;
}

/** The handoff tightens tracking only on display type above ~20px. */
function defaultTracking(size: number): number {
  if (size >= 40) return size * -0.03;
  if (size >= 20) return size * -0.02;
  return 0;
}

/**
 * Named text roles used across screens. Anything reused more than twice
 * belongs here rather than inline in a StyleSheet.
 */
export const text = {
  /** 44/800 — splash and auth wordmark. */
  wordmark: () => display(44, 800),
  /** 30/700 — onboarding hero. */
  hero: () => display(30, 700),
  /** 28/700 — Ask screen title. */
  heroSm: () => display(28, 700),
  /** 26/700 — standard screen title (Settings, Alerts, Timeline, greeting). */
  screenTitle: () => display(26, 700),
  /** 24/700 — invite hero. */
  sectionHero: () => display(24, 700),
  /** 22/600 — link detail title. */
  pageTitle: () => display(22, 600),
  /** 17/600 — nav bar titles and section headers. */
  navTitle: () => body(17, 600),
  /** 17/600 — "Your roots", "Shelves". */
  sectionTitle: () => body(17, 600),
  /** 16/600 — card titles, large CTA labels. */
  cardTitle: () => body(16, 600),
  /** 15/600 — list row labels, section subtitles. */
  rowTitle: () => body(15, 600),
  /** 15/400 1.45 — body copy. */
  bodyText: () => body(15, 400, 1.45),
  /** 14/400 1.45 — dense body copy in cards. */
  bodySm: () => body(14, 400, 1.45),
  /** 14/600 — small titles, timeline text, member names. */
  bodySmStrong: () => body(14, 600),
  /** 13/400 — captions, taglines, secondary actions. */
  label: () => body(13, 400),
  /** 13/600 — small pill buttons. */
  labelStrong: () => body(13, 600),
  /** 12/400 — field labels, group labels, meta. */
  meta: () => body(12, 400),
  /** 12/600 — trailing row actions, badges. */
  metaStrong: () => body(12, 600),
  /** 11/400 — timestamps, emails in member rows. */
  micro: () => body(11, 400),
  /** 11/600 — role badges. */
  microStrong: () => body(11, 600),
} as const;
