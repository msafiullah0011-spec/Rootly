import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Icons, SparkleFilled, STROKE } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip, StatusDot } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useAutoRoot } from '@/features/assistant/hooks';
import { useRoots, useRootShelves } from '@/features/roots/hooks';
import { logger } from '@/lib/logger';
import { useUiStore } from '@/store/ui.store';
import { accents, alpha, colors, radii, spacing, text } from '@/theme';
import { useCreateLink } from '../hooks';

/**
 * Frame 6 — the add flow.
 *
 * On open it reads the clipboard, asks the assistant to infer where the link
 * belongs, and presents the result as editable pills. Saving files the link and
 * raises the "Filed into … by Rootly AI" toast with an Undo action.
 *
 * The suggestion only seeds a local draft — every pill is a control. Title opens
 * an inline input, Root and Shelf expand a picker underneath the row, and tags
 * can be removed or added. The AI is a starting point, not a verdict.
 */

/** The user's edits on top of what the assistant suggested. */
interface Draft {
  title: string;
  rootId: string;
  shelfId: string;
  tags: string[];
}

/** Which pill has its editor open — at most one at a time. */
type Editing = 'url' | 'title' | 'root' | 'shelf' | 'tag' | null;

const EMPTY_DRAFT: Draft = { title: '', rootId: '', shelfId: '', tags: [] };

export function QuickAddSheet() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const autoRoot = useAutoRoot();
  const createLink = useCreateLink();
  const roots = useRoots();

  /** `null` while the clipboard is still being read; `''` once we know it's empty. */
  const [url, setUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<Editing>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');

  const shelves = useRootShelves(draft.rootId);

  // Read whatever the user just copied — that's almost always what they're
  // trying to save.
  useEffect(() => {
    let cancelled = false;

    async function readClipboard() {
      try {
        const content = await Clipboard.getStringAsync();
        if (cancelled) return;
        const trimmed = content.trim();
        const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : '';
        setUrl(candidate);
        if (candidate) autoRoot.mutate(candidate);
      } catch (error) {
        // Clipboard access can be denied; the sheet still works manually.
        logger.warn('Could not read the clipboard', error);
        if (!cancelled) setUrl('');
      }
    }

    void readClipboard();
    return () => {
      cancelled = true;
    };
    // Intentionally runs once — re-reading the clipboard mid-sheet would be
    // surprising.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestion = autoRoot.data;

  // Seed the draft from the suggestion. A retry produces a fresh result object,
  // which reseeds — that's the point of retrying.
  useEffect(() => {
    if (!suggestion) return;
    setDraft({
      title: suggestion.title,
      rootId: suggestion.rootId,
      shelfId: suggestion.shelfId,
      tags: suggestion.tags,
    });
    setEditing(null);
  }, [suggestion]);

  // The sheet is usable whether or not the assistant had anything to say: an
  // empty clipboard, a denied clipboard or a failed inference all still leave
  // the user with working Root and Shelf pickers, seeded with the first root.
  useEffect(() => {
    if (draft.rootId || !roots.data?.length) return;
    setDraft((current) => ({ ...current, rootId: roots.data[0].id }));
  }, [roots.data, draft.rootId]);

  // After a root change the old shelf no longer belongs, so land on the first
  // shelf of the new root rather than leaving the pill empty.
  useEffect(() => {
    if (draft.shelfId || !shelves.data?.length) return;
    setDraft((current) => ({ ...current, shelfId: shelves.data[0].id }));
  }, [shelves.data, draft.shelfId]);

  const dismiss = () => router.back();

  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));

  const selectedRoot = roots.data?.find((root) => root.id === draft.rootId);
  const selectedShelf = shelves.data?.find((shelf) => shelf.id === draft.shelfId);

  const toggle = (pill: Exclude<Editing, null>) =>
    setEditing((current) => (current === pill ? null : pill));

  const openTitleEditor = () => {
    setTitleDraft(draft.title);
    setEditing('title');
  };

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed) patch({ title: trimmed });
    setEditing(null);
  };

  const openUrlEditor = () => {
    setUrlDraft(url ?? '');
    setEditing('url');
  };

  /**
   * A hand-typed URL is a new subject, so it re-runs the inference — the whole
   * point of the sheet is that Rootly files it for you.
   */
  const commitUrl = () => {
    const trimmed = urlDraft.trim();
    setEditing(null);
    if (trimmed === (url ?? '')) return;

    setUrl(trimmed);
    if (/^https?:\/\//i.test(trimmed)) autoRoot.mutate(trimmed);
  };

  const commitTag = () => {
    const trimmed = tagDraft.trim().toLowerCase();
    if (trimmed && !draft.tags.includes(trimmed)) {
      patch({ tags: [...draft.tags, trimmed] });
    }
    setTagDraft('');
    setEditing(null);
  };

  const removeTag = (tag: string) => patch({ tags: draft.tags.filter((item) => item !== tag) });

  const ready = Boolean(url?.trim() && draft.title.trim() && draft.rootId && draft.shelfId);

  const handleSave = () => {
    if (!ready) return;

    createLink.mutate(
      {
        url: (url ?? '').trim(),
        title: draft.title.trim(),
        rootId: draft.rootId,
        shelfId: draft.shelfId,
        tags: draft.tags,
      },
      {
        onSuccess: (link) => {
          dismiss();
          showToast(`Filed into ${link.rootName} → ${link.shelfName} by Rootly AI`, 'success', {
            action: {
              label: 'Undo',
              onPress: () => showToast('Undo is coming soon.', 'info'),
            },
          });
        },
      },
    );
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <SparkleFilled size={18} color={colors.brand} />
        <Text variant="navTitle">Auto-rooting</Text>

        <View style={styles.readState}>
          <StatusDot color={accents.green} size={7} />
          <Text variant="meta" color={accents.green}>
            {autoRoot.isPending
              ? 'Reading the page'
              : suggestion
                ? 'Read the page'
                : 'Waiting for a link'}
          </Text>
        </View>
      </View>

      {/*
        The clipboard is the usual source, but it can be empty or unreadable —
        tapping the row lets the user type the address instead of being stuck
        with a sheet that has nothing to file.
      */}
      <Pressable
        onPress={editing === 'url' ? undefined : openUrlEditor}
        accessibilityRole="button"
        accessibilityLabel={url ? `Link address ${url}. Tap to edit.` : 'Add a link address'}
        style={styles.urlField}
      >
        <Icons.link size={16} color={colors.inkMuted} strokeWidth={STROKE} />

        {editing === 'url' ? (
          <TextInput
            value={urlDraft}
            onChangeText={setUrlDraft}
            onSubmitEditing={commitUrl}
            onBlur={commitUrl}
            placeholder="https://…"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
            style={styles.urlInput}
          />
        ) : (
          <Text variant="label" tone="muted" numberOfLines={1} style={styles.urlText}>
            {url === null ? 'Reading clipboard…' : url || 'Tap to paste or type a link'}
          </Text>
        )}
      </Pressable>

      {autoRoot.isError ? (
        <InlineError
          error={autoRoot.error}
          onRetry={() => url && autoRoot.mutate(url)}
          style={styles.error}
        />
      ) : (
        <>
          <Text variant="meta" tone="muted" style={styles.suggestLabel}>
            Rootly suggests — tap any pill to edit
          </Text>

          <View style={styles.rows}>
            <SuggestionRow label="Title">
              {autoRoot.isPending ? (
                <Skeleton width={110} height={32} radius={radii.pill} />
              ) : editing === 'title' ? (
                <TextField
                  value={titleDraft}
                  onChangeText={setTitleDraft}
                  onSubmitEditing={commitTitle}
                  onBlur={commitTitle}
                  placeholder="Give this link a title"
                  returnKeyType="done"
                  autoFocus
                  strong
                  radius={radii.pill}
                  containerStyle={styles.inlineInput}
                  fieldStyle={styles.inlineInputField}
                />
              ) : (
                <Chip
                  label={draft.title || 'Add a title'}
                  onPress={openTitleEditor}
                  accessibilityLabel={`Title: ${draft.title || 'not set'}. Tap to edit.`}
                  bold
                />
              )}
            </SuggestionRow>

            <SuggestionRow
              label="Root"
              expanded={
                editing === 'root' ? (
                  <PickerRow
                    loading={roots.isPending}
                    emptyLabel="No roots yet — file this one manually."
                    options={(roots.data ?? []).map((root) => ({
                      id: root.id,
                      label: root.name,
                    }))}
                    selectedId={draft.rootId}
                    selectedTone="ink"
                    onSelect={(rootId) => {
                      // The current shelf belongs to the old root, so clear it
                      // and let the effect above pick the new root's first.
                      patch({ rootId, shelfId: '' });
                      setEditing(null);
                    }}
                  />
                ) : null
              }
            >
              {autoRoot.isPending ? (
                <Skeleton width={110} height={32} radius={radii.pill} />
              ) : (
                <Chip
                  label={selectedRoot?.name || suggestion?.rootName || 'Choose'}
                  onPress={() => toggle('root')}
                  accessibilityLabel={`Root: ${selectedRoot?.name ?? 'not set'}. Tap to change.`}
                  tone="ink"
                  icon={Icons.chevronDown}
                  bold
                />
              )}
            </SuggestionRow>

            <SuggestionRow
              label="Shelf"
              expanded={
                editing === 'shelf' ? (
                  <PickerRow
                    loading={shelves.isPending}
                    emptyLabel="This root has no shelves yet."
                    options={(shelves.data ?? []).map((shelf) => ({
                      id: shelf.id,
                      label: shelf.name,
                    }))}
                    selectedId={draft.shelfId}
                    selectedTone="pink"
                    onSelect={(shelfId) => {
                      patch({ shelfId });
                      setEditing(null);
                    }}
                  />
                ) : null
              }
            >
              {autoRoot.isPending ? (
                <Skeleton width={90} height={32} radius={radii.pill} />
              ) : (
                <Chip
                  label={selectedShelf?.name || suggestion?.shelfName || 'Choose'}
                  onPress={() => toggle('shelf')}
                  accessibilityLabel={`Shelf: ${selectedShelf?.name ?? 'not set'}. Tap to change.`}
                  tone="pink"
                  icon={Icons.chevronDown}
                  bold
                />
              )}
            </SuggestionRow>

            <SuggestionRow
              label="Tags"
              alignTop
              expanded={
                editing === 'tag' ? (
                  <TextField
                    value={tagDraft}
                    onChangeText={setTagDraft}
                    onSubmitEditing={commitTag}
                    onBlur={commitTag}
                    placeholder="Add a tag…"
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    radius={radii.pill}
                    containerStyle={styles.tagInput}
                    fieldStyle={styles.inlineInputField}
                  />
                ) : null
              }
            >
              <View style={styles.tags}>
                {draft.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    small
                    icon={Icons.close}
                    onIconPress={() => removeTag(tag)}
                  />
                ))}
                <Chip
                  label="+ add"
                  small
                  color={colors.inkMuted}
                  onPress={() => toggle('tag')}
                  accessibilityLabel="Add a tag"
                />
              </View>
            </SuggestionRow>
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Button
          label="File manually"
          variant="secondary"
          size="block"
          fullWidth={false}
          onPress={() => {
            dismiss();
            router.push({ pathname: '/link-form', params: url ? { url } : {} });
          }}
          style={styles.manualButton}
        />
        <Button
          label="Save to Root"
          size="block"
          onPress={handleSave}
          loading={createLink.isPending}
          disabled={!ready}
          style={styles.saveButton}
        />
      </View>
    </Sheet>
  );
}

function SuggestionRow({
  label,
  children,
  expanded,
  alignTop = false,
}: {
  label: string;
  children: React.ReactNode;
  /** Editor revealed under the row — the Root/Shelf pickers, the tag input. */
  expanded?: React.ReactNode;
  alignTop?: boolean;
}) {
  return (
    <View>
      <View style={[styles.row, alignTop && styles.rowTop]}>
        <Text variant="label" tone="muted" style={alignTop ? styles.rowLabelTop : undefined}>
          {label}
        </Text>
        {children}
      </View>
      {expanded ? <View style={styles.expanded}>{expanded}</View> : null}
    </View>
  );
}

/** The options behind a dropdown pill, as a wrapped row of chips. */
function PickerRow({
  options,
  selectedId,
  selectedTone,
  onSelect,
  loading,
  emptyLabel,
}: {
  options: { id: string; label: string }[];
  selectedId?: string;
  selectedTone: 'ink' | 'pink';
  onSelect: (id: string) => void;
  loading: boolean;
  emptyLabel: string;
}) {
  if (loading) {
    return (
      <View style={styles.picker}>
        <Skeleton width={92} height={28} radius={radii.pill} />
        <Skeleton width={72} height={28} radius={radii.pill} />
      </View>
    );
  }

  if (!options.length) {
    return (
      <Text variant="meta" tone="muted" style={styles.pickerEmpty}>
        {emptyLabel}
      </Text>
    );
  }

  return (
    <View style={styles.picker}>
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Chip
            key={option.id}
            label={option.label}
            small
            tone={selected ? selectedTone : 'surface'}
            icon={selected ? Icons.check : undefined}
            onPress={() => onSelect(option.id)}
            accessibilityLabel={`${option.label}${selected ? ', selected' : ''}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  readState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },

  urlField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.hairline,
    borderRadius: radii.input,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  urlText: { flex: 1 },
  // Matches the muted label it replaces, so editing doesn't reflow the row.
  urlInput: {
    flex: 1,
    ...text.label(),
    color: colors.ink,
    paddingVertical: 0,
    minWidth: 0,
  },

  error: { marginBottom: spacing['4xl'] },
  suggestLabel: { marginBottom: spacing.md },
  rows: { gap: spacing.base, marginBottom: spacing['4xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  rowTop: { alignItems: 'flex-start' },
  rowLabelTop: { paddingTop: spacing.xs },
  tags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },

  // Editors sit under their row so the pill layout above never shifts.
  expanded: { marginTop: spacing.sm },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  pickerEmpty: { textAlign: 'right' },

  // Pill-shaped inputs, so editing keeps the shape of the thing being edited.
  inlineInput: { flex: 1, maxWidth: 220 },
  tagInput: { alignSelf: 'flex-end', minWidth: 180 },
  inlineInputField: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  footer: { flexDirection: 'row', gap: spacing.md },
  manualButton: { paddingHorizontal: spacing['3xl'] },
  saveButton: { flex: 1 },
});
