import { useLocalSearchParams } from 'expo-router';

import { RootOptionsSheet } from '@/features/roots/components/root-options-sheet';

/** Frame 2's ⋮ menu. Presented as a transparent modal by the root stack. */
export default function RootOptionsRoute() {
  const { rootId } = useLocalSearchParams<{ rootId: string }>();
  return <RootOptionsSheet rootId={rootId} />;
}
