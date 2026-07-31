import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { AppNotification } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { Icons, STROKE, STROKE_HEAVY } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { GroupLabel, SectionHeader } from '@/components/ui/section-header';
import { RichText, Text } from '@/components/ui/text';
import { formatRelative, relativeBucket } from '@/lib/date';
import { alpha, colors, spacing } from '@/theme';
import { useMarkAllRead, useNotifications } from '../hooks';

/**
 * Frame 11 — the alerts inbox.
 *
 * Unread alerts are pink cards with an action; read ones drop to a plain white
 * card with muted body text and no button.
 */

const KIND_ICONS = {
  dead_link: Icons.close,
  renewal: Icons.card,
  duplicate: Icons.copy,
  digest: Icons.check,
} as const;

export function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotifications();
  const markAllRead = useMarkAllRead();

  return (
    <Screen>
      <SectionHeader
        title="Alerts"
        variant="sectionTitle"
        actionLabel="Mark all read"
        onActionPress={() => markAllRead.mutate()}
        style={styles.header}
      />

      <QueryBoundary
        query={notifications}
        isEmpty={(data) => data.length === 0}
        empty={{
          title: "You're all caught up",
          description: 'Rootly will let you know when a link dies or a renewal is due.',
          icon: Icons.bell,
        }}
      >
        {(data) => {
          const today = data.filter((item) => relativeBucket(item.createdAt) === 'today');
          const earlier = data.filter((item) => relativeBucket(item.createdAt) !== 'today');

          return (
            <>
              {today.length > 0 ? (
                <>
                  <GroupLabel>Today</GroupLabel>
                  <View style={styles.group}>
                    {today.map((item) => (
                      <NotificationCard
                        key={item.id}
                        notification={item}
                        onAction={() => router.push('/(tabs)')}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {earlier.length > 0 ? (
                <>
                  <GroupLabel>Earlier this week</GroupLabel>
                  <View style={styles.group}>
                    {earlier.map((item) => (
                      <NotificationCard
                        key={item.id}
                        notification={item}
                        onAction={() => router.push('/(tabs)')}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </Screen>
  );
}

function NotificationCard({
  notification,
  onAction,
}: {
  notification: AppNotification;
  onAction: () => void;
}) {
  const isRead = notification.read;
  const Icon = KIND_ICONS[notification.kind];

  return (
    <Card
      tone={isRead ? 'surface' : 'pink'}
      elevated={false}
      style={styles.card}
      accessibilityLabel={`${notification.title}. ${notification.body}`}
    >
      <View style={styles.cardHeader}>
        <IconBubble
          icon={Icon}
          backgroundColor={isRead ? colors.accents.green : alpha.onPinkBubble}
          color={isRead ? colors.onInk : colors.ink}
          size={30}
          iconSize={16}
          strokeWidth={notification.kind === 'dead_link' || isRead ? STROKE_HEAVY : STROKE}
        />

        <Text variant="bodySmStrong" style={styles.cardTitle}>
          {notification.title}
        </Text>

        <Text variant="micro" color={isRead ? colors.inkMuted : alpha.onPinkMuted}>
          {formatRelative(notification.createdAt)}
        </Text>
      </View>

      <RichText
        body={notification.body}
        emphasis={notification.emphasis}
        variant="bodySm"
        tone={isRead ? 'muted' : 'ink'}
        style={notification.actionLabel && !isRead ? styles.cardBody : undefined}
      />

      {notification.actionLabel && !isRead ? (
        <Button label={notification.actionLabel} onPress={onAction} size="sm" />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing['3xl'] },
  group: { gap: spacing.base, marginBottom: spacing['4xl'] },
  card: { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { flex: 1 },
  cardBody: { marginBottom: spacing.lg },
});
