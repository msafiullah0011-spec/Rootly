import type { Link, Root, Shelf } from '@/api/schemas';
import { formatLongDate } from '@/lib/date';
import { displayUrl, joinMeta, pluralize } from '@/lib/format';

/**
 * A root, flattened into Markdown.
 *
 * The export button hands this to the OS share sheet, so it has to read well as
 * plain text in Notes or an email *and* render as Markdown wherever the user
 * drops it. Structure mirrors the app's hierarchy — `Root → Shelf → Link` —
 * because that's the thing worth carrying out of Rootly.
 */
export function formatRootExport(root: Root, shelves: Shelf[], links: Link[]): string {
  const lines: string[] = [
    `# ${root.name}`,
    joinMeta(
      pluralize(links.length, 'link'),
      pluralize(shelves.length, 'shelf', 'shelves'),
      `exported ${formatLongDate(new Date())}`,
    ),
  ];

  for (const shelf of shelves) {
    lines.push('', `## ${shelf.name}`);
    const shelfLinks = links.filter((link) => link.shelfId === shelf.id);

    if (shelfLinks.length === 0) {
      lines.push('_Nothing on this shelf yet._');
      continue;
    }
    lines.push(...shelfLinks.map(formatLink));
  }

  // Links whose shelf was deleted out from under them still belong in the file.
  const shelfIds = new Set(shelves.map((shelf) => shelf.id));
  const unshelved = links.filter((link) => !shelfIds.has(link.shelfId));

  if (unshelved.length > 0) {
    lines.push('', '## Unshelved', ...unshelved.map(formatLink));
  }

  return lines.join('\n');
}

/** `- GA4 property — ga.google.com/analytics (dead)` */
function formatLink(link: Link): string {
  const suffix = link.status === 'live' ? '' : ` (${link.status})`;
  return `- ${link.title} — ${displayUrl(link.url)}${suffix}`;
}
