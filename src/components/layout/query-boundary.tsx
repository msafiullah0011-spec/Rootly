import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import type { IconComponent } from '@/components/icons';

/**
 * The one place loading / error / empty branching happens.
 *
 * Screens hand over a query result and a render function; this decides what to
 * show. Without it, every screen re-implements the same four-way branch and
 * they drift apart.
 *
 * Note the ordering: a stale-but-present cache keeps rendering during a
 * background refetch, so a flaky network never blanks out a working screen.
 */

export interface QueryBoundaryProps<TData> {
  query: UseQueryResult<TData>;
  children: (data: TData) => ReactNode;
  /** Custom loading UI. Defaults to a skeleton list. */
  loading?: ReactNode;
  /** Predicate deciding whether `data` counts as empty. */
  isEmpty?: (data: TData) => boolean;
  empty?: {
    title: string;
    description?: string;
    icon?: IconComponent;
    actionLabel?: string;
    onAction?: () => void;
    /**
     * Centres the state in whatever height is left below the header, rather
     * than letting it sit right under it. Needs the screen's content container
     * to stretch — pass `contentStyle={{ flexGrow: 1 }}` to `Screen`.
     */
    fill?: boolean;
  };
  /** Renders errors inline rather than as a full-height state. */
  compact?: boolean;
}

export function QueryBoundary<TData>({
  query,
  children,
  loading,
  isEmpty,
  empty,
  compact = false,
}: QueryBoundaryProps<TData>) {
  const { data, error, isPending, isError } = query;

  // Show cached data even while a refetch is failing — the error surfaces as a
  // toast from the query cache instead of destroying the screen.
  if (data !== undefined) {
    if (isEmpty?.(data) && empty) {
      return (
        <EmptyState
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
          actionLabel={empty.actionLabel}
          onAction={empty.onAction}
          fill={empty.fill}
          compact={compact}
        />
      );
    }
    return <>{children(data)}</>;
  }

  if (isPending) {
    return <>{loading ?? <SkeletonList />}</>;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void query.refetch()} compact={compact} />;
  }

  return null;
}
