import { useQuery } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { get } from '@/api/http';
import { queryKeys } from '@/api/query-keys';
import { timelineListSchema, type TimelineEvent } from '@/api/schemas';
import { relativeBucket } from '@/lib/date';

export type TimelineScope = 'personal' | 'team';

export function useTimeline(scope: TimelineScope) {
  return useQuery({
    queryKey: queryKeys.timeline.list(scope),
    queryFn: ({ signal }) =>
      get(endpoints.timeline.list, { schema: timelineListSchema, query: { scope }, signal }),
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
    buckets[relativeBucket(event.createdAt)].push(event);
  }

  return [
    { title: 'Today', events: buckets.today },
    { title: 'Yesterday', events: buckets.yesterday },
    { title: 'Earlier', events: buckets.earlier },
  ].filter((section) => section.events.length > 0);
}
