export { colors, palette, accents, accentOrder, accentForeground, status, alpha } from './colors';
export type { AccentName, StatusName, Colors } from './colors';

export { radii } from './radii';
export type { Radii } from './radii';

export { spacing, screenPadding, tabBarClearance } from './spacing';
export type { Spacing } from './spacing';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

export {
  text,
  body,
  display,
  fontFamilies,
  setBodyFontsLoaded,
  areBodyFontsLoaded,
} from './typography';
export type { DisplayWeight, BodyWeight } from './typography';

export { useAppFonts } from './use-app-fonts';

/** Layout constants lifted straight from the handoff's frame geometry. */
export const layout = {
  /** Floating bottom nav. */
  navHeight: 66,
  navInset: 20,
  navBottom: 26,
  /** Centre FAB. */
  fabSize: 58,
  fabLift: 30,
  /** Circular header buttons. */
  headerButton: 44,
  headerButtonSm: 38,
  /** Hairline dividers. */
  hairline: 1,
} as const;
