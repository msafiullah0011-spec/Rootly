import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { configureQueryFeedback, createQueryClient } from '@/api/query-client';
import { ToastHost } from '@/components/ui/toast';
import { SplashOverlay } from '@/features/auth/components/splash-overlay';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { colors, useAppFonts } from '@/theme';

// The animated in-app splash takes over from the native one, so hide the native
// screen as soon as the first frame is ready rather than waiting on data.
void SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

/** Expo Router renders this for any uncaught error in the tree. */
export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { ready: fontsReady } = useAppFonts();
  const restore = useAuthStore((state) => state.restore);
  const authStatus = useAuthStore((state) => state.status);
  const [splashDone, setSplashDone] = useState(false);
  const hasRestored = useRef(false);

  // Give the query client a way to raise toasts and to bounce an expired
  // session, without either module importing the other.
  useEffect(() => {
    configureQueryFeedback({
      showToast: (message, tone) => useUiStore.getState().showToast(message, tone),
      onUnauthenticated: () => useAuthStore.getState().clearSession(),
    });
  }, []);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    void restore();
  }, [restore]);

  const bootReady = fontsReady && authStatus !== 'idle' && authStatus !== 'restoring';

  useEffect(() => {
    if (!bootReady) return;
    void SplashScreen.hideAsync();
    // Hold the branded splash briefly so the ring animation is actually seen
    // rather than flashing past on a warm start.
    const timer = setTimeout(() => setSplashDone(true), 900);
    return () => clearTimeout(timer);
  }, [bootReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" backgroundColor={colors.screen} />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.screen },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="quick-add"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="shelf-form"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="shelf-options"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="root-options"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="timeline-filter"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="timeline-reply"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="team/member"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="team/switch"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="team/invite-options"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen name="link-form" options={{ presentation: 'modal' }} />
          </Stack>

          <ToastHost />
          {!splashDone ? <SplashOverlay /> : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
