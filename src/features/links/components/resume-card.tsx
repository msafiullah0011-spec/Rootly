import { StyleSheet, View } from 'react-native';

import type { ResumeLink } from '@/api/schemas';
import { Icons, STROKE_BOLD, iconForKey } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Text } from '@/components/ui/text';
import { joinMeta } from '@/lib/format';
import { alpha, colors, radii, spacing } from '@/theme';

/** Home's dark "Jump back in" card — the most recently opened link. */

export function ResumeCard({ link, onPress }: { link: ResumeLink; onPress: () => void }) {
  const meta = joinMeta(link.rootName, `${link.shelfName} shelf`);

  return (
    <Card
      tone="ink"
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`Jump back in: ${link.title}, ${meta}`}
    >
      <IconBubble
        icon={iconForKey(link.icon)}
        accent={link.accent}
        size={52}
        iconSize={24}
        radius={radii.input}
      />

      <View style={styles.body}>
        <Text variant="meta" color={alpha.onInkStrong} style={styles.eyebrow}>
          Jump back in
        </Text>
        <Text variant="cardTitle" tone="onInk" numberOfLines={1}>
          {link.title}
        </Text>
        <Text variant="meta" color={alpha.onInkMuted} style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <View style={styles.chevron}>
        <Icons.chevronRight size={18} color={colors.onInk} strokeWidth={STROKE_BOLD} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing['4xl'],
  },
  body: { flex: 1, minWidth: 0 },
  eyebrow: { marginBottom: 3 },
  meta: { marginTop: 2 },
  chevron: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: alpha.onInkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
