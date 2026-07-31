import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Icons } from '@/components/icons';
import { EmptyState } from '@/components/ui/states';

/** Catch-all for unmatched routes and stale deep links. */
export default function NotFoundRoute() {
  const router = useRouter();

  return (
    <Screen centered scroll={false}>
      <EmptyState
        title="That page has no home"
        description="The link you followed doesn't point anywhere in Rootly."
        icon={Icons.folder}
        actionLabel="Back to Home"
        onAction={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}
