import { endpoints } from '@/api/endpoints';
import { get, post } from '@/api/http';
import { timelineEventSchema, timelineListSchema } from '@/api/schemas';

/** Endpoint functions for the activity feed. No React here. */

export function fetchTimeline(scope: string, signal?: AbortSignal) {
  return get(endpoints.timeline.list, { schema: timelineListSchema, query: { scope }, signal });
}

export function fetchTimelineEvent(eventId: string, signal?: AbortSignal) {
  return get(endpoints.timeline.detail(eventId), { schema: timelineEventSchema, signal });
}

/** Reverses a reversible event. Returns the "undone" event the server logged. */
export function undoTimelineEvent(eventId: string) {
  return post(endpoints.timeline.undo(eventId), {}, { schema: timelineEventSchema });
}

/** Returns the reply as its own feed event. */
export function replyToTimelineEvent(eventId: string, body: string) {
  return post(endpoints.timeline.replies(eventId), { body }, { schema: timelineEventSchema });
}
