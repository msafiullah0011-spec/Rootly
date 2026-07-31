import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import type { Suggestion } from '@/api/schemas';
import { SparkleFilled } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RichText, Text } from '@/components/ui/text';
import { spacing } from '@/theme';

/**
 * The pink "Rootly assistant" card.
 *
 * Two layouts share the same data: `stacked` (Home — header, body, then a
 * button below) and `inline` (root detail — icon, one line of text and the
 * action on the right).
 */

export interface AssistantCardProps {
  suggestion: Suggestion;
  onAction: () => void;
  variant?: 'stacked' | 'inline';
  style?: StyleProp<ViewStyle>;
}

export function AssistantCard({
  suggestion,
  onAction,
  variant = 'stacked',
  style,
}: AssistantCardProps) {
  if (variant === 'inline') {
    return (
      <Card tone="pink" elevated={false} style={[styles.inlineCard, style]}>
        <SparkleFilled size={20} />
        <RichText
          body={suggestion.body}
          emphasis={suggestion.emphasis}
          variant="bodySm"
          style={styles.inlineBody}
        />
        <Button label={suggestion.actionLabel} onPress={onAction} size="sm" />
      </Card>
    );
  }

  return (
    <Card tone="pink" elevated={false} padding={spacing['3xl']} style={style}>
      <View style={styles.header}>
        <SparkleFilled size={18} />
        <Text variant="labelStrong">Rootly assistant</Text>
      </View>

      <RichText
        body={suggestion.body}
        emphasis={suggestion.emphasis}
        variant="bodyText"
        style={styles.body}
      />

      <Button label={suggestion.actionLabel} onPress={onAction} size="md" />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  body: { marginBottom: spacing.xl },

  inlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  inlineBody: { flex: 1 },
});
