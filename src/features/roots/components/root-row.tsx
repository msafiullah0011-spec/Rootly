import { StyleSheet, View } from 'react-native';

import type { Root } from '@/api/schemas';
import { Icons, STROKE_BOLD } from '@/components/icons';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { joinMeta, pluralize } from '@/lib/format';
import { colors, spacing } from '@/theme';

/**
 * A root in the Home list: overlapping member avatars, the name, a meta line
 * and a chevron.
 *
 * When a root has dead links the meta line switches to a red warning, which is
 * why this isn't just a `ListRow`.
 */

export function RootRow({ root, onPress }: { root: Root; onPress: () => void }) {
  const hasDeadLinks = root.deadLinkCount > 0;
  const meta = hasDeadLinks
    ? `${pluralize(root.deadLinkCount, 'link')} died recently`
    : joinMeta(pluralize(root.linkCount, 'link'), pluralize(root.shelfCount, 'shelf', 'shelves'));

  return (
    <Card
      onPress={onPress}
      padding={spacing.xxl}
      accessibilityLabel={`${root.name}, ${meta}`}
      accessibilityHint="Opens this root"
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <AvatarStack members={root.members} total={root.memberCount} />

          <View style={styles.text}>
            <Text variant="cardTitle" numberOfLines={1}>
              {root.name}
            </Text>
            <Text
              variant="meta"
              tone={hasDeadLinks ? 'danger' : 'muted'}
              style={styles.meta}
              numberOfLines={1}
            >
              {meta}
            </Text>
          </View>
        </View>

        <Icons.chevronRight size={22} color={colors.inkMuted} strokeWidth={STROKE_BOLD} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    flex: 1,
    minWidth: 0,
  },
  text: { flex: 1, minWidth: 0 },
  meta: { marginTop: 2 },
});
