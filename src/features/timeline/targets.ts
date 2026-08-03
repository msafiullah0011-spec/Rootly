import type { Target } from '@/api/schemas';

/**
 * Where a target opens. Anything that points at something in the hierarchy —
 * a timeline row, an alert, a workspace assignment — lands on one of these
 * three routes.
 *
 * The object form is deliberate: handing the router a `pathname` plus `params`
 * lets it build and encode the dynamic segments itself, rather than trusting an
 * id that happens to be interpolation-safe.
 */
export function hrefForTarget(target: Target) {
  switch (target.type) {
    case 'link':
      return { pathname: '/links/[linkId]', params: { linkId: target.linkId } } as const;
    case 'shelf':
      return {
        pathname: '/roots/[rootId]/shelves/[shelfId]',
        params: { rootId: target.rootId, shelfId: target.shelfId },
      } as const;
    case 'root':
      return { pathname: '/roots/[rootId]', params: { rootId: target.rootId } } as const;
  }
}

/** What the row should say it opens, for the accessibility hint. */
export function describeTarget(target: Target): string {
  switch (target.type) {
    case 'link':
      return 'Opens this link';
    case 'shelf':
      return 'Opens this shelf';
    case 'root':
      return 'Opens this root';
  }
}
