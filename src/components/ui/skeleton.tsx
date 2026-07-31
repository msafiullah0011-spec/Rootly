import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { alpha, colors, radii, spacing } from '@/theme';

/**
 * Loading placeholders.
 *
 * These mirror the shape of the real content rather than showing a spinner, so
 * the layout doesn't jump when data lands.
 */

export function Skeleton({
  width,
  height = 12,
  radius = radii.xs,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width: width ?? '100%', height, borderRadius: radius, backgroundColor: colors.sand },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Placeholder matching a root row / member row card. */
export function SkeletonRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.row, style]}>
      <Skeleton width={40} height={40} radius={radii.pill} />
      <View style={styles.rowBody}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="35%" height={11} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

/** Placeholder matching a feature card. */
export function SkeletonCard({ height = 96, style }: { height?: number; style?: ViewStyle }) {
  return <Skeleton height={height} radius={radii.card} style={style} />;
}

/** A stack of row placeholders — the default list loading state. */
export function SkeletonList({ count = 4, style }: { count?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonRow key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.base },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.hairline,
    borderRadius: radii.row,
    padding: spacing.lg,
  },
  rowBody: { flex: 1 },
});
