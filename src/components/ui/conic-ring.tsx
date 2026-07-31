import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { accentOrder, accents, colors } from '@/theme';

/**
 * The five-segment brand ring.
 *
 * The handoff draws this as a CSS `conic-gradient` — five 64° arcs starting at
 * −8°, separated by 8° gaps painted in the background colour. RN has no conic
 * gradient, so it's rebuilt as five stroked SVG arcs with the same geometry.
 *
 * Used at three sizes: 150 on the splash (ink gaps), 236 on root detail, and
 * 180 at 40% opacity on the empty home.
 */

const SEGMENT_DEGREES = 64;
const GAP_DEGREES = 8;
const START_DEGREES = -8;

export interface ConicRingProps {
  size: number;
  /** Ring thickness. The handoff insets the inner disc by 18 (150) / 26 (236). */
  thickness: number;
  /** Colour of the gaps between segments — ink on the splash, cream elsewhere. */
  gapColor?: string;
  /** Plays the `ringIn` entrance (scale .86 → 1). */
  animate?: boolean;
  /** Duration of the entrance animation. .7s on splash, .6s on root detail. */
  animationDuration?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function ConicRing({
  size,
  thickness,
  gapColor = colors.screen,
  animate = false,
  animationDuration = 700,
  opacity = 1,
  style,
  children,
}: ConicRingProps) {
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    progress.value = withTiming(1, {
      duration: animationDuration,
      easing: Easing.out(Easing.ease),
    });
  }, [animate, animationDuration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * opacity,
    transform: [{ scale: 0.86 + progress.value * 0.14 }],
  }));

  const radius = (size - thickness) / 2;
  const center = size / 2;

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle, style]}>
      <Svg width={size} height={size}>
        {accentOrder.map((name, index) => {
          const start = START_DEGREES + index * (SEGMENT_DEGREES + GAP_DEGREES);
          return (
            <Path
              key={name}
              d={describeArc(center, center, radius, start, start + SEGMENT_DEGREES)}
              stroke={accents[name]}
              strokeWidth={thickness}
              fill="none"
            />
          );
        })}
      </Svg>

      {children ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { padding: thickness }]}>
          <View style={[styles.inner, { borderRadius: size, backgroundColor: gapColor }]}>{children}</View>
        </View>
      ) : null}
    </Animated.View>
  );
}

/** SVG arc path between two angles, measured clockwise from 12 o'clock. */
function describeArc(cx: number, cy: number, radius: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, radius, endDeg);
  const end = polarToCartesian(cx, cy, radius, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  inner: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
