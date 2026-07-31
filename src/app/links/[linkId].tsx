import { useLocalSearchParams } from 'expo-router';

import { LinkDetailScreen } from '@/features/links/components/link-detail-screen';

/** Frame 4 — Link detail. */
export default function LinkDetailRoute() {
  const { linkId } = useLocalSearchParams<{ linkId: string }>();
  return <LinkDetailScreen linkId={linkId} />;
}
