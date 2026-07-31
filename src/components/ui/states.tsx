import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { toUserMessage } from '@/api/errors';
import { Icons, type IconComponent } from '@/components/icons';
import { colors, radii, spacing } from '@/theme';
import { Button } from './button';
import { IconBubble } from './icon-bubble';
import { Text } from './text';

/**
 * Empty and error states.
 *
 * Error copy always comes from `toUserMessage` so the wording stays consistent
 * wherever a failure surfaces — screens pass the error, not a message.
 */

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconComponent;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  icon = Icons.folder,
  actionLabel,
  onAction,
  compact = false,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <IconBubble icon={icon} backgroundColor={colors.sand} color={colors.inkFaint} size={56} iconSize={24} />

      <Text variant="rowTitle" align="center" style={styles.title}>
        {title}
      </Text>

      {description ? (
        <Text variant="bodySm" tone="muted" align="center" style={styles.description}>
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="md" style={styles.action} />
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({ error, onRetry, compact = false, style }: ErrorStateProps) {
  const { title, description } = toUserMessage(error);

  return (
    <View style={[styles.container, compact && styles.compact, style]} accessibilityRole="alert">
      <IconBubble
        icon={Icons.close}
        backgroundColor={colors.accents.red}
        color={colors.onInk}
        size={56}
        iconSize={24}
        strokeWidth={2}
      />

      <Text variant="rowTitle" align="center" style={styles.title}>
        {title}
      </Text>

      <Text variant="bodySm" tone="muted" align="center" style={styles.description}>
        {description}
      </Text>

      {onRetry ? (
        <Button label="Try again" onPress={onRetry} size="md" style={styles.action} />
      ) : null}
    </View>
  );
}

/** Inline error strip, for when a full-screen state would be too heavy. */
export function InlineError({
  error,
  onRetry,
  style,
}: {
  error: unknown;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, description } = toUserMessage(error);

  return (
    <View style={[styles.inline, style]} accessibilityRole="alert">
      <View style={styles.inlineBody}>
        <Text variant="bodySmStrong" tone="danger">
          {title}
        </Text>
        <Text variant="meta" tone="muted">
          {description}
        </Text>
      </View>
      {onRetry ? <Button label="Retry" onPress={onRetry} size="sm" variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing['3xl'],
  },
  compact: { paddingVertical: spacing['5xl'] },
  title: { marginTop: spacing.xl },
  description: { marginTop: spacing.sm, maxWidth: 280 },
  action: { marginTop: spacing['3xl'] },

  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accents.red,
    borderRadius: radii.row,
    padding: spacing.lg,
  },
  inlineBody: { flex: 1, gap: 2 },
});
