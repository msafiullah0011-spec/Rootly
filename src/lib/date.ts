/**
 * Date formatting. Uses `Intl` (available in Hermes with the full-ICU build
 * Expo ships) rather than pulling in a date library for four formats.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `Tuesday, 28 July` — the home screen greeting date. */
export function formatGreetingDate(date: Date = new Date()): string {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  return `${weekday}, ${day} ${month}`;
}

/** `Good morning` / `Good afternoon` / `Good evening`. */
export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** `12 Aug 2026` — billing and renewal dates. */
export function formatLongDate(input: string | Date): string {
  const date = toDate(input);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `12 Aug` — compact renewal copy. */
export function formatShortDate(input: string | Date): string {
  const date = toDate(input);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * `12 min ago` / `2h ago` / `Mon` / `Yesterday, 4:20 PM`, matching the mix of
 * formats the timeline and notification screens use.
 */
export function formatRelative(input: string | Date, now: Date = new Date()): string {
  const date = toDate(input);
  if (!date) return '';

  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;

  if (isYesterday(date, now)) {
    return `Yesterday, ${formatTime(date)}`;
  }

  if (diff < 7 * DAY) {
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  }

  return formatShortDate(date);
}

/** `4:20 PM` */
export function formatTime(date: Date): string {
  return date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, ' ');
}

/**
 * Buckets an item into the timeline's `Today` / `Yesterday` / `Earlier`
 * headings.
 */
export function relativeBucket(input: string | Date, now: Date = new Date()): 'today' | 'yesterday' | 'earlier' {
  const date = toDate(input);
  if (!date) return 'earlier';
  if (isSameDay(date, now)) return 'today';
  if (isYesterday(date, now)) return 'yesterday';
  return 'earlier';
}

/** Whole days from now until `input`; negative when in the past. */
export function daysUntil(input: string | Date, now: Date = new Date()): number {
  const date = toDate(input);
  if (!date) return 0;
  return Math.ceil((date.getTime() - now.getTime()) / DAY);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(date, yesterday);
}

function toDate(input: string | Date): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}
