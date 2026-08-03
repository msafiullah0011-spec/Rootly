import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { iconKeySchema, type AccentNameValue, type IconKey } from '@/api/schemas';
import { iconForKey } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Sheet } from '@/components/ui/sheet';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { accentOrder, accents, colors, radii, spacing } from '@/theme';
import { useCreateShelf, useRoot, useRootShelves, useUpdateShelf } from '../hooks';

/**
 * New shelf — the `+` beside "Add link" on frame 2 — and its edit twin, reached
 * from a shelf's ⋮ menu. Passing a `shelfId` switches the sheet into editing.
 *
 * A shelf is only a name, a glyph and a colour, so this is a sheet rather than a
 * full form screen. The glyph list comes straight off `iconKeySchema`, so the
 * picker can never offer an icon the API would reject.
 */

const ICON_KEYS = iconKeySchema.options;

export function ShelfFormSheet({ rootId, shelfId }: { rootId: string; shelfId?: string }) {
  const router = useRouter();
  const root = useRoot(rootId);
  const shelves = useRootShelves(rootId);
  const createShelf = useCreateShelf(rootId);
  const updateShelf = useUpdateShelf(shelfId ?? '', rootId);

  // Root detail has already loaded this list, so an edit opens pre-filled
  // rather than flashing an empty field while a detail request lands.
  const existing = shelfId ? shelves.data?.find((shelf) => shelf.id === shelfId) : undefined;
  const isEditing = Boolean(shelfId);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconKey>('folder');
  const [accent, setAccent] = useState<AccentNameValue | null>(null);
  const [nameError, setNameError] = useState<string>();

  // Seed once. A background refetch mustn't overwrite what's being typed.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !existing) return;
    seeded.current = true;
    setName(existing.name);
    setIcon(existing.icon);
    setAccent(existing.accent);
  }, [existing]);

  // Until the user picks, continue the ring's colour rotation — a new shelf
  // then lands on the next arc colour instead of duplicating the last one.
  const resolvedAccent = accent ?? accentOrder[(shelves.data?.length ?? 0) % accentOrder.length];

  const mutation = isEditing ? updateShelf : createShelf;
  const dismiss = () => router.back();

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Give this shelf a name.');
      return;
    }

    setNameError(undefined);
    mutation.mutate(
      { name: trimmed, icon, accent: resolvedAccent },
      { onSuccess: dismiss },
    );
  };

  return (
    <Sheet onDismiss={dismiss}>
      <Text variant="navTitle">{isEditing ? 'Edit shelf' : 'New shelf'}</Text>
      <Text variant="meta" tone="muted" style={styles.subtitle}>
        {root.data ? `Inside ${root.data.name}` : 'Group links inside this root'}
      </Text>

      <TextField
        label="Name"
        placeholder="Ads"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (nameError) setNameError(undefined);
        }}
        onSubmitEditing={handleSave}
        error={nameError}
        returnKeyType="done"
        autoFocus
        strong
        containerStyle={styles.field}
      />

      <Text variant="meta" tone="muted" style={styles.label}>
        Icon
      </Text>
      <View style={styles.iconGrid}>
        {ICON_KEYS.map((key) => (
          <SelectableBubble
            key={key}
            label={key}
            selected={icon === key}
            onPress={() => setIcon(key)}
          >
            <IconBubble icon={iconForKey(key)} accent={resolvedAccent} size={40} iconSize={19} />
          </SelectableBubble>
        ))}
      </View>

      <Text variant="meta" tone="muted" style={styles.label}>
        Colour
      </Text>
      <View style={styles.accentRow}>
        {accentOrder.map((accentName) => (
          <SelectableBubble
            key={accentName}
            label={accentName}
            selected={resolvedAccent === accentName}
            onPress={() => setAccent(accentName)}
          >
            <View style={[styles.swatch, { backgroundColor: accents[accentName] }]} />
          </SelectableBubble>
        ))}
      </View>

      {mutation.isError ? (
        <InlineError error={mutation.error} style={styles.error} />
      ) : null}

      <View style={styles.footer}>
        <Button
          label="Cancel"
          variant="secondary"
          size="block"
          fullWidth={false}
          onPress={dismiss}
          style={styles.cancelButton}
        />
        <Button
          label={isEditing ? 'Save shelf' : 'Add shelf'}
          size="block"
          onPress={handleSave}
          loading={mutation.isPending}
          style={styles.saveButton}
        />
      </View>
    </Sheet>
  );
}

/** Picker cell — a ring around the swatch marks the current choice. */
function SelectableBubble({
  label,
  selected,
  onPress,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.cell,
        selected && styles.cellSelected,
        pressed && styles.cellPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing['3xl'] },
  field: { marginBottom: spacing.xl },
  label: { marginBottom: spacing.md, marginHorizontal: 2 },

  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  accentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  swatch: { width: 40, height: 40, borderRadius: radii.pill },

  cell: {
    padding: 3,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellSelected: { borderColor: colors.ink },
  cellPressed: { opacity: 0.7 },

  error: { marginBottom: spacing.xl },

  footer: { flexDirection: 'row', gap: spacing.md },
  cancelButton: { paddingHorizontal: spacing['3xl'] },
  saveButton: { flex: 1 },
});
