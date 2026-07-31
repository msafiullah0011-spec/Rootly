import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp,
  type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { STROKE_BOLD, type IconComponent } from '@/components/icons';
import { alpha, colors, radii, shadows, spacing, text } from '@/theme';

/**
 * The app's button.
 *
 * Variants map one-to-one onto the handoff:
 *  - `primary`   ink pill, white label — every full-width CTA
 *  - `secondary` white pill with a hairline border — "File manually", social
 *  - `pink`      pink pill on ink surfaces — the invite-link "Copy" button
 *  - `danger`    white card with red label — "Log out"
 *  - `ghost`     text-only, no chrome — "Skip", "Mark all read"
 */

export type ButtonVariant = 'primary' | 'secondary' | 'pink' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'block';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconComponent;
  /** Renders the icon after the label instead of before it. */
  iconTrailing?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Stretches to the container width. Implied by `size="block"`. */
  fullWidth?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; icon: number }> = {
  sm: { paddingVertical: 9, paddingHorizontal: 16, fontSize: 13, icon: 15 },
  md: { paddingVertical: 11, paddingHorizontal: 20, fontSize: 14, icon: 17 },
  lg: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15, icon: 17 },
  block: { paddingVertical: 17, paddingHorizontal: 20, fontSize: 16, icon: 18 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconTrailing = false,
  loading = false,
  disabled = false,
  fullWidth,
  haptic = true,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const metrics = sizeStyles[size];
  const isDisabled = disabled || loading;
  const stretch = fullWidth ?? size === 'block';

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        {
          paddingVertical: metrics.paddingVertical,
          paddingHorizontal: metrics.paddingHorizontal,
        },
        stretch && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles[variant].label.color} />
      ) : (
        <View style={styles.content}>
          {Icon && !iconTrailing ? (
            <Icon size={metrics.icon} color={variantStyles[variant].label.color} strokeWidth={STROKE_BOLD} />
          ) : null}
          <Text
            style={[variantStyles[variant].label, { fontSize: metrics.fontSize }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {Icon && iconTrailing ? (
            <Icon size={metrics.icon} color={variantStyles[variant].label.color} strokeWidth={STROKE_BOLD} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const labelBase = { ...text.rowTitle(), textAlign: 'center' as const };

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: colors.ink },
    label: { ...labelBase, color: colors.onInk },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: alpha.borderStrong,
    },
    label: { ...labelBase, color: colors.ink },
  }),
  pink: StyleSheet.create({
    container: { backgroundColor: colors.brand },
    label: { ...labelBase, color: colors.ink },
  }),
  danger: StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: alpha.hairline,
      borderRadius: radii.card,
      ...shadows.card,
    },
    label: { ...labelBase, color: colors.danger },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    label: { ...text.label(), color: colors.inkMuted },
  }),
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
