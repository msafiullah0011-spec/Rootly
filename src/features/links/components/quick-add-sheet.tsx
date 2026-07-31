import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Icons, SparkleFilled, STROKE } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chip, StatusDot } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useAutoRoot } from '@/features/assistant/hooks';
import { logger } from '@/lib/logger';
import { useUiStore } from '@/store/ui.store';
import { accents, alpha, colors, radii, spacing } from '@/theme';
import { useCreateLink } from '../hooks';

/**
 * Frame 6 — the add flow.
 *
 * On open it reads the clipboard, asks the assistant to infer where the link
 * belongs, and presents the result as editable pills. Saving files the link and
 * raises the "Filed into … by Rootly AI" toast with an Undo action.
 */

export function QuickAddSheet() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const autoRoot = useAutoRoot();
  const createLink = useCreateLink();

  const [url, setUrl] = useState<string | null>(null);

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

  const dismiss = () => router.back();

  const suggestion = autoRoot.data;

  const handleSave = () => {
    if (!suggestion) return;

    createLink.mutate(
      {
        url: suggestion.url,
        title: suggestion.title,
        rootId: suggestion.rootId,
        shelfId: suggestion.shelfId,
        tags: suggestion.tags,
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
            {autoRoot.isPending ? 'Reading the page' : 'Read the page'}
          </Text>
        </View>
      </View>

      <View style={styles.urlField}>
        <Icons.link size={16} color={colors.inkMuted} strokeWidth={STROKE} />
        <Text variant="label" tone="muted" numberOfLines={1} style={styles.urlText}>
          {url === null ? 'Reading clipboard…' : url || 'No link on your clipboard'}
        </Text>
      </View>

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
              ) : (
                <Chip label={suggestion?.title ?? '—'} bold />
              )}
            </SuggestionRow>

            <SuggestionRow label="Root">
              {autoRoot.isPending ? (
                <Skeleton width={110} height={32} radius={radii.pill} />
              ) : (
                <Chip
                  label={suggestion?.rootName ?? '—'}
                  tone="ink"
                  icon={Icons.chevronDown}
                  bold
                />
              )}
            </SuggestionRow>

            <SuggestionRow label="Shelf">
              {autoRoot.isPending ? (
                <Skeleton width={90} height={32} radius={radii.pill} />
              ) : (
                <Chip
                  label={suggestion?.shelfName ?? '—'}
                  tone="pink"
                  icon={Icons.chevronDown}
                  bold
                />
              )}
            </SuggestionRow>

            <SuggestionRow label="Tags" alignTop>
              <View style={styles.tags}>
                {(suggestion?.tags ?? []).map((tag) => (
                  <Chip key={tag} label={tag} small />
                ))}
                <Chip label="+ add" small color={colors.inkMuted} />
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
          disabled={!suggestion}
          style={styles.saveButton}
        />
      </View>
    </Sheet>
  );
}

function SuggestionRow({
  label,
  children,
  alignTop = false,
}: {
  label: string;
  children: React.ReactNode;
  alignTop?: boolean;
}) {
  return (
    <View style={[styles.row, alignTop && styles.rowTop]}>
      <Text variant="label" tone="muted" style={alignTop ? styles.rowLabelTop : undefined}>
        {label}
      </Text>
      {children}
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

  footer: { flexDirection: 'row', gap: spacing.md },
  manualButton: { paddingHorizontal: spacing['3xl'] },
  saveButton: { flex: 1 },
});
