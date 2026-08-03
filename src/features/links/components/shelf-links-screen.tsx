import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, STROKE, iconForKey } from '@/components/icons';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { SwipeableRow, defaultSwipeActions } from '@/components/ui/swipeable-row';
import { Text } from '@/components/ui/text';
import { joinMeta, pluralize } from '@/lib/format';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';
import { useArchiveLink, useShelf, useShelfLinks } from '../hooks';
import { LinkCard } from './link-card';

/**
 * Frame 3 — a shelf's links.
 *
 * Each card is swipeable: dragging left reveals archive and move over a red
 * underlay. Archiving is optimistic (see `useArchiveLink`), so the row leaves
 * immediately and returns if the server rejects it.
 */

export function ShelfLinksScreen({ shelfId }: { shelfId: string }) {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);

  const shelf = useShelf(shelfId);
  const links = useShelfLinks(shelfId);
  const archive = useArchiveLink(shelfId);

  // An empty shelf gets the whole screen for its one instruction, rather than
  // an empty state pinned under the header with dead space below it.
  const isEmpty = links.data?.length === 0;
  const rootId = shelf.data?.rootId;

  return (
    <Screen contentStyle={isEmpty ? styles.emptyContent : undefined}>
      <ScreenHeader
        align="left"
        title={shelf.data?.name}
        trailing={
          rootId ? (
            <IconButton
              icon={Icons.moreVertical}
              accessibilityLabel="Shelf options"
              iconSize={20}
              onPress={() =>
                router.push({
                  pathname: '/shelf-options',
                  params: { rootId, shelfId, origin: 'shelf' },
                })
              }
            />
          ) : null
        }
        leading={
          shelf.data ? (
            <IconBubble
              icon={iconForKey(shelf.data.icon)}
              accent={shelf.data.accent}
              size={36}
              iconSize={18}
            />
          ) : null
        }
        subtitle={
          shelf.data ? (
            <Text variant="meta" tone="muted">
              {joinMeta(
                links.data?.[0]?.rootName ?? '',
                pluralize(links.data?.length ?? shelf.data.linkCount, 'link'),
              )}
            </Text>
          ) : null
        }
      />

      {/* Nothing to swipe on an empty shelf, so the hint would be noise. */}
      {isEmpty ? null : (
        <View style={styles.hint}>
          <Icons.filter size={14} color={colors.inkMuted} strokeWidth={STROKE} />
          <Text variant="meta" tone="muted">
            Swipe a card to archive or move
          </Text>
        </View>
      )}

      <QueryBoundary
        query={links}
        isEmpty={(data) => data.length === 0}
        empty={{
          title: 'Nothing on this shelf yet',
          description: 'Add a link and Rootly will file it here.',
          icon: Icons.link,
          actionLabel: 'Add link',
          onAction: () => router.push('/quick-add'),
          fill: true,
        }}
      >
        {(data) => (
          <View style={styles.list}>
            {data.map((link) => (
              <SwipeableRow
                key={link.id}
                actions={defaultSwipeActions({
                  onArchive: () => archive.mutate(link.id),
                  onMove: () => showToast('Moving links is coming soon.', 'info'),
                })}
              >
                <LinkCard link={link} onPress={() => router.push(`/links/${link.id}`)} />
              </SwipeableRow>
            ))}
          </View>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Lets the empty state's `flex: 1` have something to fill.
  emptyContent: { flexGrow: 1 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.xxs,
    marginBottom: spacing.base,
  },
  list: { gap: spacing.base },
});
