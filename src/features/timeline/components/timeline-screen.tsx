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
import { groupTimeline, useTimeline, useUndoTimelineEvent, type TimelineScope } from '../hooks';
import { hrefForTarget } from '../targets';

/**
 * Frame 14 — the activity feed.
 *
 * Rows are white with a coloured icon bubble; AI-summary rows invert to a pink
 * card. Events group under Today / Yesterday / Earlier headings.
 */

interface KindStyle {
  accent: keyof typeof accents;
  icon: typeof Icons.plus;
  strokeWidth: number;
  pink?: boolean;
}

const KIND_STYLES: Record<TimelineEvent['kind'], KindStyle> = {
  added: { accent: 'green', icon: Icons.plus, strokeWidth: STROKE_BOLD },
  ai_summary: { accent: 'pink', icon: Icons.sparkles, strokeWidth: STROKE, pink: true },
  dead_link: { accent: 'red', icon: Icons.close, strokeWidth: 2 },
  merged: { accent: 'blue', icon: Icons.copy, strokeWidth: STROKE },
  renamed: { accent: 'yellow', icon: Icons.store, strokeWidth: STROKE },
  archived: { accent: 'green', icon: Icons.check, strokeWidth: STROKE_BOLD },
  comment: { accent: 'lavender', icon: Icons.comment, strokeWidth: STROKE },
};

/** A kind the client doesn't know yet must not blank the row out. */
const FALLBACK_KIND_STYLE: KindStyle = {
  accent: 'blue',
  icon: Icons.clock,
  strokeWidth: STROKE,
};

export function TimelineScreen() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const kinds = useUiStore((state) => state.timelineKinds);
  const clearKinds = useUiStore((state) => state.clearTimelineKinds);
  const [scope, setScope] = useState<TimelineScope>('personal');
  const timeline = useTimeline(scope, kinds);
  const undo = useUndoTimelineEvent();

  const isFiltered = kinds.length > 0;

  return (
    <Screen hasTabBar onRefresh={() => void timeline.refetch()} refreshing={timeline.isRefetching}>
      <View style={styles.header}>
        <Text variant="screenTitle">Timeline</Text>
        <IconButton
          icon={Icons.filter}
          accessibilityLabel={isFiltered ? 'Filter activity, filters on' : 'Filter activity'}
          size={layout.headerButtonSm}
          iconSize={18}
          // The ink fill is the only signal that the feed is showing a subset.
          backgroundColor={isFiltered ? colors.ink : undefined}
          color={isFiltered ? colors.onInk : undefined}
          onPress={() => router.push('/timeline-filter')}
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
        empty={
          isFiltered
            ? {
                title: 'Nothing matches those filters',
                description: 'Try a different kind of activity, or show everything again.',
                icon: Icons.filter,
                actionLabel: 'Show everything',
                onAction: clearKinds,
              }
            : {
                title: 'Nothing here yet',
                description:
                  scope === 'team'
                    ? 'Activity from your workspace will show up here.'
                    : 'Save a link and your activity will start appearing.',
                icon: Icons.clock,
              }
        }
      >
        {(data) => (
          <>
            {groupTimeline(data).map((section) => (
              <View key={section.title}>
                <GroupLabel>{section.title}</GroupLabel>
                <View style={styles.group}>
                  {section.events.map((event) => {
                    // Every event that references something opens it when the
                    // row itself is tapped. What the *label* does depends on the
                    // event: undo hits the server, reply opens the composer.
                    const { target } = event;

                    // An event with nothing to open still has to answer a tap —
                    // saying so is better than a row that silently does nothing.
                    const open = target
                      ? () => router.push(hrefForTarget(target))
                      : () =>
                          showToast(
                            'This activity has nothing left to open.',
                            'info',
                          );

                    let onAction: () => void;
                    switch (event.actionKind) {
                      case 'undo':
                        onAction = () => undo.mutate(event.id);
                        break;
                      case 'reply':
                        onAction = () =>
                          router.push({
                            pathname: '/timeline-reply',
                            params: { eventId: event.id },
                          });
                        break;
                      default:
                        onAction = open;
                    }

                    return (
                      <TimelineRow
                        key={event.id}
                        event={event}
                        onOpen={open}
                        onAction={onAction}
                        actionPending={undo.isPending && undo.variables === event.id}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function TimelineRow({
  event,
  onAction,
  onOpen,
  actionPending = false,
}: {
  event: TimelineEvent;
  onAction: () => void;
  /** What tapping the row body does. */
  onOpen?: () => void;
  /** Dims and locks the label while its mutation is in flight. */
  actionPending?: boolean;
}) {
  const config = KIND_STYLES[event.kind] ?? FALLBACK_KIND_STYLE;
  const isPink = config.pink === true;

  return (
    <Card
      tone={isPink ? 'pink' : 'surface'}
      elevated={false}
      radius={radii.row}
      style={styles.row}
      onPress={onOpen}
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
        <Pressable
          onPress={onAction}
          disabled={actionPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: actionPending, busy: actionPending }}
          hitSlop={8}
          style={actionPending ? styles.actionPending : undefined}
        >
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
  actionPending: { opacity: 0.4 },
});
