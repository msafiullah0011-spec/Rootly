import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth.store';

/**
 * Boot route. Decides where a launched app lands:
 * signed out → auth, signed in but rootless → onboarding, otherwise → Home.
 *
 * The root layout holds the splash until `status` has resolved, so this never
 * renders against an `idle` store.
 */
export default function Index() {
  const status = useAuthStore((state) => state.status);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);

  if (status !== 'authenticated') {
    return <Redirect href="/sign-in" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
