import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ApiError } from '@/api/errors';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, STROKE_BOLD } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip, StatusDot } from '@/components/ui/chip';
import { SelectField, TextField } from '@/components/ui/text-field';
import { Text } from '@/components/ui/text';
import { useRoots, useRootShelves } from '@/features/roots/hooks';
import { accents, alpha, colors, radii, spacing } from '@/theme';
import { useCreateLink, useLink, useUpdateLink } from '../hooks';

/**
 * Frame 12 — manual add / edit.
 *
 * One component serves both: with a `linkId` param it loads and updates; without
 * one it creates. Server-side `fieldErrors` are mapped straight onto the inputs.
 */

export function LinkFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linkId?: string; url?: string }>();
  const linkId = params.linkId;
  const isEdit = Boolean(linkId);

  const existing = useLink(linkId ?? '');
  const roots = useRoots();
  const createLink = useCreateLink();
  const updateLink = useUpdateLink(linkId ?? '');

  const [url, setUrl] = useState(params.url ?? '');
  const [title, setTitle] = useState('');
  const [rootId, setRootId] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shelves = useRootShelves(rootId);

  // Populate once the link loads. Guarded on `title` so a re-render doesn't
  // stomp edits in progress.
  useEffect(() => {
    const link = existing.data;
    if (!link || title) return;
    setUrl(link.url);
    setTitle(link.title);
    setRootId(link.rootId);
    setShelfId(link.shelfId);
    setLoginEmail(link.loginEmail ?? '');
    setNotes(link.notes ?? '');
    setTags(link.tags);
  }, [existing.data, title]);

  // Default to the first root so the pickers are never empty on a fresh add.
  useEffect(() => {
    if (!rootId && roots.data?.length) setRootId(roots.data[0].id);
  }, [roots.data, rootId]);

  useEffect(() => {
    if (!shelfId && shelves.data?.length) setShelfId(shelves.data[0].id);
  }, [shelves.data, shelfId]);

  const selectedRoot = roots.data?.find((root) => root.id === rootId);
  const selectedShelf = shelves.data?.find((shelf) => shelf.id === shelfId);

  const cycleRoot = () => {
    if (!roots.data?.length) return;
    const index = roots.data.findIndex((root) => root.id === rootId);
    const next = roots.data[(index + 1) % roots.data.length];
    setRootId(next.id);
    // The current shelf belongs to the old root, so clear it.
    setShelfId('');
  };

  const cycleShelf = () => {
    if (!shelves.data?.length) return;
    const index = shelves.data.findIndex((shelf) => shelf.id === shelfId);
    setShelfId(shelves.data[(index + 1) % shelves.data.length].id);
  };

  const addTag = () => {
    const trimmed = tagDraft.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) {
      setTagDraft('');
      return;
    }
    setTags((current) => [...current, trimmed]);
    setTagDraft('');
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!url.trim()) next.url = 'Paste the link address.';
    if (!title.trim()) next.title = 'Give this link a title.';
    if (!rootId) next.rootId = 'Pick a root.';
    if (!shelfId) next.shelfId = 'Pick a shelf.';
    if (loginEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      next.loginEmail = 'That email address looks wrong.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const payload = {
      url: url.trim(),
      title: title.trim(),
      rootId,
      shelfId,
      loginEmail: loginEmail.trim() || undefined,
      notes: notes.trim() || undefined,
      tags,
    };

    const onError = (error: unknown) => {
      const apiError = ApiError.from(error);
      if (apiError.fieldErrors) setErrors(apiError.fieldErrors);
    };

    if (isEdit) {
      updateLink.mutate(payload, { onSuccess: () => router.back(), onError });
    } else {
      createLink.mutate(payload, { onSuccess: () => router.back(), onError });
    }
  };

  const saving = createLink.isPending || updateLink.isPending;

  return (
    <Screen bottomInset={72}>
      <ScreenHeader title={isEdit ? 'Edit link' : 'Add link'} closeIcon />

      <TextField
        label="URL"
        icon={Icons.link}
        placeholder="ga.google.com/analytics"
        value={url}
        onChangeText={setUrl}
        error={errors.url}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        containerStyle={styles.field}
      />

      <TextField
        label="Title"
        placeholder="GA4 property"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        strong
        containerStyle={styles.field}
      />

      <View style={styles.splitRow}>
        <SelectField
          label="Root"
          value={selectedRoot?.name ?? 'Choose'}
          onPress={cycleRoot}
          error={errors.rootId}
          containerStyle={styles.splitField}
          trailing={<Icons.chevronDown size={16} color={colors.inkMuted} strokeWidth={STROKE_BOLD} />}
        />

        <SelectField
          label="Shelf"
          value={selectedShelf?.name ?? 'Choose'}
          onPress={cycleShelf}
          error={errors.shelfId}
          containerStyle={styles.splitField}
          leading={
            selectedShelf ? <StatusDot color={accents[selectedShelf.accent]} size={12} /> : null
          }
          trailing={<Icons.chevronDown size={16} color={colors.inkMuted} strokeWidth={STROKE_BOLD} />}
        />
      </View>

      <Text variant="meta" tone="muted" style={styles.label}>
        Tags
      </Text>
      <View style={styles.tagBox}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            tone="beige"
            small
            icon={Icons.close}
            onIconPress={() => setTags((current) => current.filter((item) => item !== tag))}
          />
        ))}

        <TextField
          placeholder="Add tag…"
          value={tagDraft}
          onChangeText={setTagDraft}
          onSubmitEditing={addTag}
          onBlur={addTag}
          returnKeyType="done"
          autoCapitalize="none"
          containerStyle={styles.tagInputContainer}
          fieldStyle={styles.tagInputField}
        />
      </View>

      <TextField
        label="Login email"
        icon={Icons.mail}
        placeholder="analytics@mystore.pk"
        value={loginEmail}
        onChangeText={setLoginEmail}
        error={errors.loginEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        containerStyle={styles.field}
      />

      <TextField
        label="Notes"
        placeholder="Anything the next person should know."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <Button
        label={isEdit ? 'Save changes' : 'Save link'}
        onPress={handleSave}
        size="block"
        loading={saving}
        style={styles.save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.xl },
  splitRow: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.xl },
  splitField: { flex: 1 },

  label: { marginHorizontal: 2, marginBottom: spacing.sm },
  tagBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.border,
    borderRadius: radii.input,
    paddingVertical: 11,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  // The tag input sits inside the box, so it drops its own chrome.
  tagInputContainer: { flexGrow: 1, minWidth: 100 },
  tagInputField: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },

  save: { marginTop: spacing['4xl'] },
});
