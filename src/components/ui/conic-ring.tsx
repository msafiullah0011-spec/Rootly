import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { accentOrder, accents, colors } from '@/theme';

/**
 * The brand ring.
 *
 * The handoff draws this as a CSS `conic-gradient` — five 64° arcs starting at
 * −8°, separated by 8° gaps painted in the background colour. RN has no conic
 * gradient, so it's rebuilt as stroked SVG arcs with the same geometry.
 *
 * The arc count is a parameter rather than a constant: on root detail the ring
 * *is* the root's shelves, one arc each in the shelf's own accent, so a root
 * with three shelves shows three arcs. `ringSegmentAngle` gives the midpoint of
 * an arc so callers can pin something to it. Passing no `segments` keeps the
 * decorative five-accent ring the splash and empty home use.
 *
 * Used at three sizes: 150 on the splash (ink gaps), 236 on root detail, and
 * 180 at 40% opacity on the empty home.
 */

const GAP_DEGREES = 8;

/**
 * Where an arc's midpoint sits, clockwise from 12 o'clock.
 *
 * The five-segment case reduces to the handoff's geometry exactly: 24°, 96°,
 * 168°, 240°, 312°.
 */
export function ringSegmentAngle(index: number, count: number): number {
  const step = 360 / Math.max(count, 1);
  return -GAP_DEGREES + index * step + (step - GAP_DEGREES) / 2;
}

export interface ConicRingProps {
  size: number;
  /** Ring thickness. The handoff insets the inner disc by 18 (150) / 26 (236). */
  thickness: number;
  /** One colour per arc. Defaults to the five-accent brand rotation. */
  segments?: string[];
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
  segments,
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

  // An empty `segments` array would leave nothing to draw, so an emptied ring
  // falls back to the decorative rotation rather than vanishing.
  const arcs = segments?.length ? segments : accentOrder.map((name) => accents[name]);
  const step = 360 / arcs.length;

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle, style]}>
      <Svg width={size} height={size}>
        {arcs.map((color, index) => {
          const start = -GAP_DEGREES + index * step;
          return (
            <Path
              key={index}
              d={describeArc(center, center, radius, start, start + step - GAP_DEGREES)}
              stroke={color}
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
