import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { spacing } from '@/theme';
import { Text } from './text';

/**
 * `Your roots  ·  4` — a section title with an optional trailing count or
 * action. Used on Home, root detail, workspace and invite.
 */

export interface SectionHeaderProps {
  title: string;
  /** Muted count on the right, e.g. the number of roots. */
  count?: number | string;
  /** Tappable trailing label, e.g. "Mark all read". */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Right-hand custom element (the "All" filter chip). */
  trailing?: React.ReactNode;
  variant?: 'sectionTitle' | 'rowTitle';
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  count,
  actionLabel,
  onActionPress,
  trailing,
  variant = 'sectionTitle',
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      <Text variant={variant}>{title}</Text>

      {trailing ??
        (actionLabel ? (
          <Pressable
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={8}
          >
            <Text variant="label" tone="muted">
              {actionLabel}
            </Text>
          </Pressable>
        ) : count !== undefined ? (
          <Text variant="label" tone="muted">
            {count}
          </Text>
        ) : null)}
    </View>
  );
}

/** Small muted label above a group — "Today", "Preferences", "Try asking". */
export function GroupLabel({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text variant="meta" tone="muted" style={[styles.groupLabel, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 2,
    marginBottom: spacing.base,
  },
  groupLabel: {
    marginHorizontal: 2,
    marginBottom: spacing.base,
  },
});
