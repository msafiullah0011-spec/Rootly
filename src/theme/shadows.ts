import { Platform, type ViewStyle } from 'react-native';

/**
 * Cross-platform shadows. iOS gets the handoff's exact offset/radius/opacity;
 * Android only supports `elevation`, so each preset carries a hand-tuned
 * equivalent plus `shadowColor` (Android 12+ tints the elevation shadow).
 */
function shadow(
  color: string,
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number,
): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowRadius: blur / 2,
      shadowOpacity: opacity,
    },
    android: { elevation, shadowColor: color },
    default: {
      // react-native-web understands the boxShadow shorthand.
      boxShadow: `0 ${offsetY}px ${blur}px rgba(0,0,0,${opacity})`,
    } as ViewStyle,
  })!;
}

export const shadows = {
  /** `0 4px 16px rgba(0,0,0,.05)` — standard card elevation. */
  card: shadow('#000000', 4, 16, 0.05, 2),
  /** `0 6px 24px rgba(0,0,0,.1)` — the floating bottom nav. */
  nav: shadow('#000000', 6, 24, 0.1, 8),
  /** `0 8px 20px rgba(247,182,214,.6)` — the pink FAB's coloured glow. */
  fab: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#F7B6D6',
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 10,
      shadowOpacity: 0.6,
    },
    android: { elevation: 10, shadowColor: '#F7B6D6' },
    default: { boxShadow: '0 8px 20px rgba(247,182,214,0.6)' } as ViewStyle,
  })!,
  /** `0 2px 8px rgba(0,0,0,.06)` — social sign-in buttons. */
  social: shadow('#000000', 2, 8, 0.06, 1),
  /** `0 8px 28px rgba(0,0,0,.18)` — the Ask screen's pinned input bar. */
  floatingBar: shadow('#000000', 8, 28, 0.18, 12),
  /** `0 8px 24px rgba(0,0,0,.3)` — the add-flow confirmation toast. */
  toast: shadow('#000000', 8, 24, 0.3, 14),
  /** `0 -8px 40px rgba(0,0,0,.2)` — bottom sheet lifting off the scrim. */
  sheet: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -8 },
      shadowRadius: 20,
      shadowOpacity: 0.2,
    },
    android: { elevation: 16, shadowColor: '#000000' },
    default: { boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' } as ViewStyle,
  })!,
  /** `0 2px 8px rgba(0,0,0,.1)` — small floating chips on the root ring. */
  chip: shadow('#000000', 2, 8, 0.1, 3),
  none: {} as ViewStyle,
} as const;

export type Shadows = typeof shadows;
