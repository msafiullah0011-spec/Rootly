import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { TimelineKind } from '@/api/schemas';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { pluralize } from '@/lib/format';
import { spacing } from '@/theme';
import { useUiStore } from '@/store/ui.store';

/**
 * Frame 14's filter affordance.
 *
 * Chips toggle straight into the store rather than staging a draft behind an
 * "Apply" button — the feed is right behind the sheet, so every tap shows its
 * own result. "Done" only dismisses.
 */

const KINDS: { kind: TimelineKind; label: string }[] = [
  { kind: 'added', label: 'Added' },
  { kind: 'ai_summary', label: 'AI summaries' },
  { kind: 'dead_link', label: 'Dead links' },
  { kind: 'merged', label: 'Merges' },
  { kind: 'renamed', label: 'Renames' },
  { kind: 'archived', label: 'Archives' },
  { kind: 'comment', label: 'Comments' },
];

export function TimelineFilterSheet() {
  const router = useRouter();
  const selected = useUiStore((state) => state.timelineKinds);
  const toggleKind = useUiStore((state) => state.toggleTimelineKind);
  const clearKinds = useUiStore((state) => state.clearTimelineKinds);

  const showingAll = selected.length === 0;

  return (
    <Sheet onDismiss={() => router.back()}>
      <View style={styles.header}>
        <IconBubble icon={Icons.filter} accent="blue" size={40} iconSize={19} />
        <View style={styles.headerText}>
          <Text variant="cardTitle">Filter activity</Text>
          <Text variant="meta" tone="muted">
            {showingAll ? 'Showing everything' : `${pluralize(selected.length, 'kind')} selected`}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        <Chip
          label="Everything"
          tone={showingAll ? 'ink' : 'surface'}
          bold={showingAll}
          onPress={clearKinds}
        />
        {KINDS.map(({ kind, label }) => {
          const isOn = selected.includes(kind);
          return (
            <Chip
              key={kind}
              label={label}
              tone={isOn ? 'ink' : 'surface'}
              bold={isOn}
              icon={isOn ? Icons.check : undefined}
              iconLeading
              onPress={() => toggleKind(kind)}
              accessibilityLabel={`${label}${isOn ? ', showing' : ''}`}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        {showingAll ? null : (
          <Button
            label="Reset"
            variant="secondary"
            size="block"
            fullWidth={false}
            onPress={clearKinds}
            style={styles.secondaryButton}
          />
        )}
        <Button label="Done" size="block" onPress={() => router.back()} style={styles.primaryButton} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  headerText: { flex: 1, minWidth: 0, gap: 2 },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },

  footer: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { paddingHorizontal: spacing['3xl'] },
  primaryButton: { flex: 1 },
});
