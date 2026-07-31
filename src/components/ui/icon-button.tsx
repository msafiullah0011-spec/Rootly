import { Pressable, StyleSheet, type StyleProp,
  type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { STROKE, type IconComponent } from '@/components/icons';
import { alpha, colors, layout, radii } from '@/theme';

/**
 * Circular icon button — the back / overflow / filter affordances in headers.
 *
 * The handoff uses three sizes: 44 (screen headers), 38 (compact headers) and
 * 32 (the invite row's remove X).
 */

export interface IconButtonProps {
  icon: IconComponent;
  onPress?: () => void;
  /** Required: these buttons have no visible label. */
  accessibilityLabel: string;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  /** Hairline border. On by default, matching the white circular buttons. */
  bordered?: boolean;
  strokeWidth?: number;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  size = layout.headerButton,
  iconSize,
  color = colors.ink,
  backgroundColor = colors.surface,
  bordered = true,
  strokeWidth = STROKE,
  disabled = false,
  haptic = false,
  style,
  testID,
}: IconButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      // Small targets need padding out to the 44pt minimum.
      hitSlop={Math.max(0, (44 - size) / 2)}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor,
          borderWidth: bordered ? 1 : 0,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon size={iconSize ?? Math.round(size * 0.45)} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: alpha.borderStrong,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
