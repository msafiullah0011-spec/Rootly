import { Pressable, StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { Icons, STROKE } from '@/components/icons';
import { alpha, colors, radii, spacing } from '@/theme';
import { Text } from './text';

/**
 * Generic tappable row: leading element, title + meta, trailing chevron.
 *
 * Backs the shelf list, settings rows, related links and member rows — anywhere
 * the design repeats the "icon, two lines of text, chevron" pattern.
 */

export interface ListRowProps {
  title: string;
  meta?: string;
  /** Custom meta node, when the line needs a dot or mixed colours. */
  metaNode?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Shows the standard chevron on the right. */
  chevron?: boolean;
  onPress?: () => void;
  /** Card chrome. Off when the row sits inside a grouped card. */
  card?: boolean;
  radius?: number;
  padding?: number;
  /** Hairline divider below, for grouped rows. */
  divider?: boolean;
  titleTone?: 'ink' | 'muted';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  meta,
  metaNode,
  leading,
  trailing,
  chevron = false,
  onPress,
  card = true,
  radius = radii.row,
  padding,
  divider = false,
  titleTone = 'ink',
  style,
  accessibilityHint,
}: ListRowProps) {
  const content = (
    <>
      {leading}

      <View style={styles.body}>
        <Text variant="rowTitle" tone={titleTone} numberOfLines={1}>
          {title}
        </Text>
        {metaNode ??
          (meta ? (
            <Text variant="meta" tone="muted" style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null)}
      </View>

      {trailing}
      {chevron ? (
        <Icons.chevronRight size={18} color={colors.inkMuted} strokeWidth={STROKE} />
      ) : null}
    </>
  );

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: padding ?? spacing.lg,
    paddingHorizontal: padding ?? spacing.xl,
    ...(card
      ? {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: alpha.hairline,
          borderRadius: radius,
        }
      : null),
    ...(divider
      ? { borderBottomWidth: 1, borderBottomColor: alpha.hairline }
      : null),
  };

  if (!onPress) {
    return <View style={[rowStyle, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={meta ? `${title}, ${meta}` : title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, minWidth: 0 },
  meta: { marginTop: 2 },
  pressed: { opacity: 0.75 },
});

/** 1px hairline used between grouped rows and inside cards. */
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[dividerStyles.line, style]} />;
}

const dividerStyles = StyleSheet.create({
  line: { height: 1, backgroundColor: alpha.hairline },
});
