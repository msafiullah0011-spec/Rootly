import { useLocalSearchParams } from 'expo-router';

import { ShelfOptionsSheet } from '@/features/roots/components/shelf-options-sheet';

/** A shelf's ⋮ menu. Presented as a transparent modal by the root stack. */
export default function ShelfOptionsRoute() {
  const { rootId, shelfId, origin } = useLocalSearchParams<{
    rootId: string;
    shelfId: string;
    origin?: 'root' | 'shelf';
  }>();

  return <ShelfOptionsSheet rootId={rootId} shelfId={shelfId} origin={origin} />;
}
