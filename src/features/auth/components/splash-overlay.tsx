import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { RootMark } from '@/components/icons';
import { ConicRing } from '@/components/ui/conic-ring';
import { Text } from '@/components/ui/text';
import { alpha, colors, radii, spacing } from '@/theme';

/**
 * The launch screen (frame 0).
 *
 * Held over the app while fonts load and the session is restored, then faded
 * out. The ring plays `ringIn` (scale .86 → 1 over .7s) and the loader spins at
 * 1s linear, matching the handoff's keyframes.
 */

export function SplashOverlay() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View exiting={FadeOut.duration(320)} style={styles.container}>
      <View style={styles.hero}>
        <ConicRing size={150} thickness={18} gapColor={colors.ink} animate animationDuration={700}>
          <RootMark size={48} color={colors.white} />
        </ConicRing>

        <View style={styles.wordmark}>
          <Text variant="wordmark" tone="onInk" align="center">
            Rootly
          </Text>
          <Text variant="bodyText" align="center" color={alpha.onInkMuted} style={styles.tagline}>
            Every link has a home.
          </Text>
        </View>
      </View>

      <View style={styles.loading}>
        <Animated.View style={[styles.spinner, spinnerStyle]} />
        <Text variant="meta" color={alpha.onInkFaint}>
          Growing your roots…
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  hero: {
    alignItems: 'center',
    gap: spacing['7xl'],
  },
  wordmark: { alignItems: 'center' },
  tagline: { marginTop: spacing.sm, maxWidth: 240 },
  loading: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: spacing.xl,
  },
  spinner: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 2.5,
    borderColor: alpha.onInkRing,
    // Only the top edge is tinted, which is what makes the rotation readable.
    borderTopColor: colors.brand,
  },
});
