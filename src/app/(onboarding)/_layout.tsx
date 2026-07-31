import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme';

/** Onboarding is only reachable while signed in. */
export default function OnboardingLayout() {
  const status = useAuthStore((state) => state.status);

  if (status !== 'authenticated') {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.screen },
      }}
    />
  );
}
