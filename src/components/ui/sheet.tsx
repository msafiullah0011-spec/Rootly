import { Pressable, StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { alpha, colors, radii, screenPadding, shadows, spacing } from '@/theme';

/**
 * Bottom sheet with a stacked scrim.
 *
 * The add-flow layers two scrims — a warm `#3A332A` at 55% under a
 * `rgba(0,0,0,.28)` — which is what gives the backdrop its brown cast rather
 * than a flat grey. Reproduced faithfully here.
 */

export interface SheetProps {
  children: React.ReactNode;
  onDismiss: () => void;
  /** Content rendered above the sheet, e.g. the add-flow's confirmation toast. */
  overlay?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Sheet({ children, onDismiss, overlay, style }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.scrimWarm} />
          <View style={styles.scrimDark} />
        </Pressable>
      </Animated.View>

      {overlay ? (
        <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + spacing.base }]}>
          {overlay}
        </View>
      ) : null}

      <Animated.View
        entering={SlideInDown.duration(280)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.sheet, { paddingBottom: insets.bottom + spacing['8xl'] }, style]}
      >
        <View style={styles.grabber} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrimWarm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha.scrimWarm,
    opacity: 0.55,
  },
  scrimDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha.scrimDark,
  },
  overlay: {
    position: 'absolute',
    left: spacing['3xl'],
    right: spacing['3xl'],
  },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.lg,
    paddingHorizontal: screenPadding.sheet,
    ...shadows.sheet,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: alpha.grabber,
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
});
