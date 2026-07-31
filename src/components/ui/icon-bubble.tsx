import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { STROKE, type IconComponent } from '@/components/icons';
import { accentForeground, accents, radii, type AccentName } from '@/theme';

/**
 * A coloured circle or rounded tile with an icon inside — used for shelf rows,
 * settings rows, timeline entries, shared folders and the resume card.
 *
 * The icon colour follows `accentForeground`, so glyphs on the green accent
 * come out white while the rest stay ink, exactly as in the handoff.
 */

export interface IconBubbleProps {
  icon: IconComponent;
  accent?: AccentName;
  backgroundColor?: string;
  color?: string;
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
  /** Rounded-square variant (resume card tile, workspace tile, auth logo). */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconBubble({
  icon: Icon,
  accent = 'pink',
  backgroundColor,
  color,
  size = 36,
  iconSize,
  strokeWidth = STROKE,
  radius,
  style,
}: IconBubbleProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius ?? radii.pill,
          backgroundColor: backgroundColor ?? accents[accent],
        },
        style,
      ]}
    >
      <Icon
        size={iconSize ?? Math.round(size * 0.5)}
        color={color ?? accentForeground[accent]}
        strokeWidth={strokeWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
