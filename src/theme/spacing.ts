/** 2px-based spacing scale covering every gap in the handoff. */
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 10,
  base: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  '3xl': 20,
  '4xl': 22,
  '5xl': 24,
  '6xl': 26,
  '7xl': 30,
  '8xl': 34,
} as const;

/**
 * Horizontal screen padding. Most screens use 20; onboarding and the empty
 * home use 24; auth uses 28; the add-flow sheet uses 22.
 */
export const screenPadding = {
  default: 20,
  wide: 24,
  auth: 28,
  sheet: 22,
} as const;

/**
 * Bottom scroll padding that clears the floating tab bar. The bar sits 26px
 * from the bottom and is 66px tall, so content needs ~120px plus safe area.
 */
export const tabBarClearance = 120;

export type Spacing = typeof spacing;
