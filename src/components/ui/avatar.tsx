import { StyleSheet, Text, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { accentForeground, accents, colors, display, radii, type AccentName } from '@/theme';

/**
 * Coloured circle with an initial. The design ships no avatar images — identity
 * is always an accent colour plus a letter set in Inter Tight.
 *
 * Sizes seen in the handoff: 26 (stacks), 30/32 (small tiles), 40 (member
 * rows), 44–48 (headers and chips), 52–56 (feature cards).
 */

export interface AvatarProps {
  /** Rendered as-is — the seed data includes lowercase and `!` glyphs. */
  initial: string;
  accent?: AccentName;
  /** Overrides the accent, for the neutral sand avatars. */
  backgroundColor?: string;
  color?: string;
  size?: number;
  /** White ring used when avatars overlap in a stack. */
  ringWidth?: number;
  ringColor?: string;
  /** Corner radius override — workspace tiles are rounded squares, not circles. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Font size scales with the circle, matching the handoff's ratios. */
function initialSize(size: number): number {
  if (size <= 26) return 11;
  if (size <= 32) return 13;
  if (size <= 40) return 15;
  if (size <= 44) return 17;
  if (size <= 48) return 19;
  if (size <= 52) return 20;
  return 22;
}

export function Avatar({
  initial,
  accent = 'pink',
  backgroundColor,
  color,
  size = 44,
  ringWidth = 0,
  ringColor = colors.surface,
  radius,
  style,
}: AvatarProps) {
  const background = backgroundColor ?? accents[accent];
  const foreground = color ?? accentForeground[accent];

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius ?? radii.pill,
          backgroundColor: background,
          borderWidth: ringWidth,
          borderColor: ringColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          display(initialSize(size), size >= 44 ? 800 : 700, 0),
          { color: foreground },
        ]}
        // Initials must never wrap or shrink the circle.
        numberOfLines={1}
        allowFontScaling={false}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
