import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import type { TimelineEvent, TimelineKind } from '@/api/schemas';
import { relativeBucket } from '@/lib/date';
import { useUiStore } from '@/store/ui.store';
import {
  fetchTimeline,
  fetchTimelineEvent,
  replyToTimelineEvent,
  undoTimelineEvent,
} from './api';

export type TimelineScope = 'personal' | 'team';

/**
 * `kinds` narrows the feed to those event kinds; empty means everything.
 *
 * The narrowing runs in `select` rather than in the query key, so toggling a
 * filter re-renders off the cached list instead of refetching — and every
 * consumer, `QueryBoundary`'s empty check included, sees the filtered array.
 */
export function useTimeline(scope: TimelineScope, kinds: TimelineKind[]) {
  const select = useCallback(
    (events: TimelineEvent[]) =>
      kinds.length === 0 ? events : events.filter((event) => kinds.includes(event.kind)),
    [kinds],
  );

  return useQuery({
    queryKey: queryKeys.timeline.list(scope),
    queryFn: ({ signal }) => fetchTimeline(scope, signal),
    select,
  });
}

/** One event, for screens reached without the list in hand — the reply sheet. */
export function useTimelineEvent(eventId: string) {
  return useQuery({
    queryKey: queryKeys.timeline.detail(eventId),
    queryFn: ({ signal }) => fetchTimelineEvent(eventId, signal),
    enabled: Boolean(eventId),
  });
}

/**
 * "Undo" on a merge row. The restored links reappear in their shelf, so this
 * invalidates the hierarchy as well as the feed.
 */
export function useUndoTimelineEvent() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (eventId: string) => undoTimelineEvent(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.shelves.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roots.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      showToast('Merge undone — the duplicates are back.', 'success');
    },
  });
}

/** "Reply" on a comment row. The sheet renders its own error, hence `silent`. */
export function useReplyToTimelineEvent(eventId: string) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  return useMutation({
    mutationFn: (body: string) => replyToTimelineEvent(eventId, body),
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      showToast('Reply posted.', 'success');
    },
  });
}

export interface TimelineSection {
  title: string;
  events: TimelineEvent[];
}

/**
 * Groups events into the design's Today / Yesterday / Earlier headings,
 * dropping any section that would be empty.
 */
export function groupTimeline(events: TimelineEvent[]): TimelineSection[] {
  const buckets: Record<string, TimelineEvent[]> = { today: [], yesterday: [], earlier: [] };

  for (const event of events) {
    // An unparseable timestamp already resolves to `earlier`; the `??` covers
    // the case where this list and `relativeBucket` ever fall out of step.
    (buckets[relativeBucket(event.createdAt)] ?? buckets.earlier).push(event);
  }

  return [
    { title: 'Today', events: buckets.today },
    { title: 'Yesterday', events: buckets.yesterday },
    { title: 'Earlier', events: buckets.earlier },
  ].filter((section) => section.events.length > 0);
}
