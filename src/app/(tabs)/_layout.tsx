import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/layout/floating-tab-bar';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme';

/**
 * The four tab routes. Order matters: `FloatingTabBar` splits this list either
 * side of the centre FAB, so Home/Recent sit left and Spaces/Settings right.
 */
export default function TabsLayout() {
  const status = useAuthStore((state) => state.status);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);

  if (status !== 'authenticated') {
    return <Redirect href="/sign-in" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.screen },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="timeline" options={{ title: 'Recent' }} />
      <Tabs.Screen name="spaces" options={{ title: 'Spaces' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
