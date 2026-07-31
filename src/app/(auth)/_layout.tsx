import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme';

/** Auth stack. Signed-in users never see it. */
export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)" />;
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
