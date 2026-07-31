import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';

import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, SparkleFilled, STROKE } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/chip';
import { Divider, ListRow } from '@/components/ui/list-row';
import { IconButton } from '@/components/ui/icon-button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { formatLongDate, formatRelative } from '@/lib/date';
import { breadcrumb, displayUrl, initial, maskedCard } from '@/lib/format';
import { logger } from '@/lib/logger';
import { useUiStore } from '@/store/ui.store';
import { accents, alpha, colors, radii, spacing, status as statusColors } from '@/theme';
import { useLink } from '../hooks';

/**
 * Frame 4 — Link detail, "the vault".
 *
 * Preview thumbnail, title with health, breadcrumb, an open-in-browser CTA,
 * the identity vault, an AI summary and related links in the same root.
 */

const STATUS_LABELS = { live: 'Live', slow: 'Slow', dead: 'Dead' } as const;

export function LinkDetailScreen({ linkId }: { linkId: string }) {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const link = useLink(linkId);

  const openInBrowser = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      // A malformed or unsupported URL shouldn't take the screen down.
      logger.warn('Failed to open link in browser', error);
      showToast("Couldn't open that link.", 'error');
    }
  };

  return (
    <Screen>
      <ScreenHeader
        trailing={
          <IconButton
            icon={Icons.moreHorizontal}
            accessibilityLabel="Link options"
            iconSize={20}
            onPress={() => router.push({ pathname: '/link-form', params: { linkId } })}
          />
        }
      />

      <QueryBoundary query={link} loading={<SkeletonCard height={170} />}>
        {(data) => {
          const tone = statusColors[data.status];

          return (
            <>
              <LinearGradient
                colors={[accents.pink, accents.lavender]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.preview}
              >
                <View style={styles.favicon}>
                  <Text variant="pageTitle">{initial(data.title)}</Text>
                </View>

                <Text variant="micro" color={alpha.onPinkMuted} style={styles.previewLabel}>
                  page preview
                </Text>

                <View style={styles.urlChip}>
                  <Text variant="meta" tone="muted" numberOfLines={1}>
                    {displayUrl(data.url)}
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.titleRow}>
                <Text variant="pageTitle" style={styles.title} numberOfLines={1}>
                  {data.title}
                </Text>
                <View style={styles.status}>
                  <StatusDot color={tone.dot} size={8} />
                  <Text variant="meta" color={tone.text}>
                    {STATUS_LABELS[data.status]}
                    {data.checkedAt ? ` · checked ${formatRelative(data.checkedAt)}` : ''}
                  </Text>
                </View>
              </View>

              <Text variant="meta" tone="muted" style={styles.breadcrumb}>
                {breadcrumb(data.rootName, data.shelfName)}
              </Text>

              <Button
                label="Open in browser"
                icon={Icons.externalLink}
                iconTrailing
                onPress={() => void openInBrowser(data.url)}
                size="block"
                style={styles.cta}
              />

              <Card padding={spacing.xxl} style={styles.vault}>
                <View style={styles.vaultHeader}>
                  <Icons.lock size={17} color={colors.ink} strokeWidth={STROKE} />
                  <Text variant="cardTitle">Link vault</Text>
                </View>
                <Text variant="micro" tone="muted" style={styles.vaultSubtitle}>
                  Identity & ownership only — no passwords stored.
                </Text>

                {data.loginEmail ? (
                  <View style={styles.vaultRow}>
                    <Text variant="label" tone="muted">
                      Logged in with
                    </Text>
                    <Text variant="labelStrong">{data.loginEmail}</Text>
                  </View>
                ) : null}

                {data.loginEmail && data.billing ? <Divider style={styles.vaultDivider} /> : null}

                {data.billing ? (
                  <View style={styles.vaultRow}>
                    <Text variant="label" tone="muted">
                      Billing renews
                    </Text>
                    <Text variant="labelStrong">
                      {formatLongDate(data.billing.renewsAt)} · {maskedCard(data.billing.cardLast4)}
                    </Text>
                  </View>
                ) : null}
              </Card>

              {data.aiSummary ? (
                <Card tone="pink" elevated={false} style={styles.summary}>
                  <View style={styles.summaryHeader}>
                    <SparkleFilled size={16} />
                    <Text variant="labelStrong">AI summary</Text>
                  </View>
                  <Text variant="bodySm">{data.aiSummary}</Text>
                </Card>
              ) : null}

              {data.related.length > 0 ? (
                <>
                  <Text variant="rowTitle" style={styles.relatedHeader}>
                    Related in this root
                  </Text>

                  <View style={styles.relatedList}>
                    {data.related.map((related) => (
                      <ListRow
                        key={related.id}
                        title={related.title}
                        meta={related.reason}
                        radius={18}
                        padding={undefined}
                        style={styles.relatedRow}
                        leading={
                          <Avatar
                            initial={related.glyph}
                            accent={related.accent}
                            size={30}
                            radius={radii.chip}
                          />
                        }
                        chevron
                        onPress={() => router.push(`/links/${related.id}`)}
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

const styles = StyleSheet.create({
  preview: {
    height: 170,
    borderRadius: radii.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  favicon: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    width: 44,
    height: 44,
    borderRadius: radii.thumb,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: { position: 'absolute', top: spacing['3xl'], right: spacing['3xl'] },
  urlChip: {
    alignSelf: 'flex-start',
    backgroundColor: alpha.frosted,
    borderRadius: radii.thumb,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    maxWidth: '100%',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: { flexShrink: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  breadcrumb: { marginBottom: spacing.xl },
  cta: { marginBottom: spacing.xl },

  vault: { marginBottom: spacing.lg },
  vaultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxs },
  vaultSubtitle: { marginBottom: spacing.lg },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  vaultDivider: { marginVertical: spacing.base },

  summary: { padding: spacing.xxl, marginBottom: spacing.lg },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },

  relatedHeader: { marginHorizontal: 2, marginTop: spacing.xxs, marginBottom: spacing.md },
  relatedList: { gap: spacing.sm },
  relatedRow: { paddingVertical: spacing.base, paddingHorizontal: spacing.lg },
});
