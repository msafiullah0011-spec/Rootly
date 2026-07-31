import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { Shelf } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, STROKE, iconForKey } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip, StatusDot } from '@/components/ui/chip';
import { ConicRing } from '@/components/ui/conic-ring';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { AssistantCard } from '@/features/assistant/components/assistant-card';
import { useSuggestions } from '@/features/assistant/hooks';
import { initial, joinMeta, pluralize } from '@/lib/format';
import { useUiStore } from '@/store/ui.store';
import { accents, colors, display, radii, shadows, spacing } from '@/theme';
import { useRoot, useRootShelves } from '../hooks';

/**
 * Frame 2 — Root detail, "the control room".
 *
 * The ring is the root's five shelves rendered as arcs, with a floating chip
 * per shelf pinned around its circumference.
 */

const RING_SIZE = 236;
const RING_THICKNESS = 26;
const CHIP_SIZE = 30;

export function RootDetailScreen({ rootId }: { rootId: string }) {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);

  const root = useRoot(rootId);
  const shelves = useRootShelves(rootId);
  const suggestions = useSuggestions();

  // The inline assistant strip shows a suggestion scoped to this root.
  const suggestion = suggestions.data?.find((item) => item.rootId === rootId);

  return (
    <Screen>
      <ScreenHeader
        title={root.data?.name}
        subtitle={
          root.data ? (
            <View style={styles.statusLine}>
              <StatusDot color={accents.green} size={7} />
              <Text variant="meta" color={accents.green}>
                Active context
              </Text>
            </View>
          ) : null
        }
        trailing={
          <IconButton
            icon={Icons.moreVertical}
            accessibilityLabel="Root options"
            iconSize={20}
            onPress={() => showToast('Root options are coming soon.', 'info')}
          />
        }
      />

      <QueryBoundary query={shelves} loading={<SkeletonList count={5} />}>
        {(shelfList) => (
          <>
            <View style={styles.ringWrapper}>
              <ConicRing
                size={RING_SIZE}
                thickness={RING_THICKNESS}
                animate
                animationDuration={600}
              >
                <Text style={styles.ringInitial} allowFontScaling={false}>
                  {initial(root.data?.name ?? '')}
                </Text>
                <Text variant="label" tone="muted" style={styles.ringMeta}>
                  {joinMeta(
                    pluralize(root.data?.linkCount ?? 0, 'link'),
                    pluralize(shelfList.length, 'shelf', 'shelves'),
                  )}
                </Text>
              </ConicRing>

              {shelfList.slice(0, 5).map((shelf, index) => (
                <ShelfOrbitChip key={shelf.id} shelf={shelf} index={index} />
              ))}
            </View>

            <View style={styles.actions}>
              <Button
                label="Add link"
                icon={Icons.plus}
                onPress={() => router.push('/quick-add')}
                size="lg"
              />
              <IconButton
                icon={Icons.share}
                accessibilityLabel="Share this root"
                size={48}
                iconSize={19}
                onPress={() => showToast('Sharing is coming soon.', 'info')}
              />
              <IconButton
                icon={Icons.upload}
                accessibilityLabel="Export this root"
                size={48}
                iconSize={19}
                onPress={() => showToast('Export is coming soon.', 'info')}
              />
              <IconButton
                icon={Icons.plus}
                accessibilityLabel="Add a shelf"
                size={48}
                iconSize={19}
                onPress={() => showToast('New shelves are coming soon.', 'info')}
              />
            </View>

            {suggestion ? (
              <AssistantCard
                suggestion={suggestion}
                variant="inline"
                onAction={() => router.push('/notifications')}
                style={styles.assistant}
              />
            ) : null}

            <SectionHeader
              title="Shelves"
              trailing={<Chip label="All" icon={Icons.chevronDown} small />}
            />

            <View style={styles.shelfList}>
              {shelfList.map((shelf) => (
                <ListRow
                  key={shelf.id}
                  title={shelf.name}
                  meta={pluralize(shelf.linkCount, 'link')}
                  radius={radii.row}
                  padding={undefined}
                  leading={
                    <IconBubble icon={iconForKey(shelf.icon)} accent={shelf.accent} size={36} iconSize={18} />
                  }
                  chevron
                  onPress={() => router.push(`/roots/${rootId}/shelves/${shelf.id}`)}
                  style={styles.shelfRow}
                />
              ))}
            </View>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

/**
 * A shelf chip pinned around the ring. Positions are computed from the same
 * arc geometry as `ConicRing`, so a root with fewer than five shelves still
 * spaces its chips evenly.
 */
function ShelfOrbitChip({ shelf, index }: { shelf: Shelf; index: number }) {
  // Centre of each 64° arc: -8 + index * 72 + 32.
  const angle = (-8 + index * 72 + 32 - 90) * (Math.PI / 180);
  const orbitRadius = (RING_SIZE - RING_THICKNESS) / 2;
  const center = RING_SIZE / 2 - CHIP_SIZE / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.orbitChip,
        {
          left: center + orbitRadius * Math.cos(angle),
          top: center + orbitRadius * Math.sin(angle),
        },
      ]}
    >
      <IconBubble
        icon={iconForKey(shelf.icon)}
        accent={shelf.accent}
        size={CHIP_SIZE}
        iconSize={17}
        strokeWidth={STROKE}
        style={shadows.chip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },

  ringWrapper: {
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  ringInitial: {
    ...display(52, 800),
    color: colors.ink,
    lineHeight: 52,
  },
  ringMeta: { marginTop: spacing.sm },
  orbitChip: { position: 'absolute' },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  assistant: { marginBottom: spacing['3xl'] },

  shelfList: { gap: spacing.md },
  shelfRow: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
});
