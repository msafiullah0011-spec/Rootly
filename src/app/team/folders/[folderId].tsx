import { useLocalSearchParams } from 'expo-router';

import { SharedFolderScreen } from '@/features/team/components/shared-folder-screen';

/** A shared folder's links, opened from the workspace grid (frame 15). */
export default function SharedFolderRoute() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  return <SharedFolderScreen folderId={folderId} />;
}
