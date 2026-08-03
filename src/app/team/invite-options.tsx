import { useLocalSearchParams } from 'expo-router';

import { InviteOptionsSheet } from '@/features/team/components/invite-options-sheet';

/** A pending-invite row on frame 15. Presented as a transparent modal. */
export default function InviteOptionsRoute() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  return <InviteOptionsSheet inviteId={inviteId} />;
}
