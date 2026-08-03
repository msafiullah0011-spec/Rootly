import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import type { Link, Shelf } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, STROKE, iconForKey } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip, StatusDot } from '@/components/ui/chip';
import { ConicRing, ringSegmentAngle } from '@/components/ui/conic-ring';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { AssistantCard } from '@/features/assistant/components/assistant-card';
import { useSuggestions } from '@/features/assistant/hooks';
import { initial, joinMeta, pluralize } from '@/lib/format';
import { accents, colors, display, radii, shadows, spacing } from '@/theme';
import { useRoot, useRootActions, useRootLinks, useRootShelves } from '../hooks';

/**
 * Frame 2 — Root detail, "the control room".
 *
 * The ring is the root's shelves rendered as arcs, with a floating chip per
 * shelf pinned to the middle of its own arc. Each chip opens its shelf.
 *
 * One arc per shelf, in that shelf's accent — so the ring reads as this root
 * rather than as decoration that happens to sit above the list. A root with
 * five shelves reproduces the handoff exactly; three shelves get three arcs,
 * and a root with none falls back to the brand's five-colour rotation.
 */

const RING_SIZE = 236;
const RING_THICKNESS = 26;

/**
 * How many shelves the ring carries. Past this the most recent win — a root
 * with thirty shelves would turn the ring into a bead necklace.
 */
const RING_MAX_SHELVES = 10;
/** The handoff's shelf count, and the size its chips are drawn at. */
const RING_BASE_SHELVES = 5;
const CHIP_SIZE_MAX = 30;
/** Chip size at a full ring, so ten of them still read as separate objects. */
const CHIP_SIZE_MIN = 22;
/** Touch target around each chip — the bubble alone is under 44pt. */
const CHIP_TOUCH_SIZE = 44;
/**
 * Slack around the ring so those touch targets stay inside the wrapper.
 * Android drops touches that fall outside a parent's bounds, and a chip's box
 * reaches `orbitRadius + CHIP_TOUCH_SIZE / 2` from the centre — 9px past the
 * ring's edge. The wrapper's margins give the padding back so the ring sits
 * where the handoff puts it.
 */
const RING_PAD = 12;

/** Chips shrink as the ring fills, so ten still read as separate objects. */
function ringChipSize(count: number): number {
  if (count <= RING_BASE_SHELVES) return CHIP_SIZE_MAX;
  const t = (count - RING_BASE_SHELVES) / (RING_MAX_SHELVES - RING_BASE_SHELVES);
  return Math.round(CHIP_SIZE_MAX - t * (CHIP_SIZE_MAX - CHIP_SIZE_MIN));
}

/**
 * The "All" pill above the shelf list.
 *
 * The ring keeps showing every shelf — it's the root's identity, not a view of
 * the list — so the filter narrows the rows underneath it only.
 */
type ShelfFilter = 'all' | 'active' | 'attention' | 'empty';

const SHELF_FILTERS: { value: ShelfFilter; label: string; emptyLabel: string }[] = [
  { value: 'all', label: 'All', emptyLabel: 'This root has no shelves yet.' },
  { value: 'active', label: 'With links', emptyLabel: 'None of these shelves hold a link yet.' },
  { value: 'attention', label: 'Needs attention', emptyLabel: 'No dead links in this root.' },
  { value: 'empty', label: 'Empty', emptyLabel: 'Every shelf here has something on it.' },
];

function filterShelves(shelves: Shelf[], filter: ShelfFilter, links: Link[]): Shelf[] {
  switch (filter) {
    case 'active':
      return shelves.filter((shelf) => shelf.linkCount > 0);
    case 'empty':
      return shelves.filter((shelf) => shelf.linkCount === 0);
    case 'attention': {
      const ailing = new Set(
        links.filter((link) => link.status === 'dead').map((link) => link.shelfId),
      );
      return shelves.filter((shelf) => ailing.has(shelf.id));
    }
    default:
      return shelves;
  }
}

export function RootDetailScreen({ rootId }: { rootId: string }) {
  const router = useRouter();

  const root = useRoot(rootId);
  const shelves = useRootShelves(rootId);
  const links = useRootLinks(rootId);
  const suggestions = useSuggestions();
  const actions = useRootActions(rootId);

  const [filter, setFilter] = useState<ShelfFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const rootName = root.data?.name ?? 'this root';
  const activeFilter = SHELF_FILTERS.find((option) => option.value === filter) ?? SHELF_FILTERS[0];

  const shelfLinks = useMemo(() => links.data ?? [], [links.data]);

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
            onPress={() => router.push({ pathname: '/root-options', params: { rootId } })}
          />
        }
      />

      <QueryBoundary query={shelves} loading={<SkeletonList count={5} />}>
        {(shelfList) => (
          <>
            <ShelfRing
              shelves={shelfList}
              rootName={root.data?.name ?? ''}
              linkCount={root.data?.linkCount ?? 0}
              onOpenShelf={(shelfId) => router.push(`/roots/${rootId}/shelves/${shelfId}`)}
            />

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
                onPress={() => void actions.shareRoot(rootName)}
              />
              <IconButton
                icon={Icons.upload}
                accessibilityLabel="Export this root"
                size={48}
                iconSize={19}
                disabled={actions.isExporting}
                onPress={() => void actions.exportRootLinks(rootName)}
              />
              <IconButton
                icon={Icons.plus}
                accessibilityLabel="Add a shelf"
                size={48}
                iconSize={19}
                onPress={() => router.push({ pathname: '/shelf-form', params: { rootId } })}
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
              trailing={
                <Chip
                  label={activeFilter.label}
                  icon={Icons.chevronDown}
                  small
                  tone={filter === 'all' ? 'surface' : 'ink'}
                  onPress={() => setFilterOpen((open) => !open)}
                  accessibilityLabel={`Filter shelves, showing ${activeFilter.label.toLowerCase()}`}
                />
              }
            />

            {filterOpen ? (
              <View style={styles.filterRow}>
                {SHELF_FILTERS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    small
                    tone={option.value === filter ? 'ink' : 'surface'}
                    icon={option.value === filter ? Icons.check : undefined}
                    onPress={() => {
                      setFilter(option.value);
                      setFilterOpen(false);
                    }}
                    accessibilityLabel={`${option.label}${option.value === filter ? ', selected' : ''}`}
                  />
                ))}
              </View>
            ) : null}

            {(() => {
              const visible = filterShelves(shelfList, filter, shelfLinks);

              if (visible.length === 0) {
                return (
                  <Text variant="bodySm" tone="muted" style={styles.shelfEmpty}>
                    {activeFilter.emptyLabel}
                  </Text>
                );
              }

              return (
                <View style={styles.shelfList}>
                  {visible.map((shelf) => (
                    <ListRow
                      key={shelf.id}
                      title={shelf.name}
                      meta={pluralize(shelf.linkCount, 'link')}
                      radius={radii.row}
                      padding={undefined}
                      leading={
                        <IconBubble
                          icon={iconForKey(shelf.icon)}
                          accent={shelf.accent}
                          size={36}
                          iconSize={18}
                        />
                      }
                      // The ⋮ replaces the chevron rather than joining it: the
                      // row already opens the shelf, so a second "go" affordance
                      // would only crowd the one action it can't offer.
                      trailing={
                        <IconButton
                          icon={Icons.moreVertical}
                          accessibilityLabel={`${shelf.name} options`}
                          size={32}
                          iconSize={17}
                          bordered={false}
                          backgroundColor="transparent"
                          onPress={() =>
                            router.push({
                              pathname: '/shelf-options',
                              params: { rootId, shelfId: shelf.id },
                            })
                          }
                        />
                      }
                      onPress={() => router.push(`/roots/${rootId}/shelves/${shelf.id}`)}
                      style={styles.shelfRow}
                    />
                  ))}
                </View>
              );
            })()}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

/**
 * The root's identity: one arc per shelf in that shelf's accent, its initial
 * and counts in the middle, and a chip on each arc that opens it.
 *
 * Only the newest `RING_MAX_SHELVES` get an arc — `db` appends on create, so
 * the tail of the list is the most recent. The rows underneath still list
 * every shelf.
 */
function ShelfRing({
  shelves,
  rootName,
  linkCount,
  onOpenShelf,
}: {
  shelves: Shelf[];
  rootName: string;
  linkCount: number;
  onOpenShelf: (shelfId: string) => void;
}) {
  const orbit = shelves.slice(-RING_MAX_SHELVES);
  const chipSize = ringChipSize(orbit.length);

  return (
    <View style={styles.ringWrapper}>
      <ConicRing
        size={RING_SIZE}
        thickness={RING_THICKNESS}
        segments={orbit.map((shelf) => accents[shelf.accent])}
        animate
        animationDuration={600}
        style={styles.ring}
      >
        <Text style={styles.ringInitial} allowFontScaling={false}>
          {initial(rootName)}
        </Text>
        <Text variant="label" tone="muted" style={styles.ringMeta}>
          {joinMeta(
            pluralize(linkCount, 'link'),
            pluralize(shelves.length, 'shelf', 'shelves'),
          )}
        </Text>
      </ConicRing>

      {orbit.map((shelf, index) => (
        <ShelfOrbitChip
          key={shelf.id}
          shelf={shelf}
          index={index}
          count={orbit.length}
          size={chipSize}
          onPress={() => onOpenShelf(shelf.id)}
        />
      ))}
    </View>
  );
}

/**
 * A shelf chip pinned to the ring, and the shortest route into that shelf.
 *
 * The angle comes from `ringSegmentAngle` — the same function the ring itself
 * lays its arcs out with — so a chip always sits on the middle of its own arc,
 * whatever the shelf count. At five that's 24°, 96°, 168°, 240°, 312°, exactly
 * where the handoff puts them.
 */
function ShelfOrbitChip({
  shelf,
  index,
  count,
  size,
  onPress,
}: {
  shelf: Shelf;
  index: number;
  count: number;
  size: number;
  onPress: () => void;
}) {
  const angle = (ringSegmentAngle(index, count) - 90) * (Math.PI / 180);
  // Ride the centreline of the stroke, matching ConicRing's arc radius.
  const orbitRadius = (RING_SIZE - RING_THICKNESS) / 2;
  // Offset by half the touch box so the coordinate lands on the chip's centre,
  // then by the wrapper's slack, which the ring is inset by too.
  const center = RING_PAD + RING_SIZE / 2 - CHIP_TOUCH_SIZE / 2;

  return (
    <Animated.View
      entering={FadeIn.duration(260).delay(index * 40)}
      exiting={FadeOut.duration(160)}
      style={[
        styles.orbitChip,
        {
          left: center + orbitRadius * Math.cos(angle),
          top: center + orbitRadius * Math.sin(angle),
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${shelf.name}, ${pluralize(shelf.linkCount, 'link')}`}
        style={({ pressed }) => [styles.orbitPress, pressed && styles.orbitPressed]}
      >
        <IconBubble
          icon={iconForKey(shelf.icon)}
          accent={shelf.accent}
          size={size}
          iconSize={Math.round(size * 0.57)}
          strokeWidth={STROKE}
          style={shadows.chip}
        />
      </Pressable>
    </Animated.View>
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
    // The ring plus RING_PAD on every side. The orbit chips are positioned
    // absolutely against this box, so its size is part of their geometry —
    // change it and ShelfOrbitChip's `center` has to follow.
    width: RING_SIZE + RING_PAD * 2,
    height: RING_SIZE + RING_PAD * 2,
    alignSelf: 'center',
    // Margins net out to the handoff's spacing once the slack is removed.
    marginTop: spacing.lg - RING_PAD,
    marginBottom: spacing.xs - RING_PAD,
  },
  // Margin, not padding: Yoga's absolute children ignore a parent's padding.
  ring: { marginLeft: RING_PAD, marginTop: RING_PAD },
  ringInitial: {
    ...display(52, 800),
    color: colors.ink,
    lineHeight: 52,
  },
  ringMeta: { marginTop: spacing.sm },
  orbitChip: {
    position: 'absolute',
    width: CHIP_TOUCH_SIZE,
    height: CHIP_TOUCH_SIZE,
  },
  orbitPress: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitPressed: { opacity: 0.85, transform: [{ scale: 0.92 }] },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  assistant: { marginBottom: spacing['3xl'] },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  shelfList: { gap: spacing.md },
  shelfRow: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  shelfEmpty: { marginHorizontal: 2, marginTop: spacing.xs },
});
