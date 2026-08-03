import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { AppNotification } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { Icons, STROKE, STROKE_HEAVY } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { GroupLabel, SectionHeader } from '@/components/ui/section-header';
import { RichText, Text } from '@/components/ui/text';
import { describeTarget, hrefForTarget } from '@/features/timeline/targets';
import { formatRelative, relativeBucket } from '@/lib/date';
import { useUiStore } from '@/store/ui.store';
import { alpha, colors, radii, spacing } from '@/theme';
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks';

/**
 * Frame 11 — the alerts inbox.
 *
 * Unread alerts are pink cards with an action; read ones drop to a plain white
 * card with muted body text and no button.
 *
 * Going from one to the other is animated rather than instant, because "mark
 * all read" otherwise repaints the whole screen between two frames and the user
 * has no idea what just happened. Each card's pink is a layer over the white
 * one, so marking read fades the pink off, settles the card with a small
 * scale, and lets the action button collapse out — staggered down the list, so
 * the change reads as a sweep the user caused rather than a re-render.
 */

/** Gap between one card starting its transition and the next. */
const STAGGER_MS = 70;
/** Past this many rows the stagger stops growing, or the tail would crawl. */
const STAGGER_MAX_ROWS = 8;

const KIND_ICONS = {
  dead_link: Icons.close,
  renewal: Icons.card,
  duplicate: Icons.copy,
  digest: Icons.check,
} as const;

export function NotificationsScreen() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const notifications = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  /**
   * Opening an alert is also acknowledging it, so the card drops to its read
   * state on the way out — that's what "you've dealt with this" looks like.
   * Alerts that predate targets (a digest, say) say so rather than going home.
   */
  const openNotification = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id);

    if (!notification.target) {
      showToast('There’s nothing to open for this alert.', 'info');
      return;
    }
    router.push(hrefForTarget(notification.target));
  };

  // Nothing left to mark means nothing to offer — the label would be a button
  // that visibly does nothing.
  const hasUnread = (notifications.data ?? []).some((item) => !item.read);

  return (
    <Screen>
      <SectionHeader
        title="Alerts"
        variant="sectionTitle"
        actionLabel={hasUnread ? 'Mark all read' : undefined}
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
          // Rows keep their position in the whole list, not their group, so the
          // stagger runs top to bottom across the "Earlier" divider too.
          const rows = data.map((item, index) => ({ item, index }));
          const today = rows.filter(({ item }) => relativeBucket(item.createdAt) === 'today');
          const earlier = rows.filter(({ item }) => relativeBucket(item.createdAt) !== 'today');

          return (
            <>
              {today.length > 0 ? (
                <>
                  <GroupLabel>Today</GroupLabel>
                  <View style={styles.group}>
                    {today.map(({ item, index }) => (
                      <NotificationCard
                        key={item.id}
                        notification={item}
                        index={index}
                        bulk={markAllRead.isPending}
                        onOpen={() => openNotification(item)}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {earlier.length > 0 ? (
                <>
                  <GroupLabel>Earlier this week</GroupLabel>
                  <View style={styles.group}>
                    {earlier.map(({ item, index }) => (
                      <NotificationCard
                        key={item.id}
                        notification={item}
                        index={index}
                        bulk={markAllRead.isPending}
                        onOpen={() => openNotification(item)}
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
  index,
  bulk,
  onOpen,
}: {
  notification: AppNotification;
  /** Position in the full list, which sets this card's place in the stagger. */
  index: number;
  /** Whether "mark all read" is what's flipping this card. */
  bulk: boolean;
  /** Tapping the card and tapping its button do the same thing. */
  onOpen: () => void;
}) {
  const isRead = notification.read;
  const Icon = KIND_ICONS[notification.kind];

  /** 1 while unread — the opacity of everything that's pink about the card. */
  const pink = useSharedValue(isRead ? 0 : 1);
  const scale = useSharedValue(1);
  /**
   * Only a card that *changes* state animates. Seeded from the current value so
   * an already-read card arriving on screen renders read rather than playing
   * the transition, and so a re-render that doesn't touch `read` plays nothing.
   */
  const wasRead = useRef(isRead);

  useEffect(() => {
    if (wasRead.current === isRead) return;
    wasRead.current = isRead;

    // One card turning over on its own has nothing to be staggered against.
    const delay = bulk ? Math.min(index, STAGGER_MAX_ROWS) * STAGGER_MS : 0;

    pink.value = withDelay(
      delay,
      withTiming(isRead ? 0 : 1, { duration: 340, easing: Easing.out(Easing.quad) }),
    );

    if (isRead) {
      // A small press-in and release: the card acknowledges being handled.
      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(0.985, { duration: 120 }),
          withSpring(1, { damping: 14, stiffness: 260 }),
        ),
      );
    }
  }, [isRead, index, bulk, pink, scale]);

  const pinkStyle = useAnimatedStyle(() => ({ opacity: pink.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={cardStyle} layout={LinearTransition.duration(260)}>
      <Card
        // The card is always the white one; the pink is a layer on top of it,
        // which is what makes the change to read a fade rather than a swap.
        tone="surface"
        elevated={false}
        style={styles.card}
        onPress={onOpen}
        accessibilityLabel={`${notification.title}. ${notification.body}`}
        accessibilityHint={
          notification.target ? describeTarget(notification.target) : undefined
        }
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.pinkLayer, pinkStyle]}
        />

        <View style={styles.cardHeader}>
          {/* Same trick at bubble scale: green underneath, pink over it. */}
          <View>
            <IconBubble
              icon={Icon}
              backgroundColor={colors.accents.green}
              color={colors.onInk}
              size={30}
              iconSize={16}
              strokeWidth={STROKE_HEAVY}
            />
            <Animated.View style={[StyleSheet.absoluteFill, pinkStyle]}>
              <IconBubble
                icon={Icon}
                backgroundColor={alpha.onPinkBubble}
                color={colors.ink}
                size={30}
                iconSize={16}
                strokeWidth={notification.kind === 'dead_link' ? STROKE_HEAVY : STROKE}
              />
            </Animated.View>
          </View>

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
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)}>
            <Button label={notification.actionLabel} onPress={onOpen} size="sm" />
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing['3xl'] },
  group: { gap: spacing.base, marginBottom: spacing['4xl'] },
  // `overflow: hidden` keeps the pink layer inside the rounded corners.
  card: { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl, overflow: 'hidden' },
  // Sits over the white card's hairline too, so the border arrives with the
  // read state instead of showing through the pink.
  pinkLayer: { backgroundColor: colors.brand, borderRadius: radii.card },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { flex: 1 },
  cardBody: { marginBottom: spacing.lg },
});
