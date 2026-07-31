import { StyleSheet, View } from 'react-native';

import type { Link } from '@/api/schemas';
import { Icons, STROKE } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { initial } from '@/lib/format';
import { colors, radii, spacing, status as statusColors } from '@/theme';

/**
 * A link inside a shelf: accent tile, title with a health badge, description
 * and the login-email pill.
 *
 * Dead links are dimmed — a neutral sand tile with a grey glyph and muted title
 * — which is why the tile colour ignores `accent` in that case.
 */

const STATUS_LABELS: Record<Link['status'], string> = {
  live: 'Live',
  slow: 'Slow',
  dead: 'Dead',
};

export function LinkCard({ link, onPress }: { link: Link; onPress: () => void }) {
  const isDead = link.status === 'dead';
  const tone = statusColors[link.status];

  return (
    <Card
      onPress={onPress}
      padding={spacing.xl}
      accessibilityLabel={`${link.title}, ${STATUS_LABELS[link.status]}`}
      accessibilityHint="Opens this link's details"
    >
      <View style={styles.row}>
        <Avatar
          initial={initial(link.title)}
          accent={link.accent}
          backgroundColor={isDead ? colors.sand : undefined}
          color={isDead ? colors.inkFaint : undefined}
          size={40}
          radius={radii.thumb}
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="rowTitle" tone={isDead ? 'muted' : 'ink'} numberOfLines={1} style={styles.title}>
              {link.title}
            </Text>

            <View style={styles.status}>
              <StatusDot color={tone.dot} size={8} />
              <Text variant="micro" color={tone.text}>
                {STATUS_LABELS[link.status]}
              </Text>
            </View>
          </View>

          {link.description ? (
            <Text variant="label" tone="muted" style={styles.description}>
              {link.description}
            </Text>
          ) : null}

          {link.loginEmail ? (
            <View style={styles.emailPill}>
              <Icons.mail size={13} color={colors.inkMuted} strokeWidth={STROKE} />
              <Text variant="meta" tone="muted">
                {link.loginEmail}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.base, alignItems: 'flex-start' },
  body: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  description: { marginTop: spacing.xxs, marginBottom: spacing.sm, lineHeight: 18 },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.chipBeige,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
});
