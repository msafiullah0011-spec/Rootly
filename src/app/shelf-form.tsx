import { useLocalSearchParams } from 'expo-router';

import { ShelfFormSheet } from '@/features/roots/components/shelf-form-sheet';

/** New shelf, or an edit when a `shelfId` comes with it. Transparent modal. */
export default function ShelfFormRoute() {
  const { rootId, shelfId } = useLocalSearchParams<{ rootId: string; shelfId?: string }>();
  return <ShelfFormSheet rootId={rootId} shelfId={shelfId} />;
}
