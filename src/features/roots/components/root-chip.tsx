import { StyleSheet, View } from 'react-native';

import type { Root } from '@/api/schemas';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { initial, pluralize } from '@/lib/format';
import { spacing } from '@/theme';

/**
 * A root in Home's horizontal scroller: a fixed-width card with a 48px avatar,
 * the root name and its link count.
 */

const CHIP_WIDTH = 118;

export function RootChip({ root, onPress }: { root: Root; onPress: () => void }) {
  return (
    <Card
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`${root.name}, ${pluralize(root.linkCount, 'link')}`}
      accessibilityHint="Opens this root"
    >
      <View style={styles.content}>
        <Avatar initial={initial(root.name)} accent={root.accent} size={48} />

        <View style={styles.text}>
          <Text variant="labelStrong" align="center" numberOfLines={1}>
            {root.name}
          </Text>
          <Text variant="micro" tone="muted" align="center">
            {pluralize(root.linkCount, 'link')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** Exported so the scroller can size its snap interval. */
export const ROOT_CHIP_WIDTH = CHIP_WIDTH;

const styles = StyleSheet.create({
  card: {
    width: CHIP_WIDTH,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  content: { alignItems: 'center', gap: 9 },
  text: { alignItems: 'center', gap: 2 },
});
