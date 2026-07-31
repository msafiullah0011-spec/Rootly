import { accentOrder, type AccentName } from '@/theme';

/** `1 link` / `18 links` — the handoff never abbreviates counts. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** The middle dot the design uses between meta segments. */
export const DOT = '·';
/** The right arrow used in breadcrumbs. */
export const ARROW = '→';
/** The em dash used in body copy. */
export const EM_DASH = '—';

/** Joins meta segments with the design's middle dot, dropping empties. */
export function joinMeta(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(` ${DOT} `);
}

/** `mystore.pk → Ads` */
export function breadcrumb(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(` ${ARROW} `);
}

/** First character, uppercased — used for avatar initials. */
export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Deterministically maps any stable key (id, name) onto the accent rotation, so
 * a root keeps the same colour across renders and screens without storing one.
 */
export function accentForKey(key: string): AccentName {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return accentOrder[hash % accentOrder.length];
}

/** Trims a URL down to what the design shows on link rows. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Masks a card number the way the link vault does: `card •• 4471`. */
export function maskedCard(last4: string): string {
  return `card •• ${last4}`;
}
