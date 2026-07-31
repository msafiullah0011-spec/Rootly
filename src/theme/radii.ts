/** Corner radii from the handoff. `pill` is the 999px "fully rounded" value. */
export const radii = {
  /** Bottom sheets. */
  sheet: 32,
  /** Feature cards, notification cards, the log-out button. */
  card: 24,
  /** List rows, folder tiles, the auth logo mark. */
  row: 20,
  /** Email input on the invite screen. */
  field: 18,
  /** Standard form fields, inner icon tiles. */
  input: 16,
  /** Access selector, workspace tile, dark link-card icon tile. */
  tile: 14,
  /** Link-card favicon, preview favicon. */
  thumb: 12,
  /** Small related-row tiles. */
  chip: 9,
  /** Dashed add box on the empty state. */
  xs: 8,
  /** Circles, pills, avatars, the FAB, the bottom nav. */
  pill: 999,
} as const;

export type Radii = typeof radii;
