import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icons, iconForKey, type IconComponent } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Divider, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { pluralize } from '@/lib/format';
import { colors, spacing } from '@/theme';
import { useDeleteShelf, useRootShelves } from '../hooks';

/**
 * A shelf's ⋮ menu — edit and delete, from either place a shelf is listed.
 *
 * `origin` says where it was opened from, because deleting has to leave the
 * screen behind the sheet in a sensible state: the root's shelf list can just
 * refresh, but the shelf's own screen is now showing something that no longer
 * exists, so the sheet pops back to the root on its way out.
 */

export function ShelfOptionsSheet({
  rootId,
  shelfId,
  origin = 'root',
}: {
  rootId: string;
  shelfId: string;
  origin?: 'root' | 'shelf';
}) {
  const router = useRouter();
  const shelves = useRootShelves(rootId);
  const deleteShelf = useDeleteShelf(rootId);

  const [confirming, setConfirming] = useState(false);

  const shelf = shelves.data?.find((item) => item.id === shelfId);
  const shelfName = shelf?.name ?? 'this shelf';
  const linkCount = shelf?.linkCount ?? 0;

  const dismiss = () => router.back();

  const handleDelete = () => {
    deleteShelf.mutate(shelfId, {
      onSuccess: () => {
        if (origin === 'shelf') {
          router.dismissTo({ pathname: '/roots/[rootId]', params: { rootId } });
        } else {
          dismiss();
        }
      },
    });
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <IconBubble
          icon={iconForKey(shelf?.icon)}
          accent={shelf?.accent ?? 'pink'}
          size={40}
          iconSize={19}
        />
        <View style={styles.headerText}>
          <Text variant="cardTitle" numberOfLines={1}>
            {shelfName}
          </Text>
          <Text variant="meta" tone="muted">
            {pluralize(linkCount, 'link')}
          </Text>
        </View>
      </View>

      {confirming ? (
        <>
          <Text variant="cardTitle" style={styles.confirmTitle}>
            Delete {shelfName}?
          </Text>
          <Text variant="bodySm" tone="muted" style={styles.confirmBody}>
            {linkCount > 0
              ? `The ${pluralize(linkCount, 'link')} on it go too. This can’t be undone.`
              : 'This can’t be undone.'}
          </Text>

          <View style={styles.footer}>
            <Button
              label="Keep it"
              variant="secondary"
              size="block"
              fullWidth={false}
              onPress={() => setConfirming(false)}
              style={styles.secondaryButton}
            />
            <Button
              label="Delete"
              size="block"
              onPress={handleDelete}
              loading={deleteShelf.isPending}
              style={[styles.primaryButton, styles.deleteButton]}
            />
          </View>
        </>
      ) : (
        <View style={styles.menu}>
          <MenuRow
            icon={Icons.pencil}
            title="Edit shelf"
            meta="Name, glyph and colour"
            // Swaps one sheet for the other; back-then-push would race.
            onPress={() =>
              router.replace({ pathname: '/shelf-form', params: { rootId, shelfId } })
            }
          />
          <Divider />
          <MenuRow
            icon={Icons.close}
            title="Delete shelf"
            meta={linkCount > 0 ? `Removes its ${pluralize(linkCount, 'link')}` : 'Removes this shelf'}
            danger
            onPress={() => setConfirming(true)}
          />
        </View>
      )}
    </Sheet>
  );
}

function MenuRow({
  icon,
  title,
  meta,
  onPress,
  danger = false,
}: {
  icon: IconComponent;
  title: string;
  meta: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <ListRow
      title={title}
      meta={meta}
      onPress={onPress}
      card={false}
      padding={undefined}
      style={styles.menuRow}
      leading={
        <IconBubble
          icon={icon}
          backgroundColor={danger ? colors.danger : colors.sand}
          color={danger ? colors.onInk : colors.ink}
          size={36}
          iconSize={17}
        />
      }
      chevron
    />
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

  menu: { marginHorizontal: -spacing.xxs },
  menuRow: { paddingVertical: spacing.base, paddingHorizontal: spacing.xxs },

  confirmTitle: { marginBottom: spacing.xs },
  confirmBody: { marginBottom: spacing['3xl'] },

  footer: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { paddingHorizontal: spacing['3xl'] },
  primaryButton: { flex: 1 },
  deleteButton: { backgroundColor: colors.danger },
});
