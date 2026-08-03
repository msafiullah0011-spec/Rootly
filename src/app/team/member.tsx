import { useLocalSearchParams } from 'expo-router';

import { MemberSheet } from '@/features/team/components/member-sheet';

/** A member row on frame 15. Presented as a transparent modal by the root stack. */
export default function MemberRoute() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  return <MemberSheet memberId={memberId} />;
}
