import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { TimelineEvent } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { Icons, SparkleFilled, STROKE, STROKE_BOLD } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { GroupLabel } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Emphasis, Text } from '@/components/ui/text';
import { formatRelative } from '@/lib/date';
import { useUiStore } from '@/store/ui.store';
import { accents, alpha, colors, layout, radii, spacing } from '@/theme';
import { groupTimeline, useTimeline, type TimelineScope } from '../hooks';

/**
 * Frame 14 — the activity feed.
 *
 * Rows are white with a coloured icon bubble; AI-summary rows invert to a pink
 * card. Events group under Today / Yesterday / Earlier headings.
 */

const KIND_STYLES: Record<
  TimelineEvent['kind'],
  { accent: keyof typeof accents; icon: typeof Icons.plus; strokeWidth: number; pink?: boolean }
> = {
  added: { accent: 'green', icon: Icons.plus, strokeWidth: STROKE_BOLD },
  ai_summary: { accent: 'pink', icon: Icons.sparkles, strokeWidth: STROKE, pink: true },
  dead_link: { accent: 'red', icon: Icons.close, strokeWidth: 2 },
  merged: { accent: 'blue', icon: Icons.copy, strokeWidth: STROKE },
  renamed: { accent: 'yellow', icon: Icons.store, strokeWidth: STROKE },
  archived: { accent: 'green', icon: Icons.check, strokeWidth: STROKE_BOLD },
  comment: { accent: 'lavender', icon: Icons.comment, strokeWidth: STROKE },
};

export function TimelineScreen() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const [scope, setScope] = useState<TimelineScope>('personal');
  const timeline = useTimeline(scope);

  return (
    <Screen hasTabBar onRefresh={() => void timeline.refetch()} refreshing={timeline.isRefetching}>
      <View style={styles.header}>
        <Text variant="screenTitle">Timeline</Text>
        <IconButton
          icon={Icons.filter}
          accessibilityLabel="Filter activity"
          size={layout.headerButtonSm}
          iconSize={18}
          onPress={() => showToast('Filters are coming soon.', 'info')}
        />
      </View>

      <SegmentedControl
        options={[
          { value: 'personal', label: 'Personal' },
          { value: 'team', label: 'Team' },
        ]}
        value={scope}
        onChange={setScope}
        style={styles.toggle}
      />

      <QueryBoundary
        query={timeline}
        isEmpty={(data) => data.length === 0}
        empty={{
          title: 'Nothing here yet',
          description:
            scope === 'team'
              ? 'Activity from your workspace will show up here.'
              : 'Save a link and your activity will start appearing.',
          icon: Icons.clock,
        }}
      >
        {(data) => (
          <>
            {groupTimeline(data).map((section) => (
              <View key={section.title}>
                <GroupLabel>{section.title}</GroupLabel>
                <View style={styles.group}>
                  {section.events.map((event) => (
                    <TimelineRow
                      key={event.id}
                      event={event}
                      onAction={() => {
                        if (event.actionLabel === 'Fix') router.push('/notifications');
                        else showToast(`${event.actionLabel} is coming soon.`, 'info');
                      }}
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function TimelineRow({ event, onAction }: { event: TimelineEvent; onAction: () => void }) {
  const config = KIND_STYLES[event.kind];
  const isPink = config.pink === true;

  return (
    <Card
      tone={isPink ? 'pink' : 'surface'}
      elevated={false}
      radius={radii.row}
      style={styles.row}
      accessibilityLabel={`${event.lead}${event.body}`}
    >
      {isPink ? (
        <View style={styles.pinkBubble}>
          <SparkleFilled size={16} />
        </View>
      ) : (
        <IconBubble
          icon={config.icon}
          accent={config.accent}
          size={34}
          iconSize={17}
          strokeWidth={config.strokeWidth}
          color={config.accent === 'red' ? colors.onInk : undefined}
        />
      )}

      <View style={styles.rowBody}>
        <Text variant="bodySm">
          {event.lead ? <Emphasis>{event.lead}</Emphasis> : null}
          {event.body}
          {event.trailingEmphasis ? <Emphasis>{event.trailingEmphasis}</Emphasis> : null}
        </Text>

        <Text
          variant="micro"
          color={isPink ? alpha.onPinkMuted : colors.inkMuted}
          style={styles.rowMeta}
        >
          {formatRelative(event.createdAt)}
        </Text>
      </View>

      {event.actionLabel ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text
            variant="metaStrong"
            tone={event.actionTone === 'danger' ? 'danger' : 'ink'}
            numberOfLines={1}
          >
            {event.actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  toggle: { marginBottom: spacing['4xl'] },
  group: { gap: spacing.md, marginBottom: spacing['4xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  pinkBubble: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: alpha.onPinkBubble,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowMeta: { marginTop: spacing.xxs },
});
