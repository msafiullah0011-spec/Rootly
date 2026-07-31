import { useLocalSearchParams } from 'expo-router';

import { ShelfLinksScreen } from '@/features/links/components/shelf-links-screen';

/** Frame 3 — Shelf → links. */
export default function ShelfLinksRoute() {
  const { shelfId } = useLocalSearchParams<{ rootId: string; shelfId: string }>();
  return <ShelfLinksScreen shelfId={shelfId} />;
}
