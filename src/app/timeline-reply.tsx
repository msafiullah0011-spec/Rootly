import { useLocalSearchParams } from 'expo-router';

import { TimelineReplySheet } from '@/features/timeline/components/timeline-reply-sheet';

/** Frame 14's "Reply" action. Presented as a transparent modal by the root stack. */
export default function TimelineReplyRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return <TimelineReplySheet eventId={eventId} />;
}
