import { Pressable, StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { STROKE_BOLD, type IconComponent } from '@/components/icons';
import { alpha, colors, radii, spacing, text } from '@/theme';
import { Text } from './text';

/**
 * Pill-shaped chips and tags.
 *
 * Covers the "Try asking" suggestion chips, the "All" filter, the quick-add
 * sheet's editable Title/Root/Shelf pills, tag chips and status badges.
 */

export type ChipTone = 'surface' | 'ink' | 'pink' | 'beige' | 'sand' | 'yellow' | 'green';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  tone?: ChipTone;
  /** Trailing icon — the chevron on dropdown pills, the X on removable tags. */
  icon?: IconComponent;
  iconLeading?: boolean;
  onIconPress?: () => void;
  bold?: boolean;
  small?: boolean;
  bordered?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const tones: Record<ChipTone, { background: string; color: string; bordered: boolean }> = {
  surface: { background: colors.surface, color: colors.ink, bordered: true },
  ink: { background: colors.ink, color: colors.onInk, bordered: false },
  pink: { background: colors.brand, color: colors.ink, bordered: false },
  beige: { background: colors.chipBeige, color: colors.inkMuted, bordered: false },
  sand: { background: colors.sand, color: colors.inkMuted, bordered: false },
  yellow: { background: colors.accents.yellow, color: colors.ink, bordered: false },
  green: { background: colors.accents.green, color: colors.onInk, bordered: false },
};

export function Chip({
  label,
  onPress,
  tone = 'surface',
  icon: Icon,
  iconLeading = false,
  onIconPress,
  bold = false,
  small = false,
  bordered,
  color,
  style,
  accessibilityLabel,
}: ChipProps) {
  const config = tones[tone];
  const showBorder = bordered ?? config.bordered;
  const foreground = color ?? config.color;
  const iconSize = small ? 11 : 13;

  const content = (
    <>
      {Icon && iconLeading ? <Icon size={iconSize} color={foreground} strokeWidth={STROKE_BOLD} /> : null}
      <Text
        variant={small ? 'meta' : bold ? 'labelStrong' : 'label'}
        color={foreground}
        numberOfLines={1}
      >
        {label}
      </Text>
      {Icon && !iconLeading ? (
        onIconPress ? (
          <Pressable
            onPress={onIconPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label}`}
          >
            <Icon size={iconSize} color={foreground} strokeWidth={STROKE_BOLD} />
          </Pressable>
        ) : (
          <Icon size={iconSize} color={foreground} strokeWidth={STROKE_BOLD} />
        )
      ) : null}
    </>
  );

  const chipStyle: ViewStyle = {
    backgroundColor: config.background,
    borderWidth: showBorder ? 1 : 0,
    borderColor: alpha.border,
    paddingVertical: small ? 6 : 8,
    paddingHorizontal: small ? spacing.base : spacing.lg,
  };

  if (!onPress) {
    return (
      <View style={[styles.base, chipStyle, style]} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.base, chipStyle, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  pressed: { opacity: 0.75 },
});

/**
 * Small solid badge — role labels ("Owner", "Admin"), the "Pro" plan tag and
 * the "Pending" invite marker.
 */
export function Badge({
  label,
  background,
  color,
  style,
}: {
  label: string;
  background: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[badgeStyles.base, { backgroundColor: background }, style]}>
      <Text variant="microStrong" color={color}>
        {label}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 11,
    alignSelf: 'flex-start',
  },
});

/** Coloured dot + label, used for link health and "Active context". */
export function StatusDot({
  color,
  size = 8,
  style,
}: {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radii.pill, backgroundColor: color },
        style,
      ]}
    />
  );
}

export { text as chipText };
