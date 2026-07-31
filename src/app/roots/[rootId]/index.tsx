import { useLocalSearchParams } from 'expo-router';

import { RootDetailScreen } from '@/features/roots/components/root-detail-screen';

/** Frame 2 — Root detail. */
export default function RootDetailRoute() {
  const { rootId } = useLocalSearchParams<{ rootId: string }>();
  return <RootDetailScreen rootId={rootId} />;
}
