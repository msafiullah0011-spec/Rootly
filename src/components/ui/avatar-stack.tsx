import { StyleSheet, Text, View, type StyleProp,
  type ViewStyle } from 'react-native';

import type { MemberAvatar } from '@/api/schemas';
import { colors, radii, text } from '@/theme';
import { Avatar } from './avatar';

/**
 * Overlapping member avatars with a `+N` overflow chip.
 *
 * The handoff shows up to three 26px circles at −8px overlap, each ringed 2px
 * in white, followed by a sand-coloured overflow chip.
 */

export interface AvatarStackProps {
  members: MemberAvatar[];
  /** Total member count; the `+N` chip shows the remainder. */
  total?: number;
  max?: number;
  size?: number;
  overlap?: number;
  style?: StyleProp<ViewStyle>;
}

export function AvatarStack({
  members,
  total,
  max = 3,
  size = 26,
  overlap = 8,
  style,
}: AvatarStackProps) {
  const visible = members.slice(0, max);
  const remainder = Math.max(0, (total ?? members.length) - visible.length);

  return (
    <View
      style={[styles.row, style]}
      accessibilityLabel={`${total ?? members.length} members`}
    >
      {visible.map((member, index) => (
        <Avatar
          key={member.id}
          initial={member.initial}
          accent={member.accent}
          size={size}
          ringWidth={2}
          style={index > 0 ? { marginLeft: -overlap } : undefined}
        />
      ))}

      {remainder > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              marginLeft: visible.length > 0 ? -overlap : 0,
            },
          ]}
        >
          <Text style={styles.overflowLabel} allowFontScaling={false}>
            +{remainder}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  overflow: {
    borderRadius: radii.pill,
    backgroundColor: colors.sand,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowLabel: {
    ...text.micro(),
    fontSize: 10,
    color: colors.inkMuted,
  },
});
