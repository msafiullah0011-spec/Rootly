import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icons, iconForKey, type IconComponent } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Divider, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { joinMeta, pluralize } from '@/lib/format';
import { colors, spacing } from '@/theme';
import { useDeleteRoot, useRoot, useRootActions, useRootShelves, useUpdateRoot } from '../hooks';

/**
 * The root's overflow menu — everything the header's ⋮ offers.
 *
 * Rename and delete both stay inside the sheet rather than pushing another
 * screen: they're two-field decisions, and bouncing out to a form for a rename
 * would cost more taps than the rename itself.
 */

type Mode = 'menu' | 'rename' | 'delete';

export function RootOptionsSheet({ rootId }: { rootId: string }) {
  const router = useRouter();
  const root = useRoot(rootId);
  const shelves = useRootShelves(rootId);
  const actions = useRootActions(rootId);
  const updateRoot = useUpdateRoot(rootId);
  const deleteRoot = useDeleteRoot();

  const [mode, setMode] = useState<Mode>('menu');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();

  const rootName = root.data?.name ?? 'this root';
  const dismiss = () => router.back();

  /**
   * Share and export both open the OS share sheet, which stacks above this one,
   * so the menu stays put until the action finishes and can show its own
   * pending state while it works.
   */
  const runAndDismiss = async (action: () => Promise<void>) => {
    await action();
    dismiss();
  };

  const startRename = () => {
    setName(root.data?.name ?? '');
    setNameError(undefined);
    setMode('rename');
  };

  const handleRename = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('A root needs a name.');
      return;
    }
    if (trimmed === root.data?.name) {
      dismiss();
      return;
    }
    updateRoot.mutate({ name: trimmed }, { onSuccess: dismiss });
  };

  const handleDelete = () => {
    deleteRoot.mutate(rootId, {
      onSuccess: () => {
        // The detail screen behind this sheet is now showing a root that no
        // longer exists, so pop it too rather than just closing the sheet.
        if (router.canDismiss()) router.dismissAll();
        else router.replace('/(tabs)');
      },
    });
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <IconBubble
          icon={iconForKey(root.data?.icon)}
          accent={root.data?.accent ?? 'pink'}
          size={40}
          iconSize={19}
        />
        <View style={styles.headerText}>
          <Text variant="cardTitle" numberOfLines={1}>
            {rootName}
          </Text>
          <Text variant="meta" tone="muted">
            {joinMeta(
              pluralize(root.data?.linkCount ?? 0, 'link'),
              pluralize(shelves.data?.length ?? 0, 'shelf', 'shelves'),
            )}
          </Text>
        </View>
      </View>

      {mode === 'menu' ? (
        <View style={styles.menu}>
          <MenuRow
            icon={Icons.plus}
            title="Add a shelf"
            meta="Group links inside this root"
            // Swaps one sheet for the other; back-then-push would race.
            onPress={() => router.replace({ pathname: '/shelf-form', params: { rootId } })}
          />
          <Divider />
          <MenuRow
            icon={Icons.pencil}
            title="Rename root"
            meta="Changes it everywhere"
            onPress={startRename}
          />
          <Divider />
          <MenuRow
            icon={Icons.share}
            title="Share root"
            meta="Send a link to this root"
            onPress={() => void runAndDismiss(() => actions.shareRoot(rootName))}
          />
          <Divider />
          <MenuRow
            icon={Icons.upload}
            title={actions.isExporting ? 'Preparing export…' : 'Export links'}
            meta="Every shelf and link as text"
            onPress={() => {
              if (actions.isExporting) return;
              void runAndDismiss(() => actions.exportRootLinks(rootName));
            }}
          />
          <Divider />
          <MenuRow
            icon={Icons.close}
            title="Delete root"
            meta="Removes its shelves and links"
            danger
            onPress={() => setMode('delete')}
          />
        </View>
      ) : null}

      {mode === 'rename' ? (
        <>
          <TextField
            label="Name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (nameError) setNameError(undefined);
            }}
            onSubmitEditing={handleRename}
            error={nameError}
            returnKeyType="done"
            autoFocus
            strong
            containerStyle={styles.field}
          />

          <View style={styles.footer}>
            <Button
              label="Cancel"
              variant="secondary"
              size="block"
              fullWidth={false}
              onPress={() => setMode('menu')}
              style={styles.secondaryButton}
            />
            <Button
              label="Save"
              size="block"
              onPress={handleRename}
              loading={updateRoot.isPending}
              style={styles.primaryButton}
            />
          </View>
        </>
      ) : null}

      {mode === 'delete' ? (
        <>
          <Text variant="cardTitle" style={styles.confirmTitle}>
            Delete {rootName}?
          </Text>
          <Text variant="bodySm" tone="muted" style={styles.confirmBody}>
            Its shelves and links go with it. This can&apos;t be undone.
          </Text>

          <View style={styles.footer}>
            <Button
              label="Keep it"
              variant="secondary"
              size="block"
              fullWidth={false}
              onPress={() => setMode('menu')}
              style={styles.secondaryButton}
            />
            <Button
              label="Delete"
              size="block"
              onPress={handleDelete}
              loading={deleteRoot.isPending}
              style={[styles.primaryButton, styles.deleteButton]}
            />
          </View>
        </>
      ) : null}
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

  field: { marginBottom: spacing['3xl'] },

  confirmTitle: { marginBottom: spacing.xs },
  confirmBody: { marginBottom: spacing['3xl'] },

  footer: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { paddingHorizontal: spacing['3xl'] },
  primaryButton: { flex: 1 },
  deleteButton: { backgroundColor: colors.danger },
});
