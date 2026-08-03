import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import type { MemberRole } from '@/api/schemas';
import { Icons, STROKE, type IconComponent } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/chip';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Divider, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { initial } from '@/lib/format';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';
import { useCurrentMember, useMember, useRemoveMember, useUpdateMemberRole } from '../hooks';

/**
 * What a member row opens: their role, and what you can do about it.
 *
 * The owner is deliberately immutable here — demoting them would leave the
 * workspace without one, and ownership transfer is its own flow. Members who
 * can't manage anyone still get the sheet, read-only, because "who is this
 * person and what can they do" is the question the row is asking.
 */

const ROLE_BADGES: Record<MemberRole, { label: string; background: string; color: string }> = {
  owner: { label: 'Owner', background: colors.ink, color: colors.onInk },
  admin: { label: 'Admin', background: colors.accents.green, color: colors.onInk },
  member: { label: 'Member', background: colors.sand, color: colors.inkMuted },
};

const ROLE_OPTIONS: { role: Exclude<MemberRole, 'owner'>; title: string; meta: string }[] = [
  { role: 'admin', title: 'Admin', meta: 'Can invite people and manage shelves' },
  { role: 'member', title: 'Member', meta: 'Can browse and save links' },
];

type Mode = 'menu' | 'remove';

export function MemberSheet({ memberId }: { memberId: string }) {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);

  const member = useMember(memberId);
  const currentMember = useCurrentMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [mode, setMode] = useState<Mode>('menu');

  const dismiss = () => router.back();

  if (!member) {
    return (
      <Sheet onDismiss={dismiss}>
        <Text variant="cardTitle" style={styles.confirmTitle}>
          That member isn&apos;t here anymore
        </Text>
        <Text variant="bodySm" tone="muted" style={styles.confirmBody}>
          They may have been removed from the workspace.
        </Text>
        <Button label="Close" size="block" onPress={dismiss} />
      </Sheet>
    );
  }

  const badge = ROLE_BADGES[member.role];
  // An owner or admin manages people; the owner's own row is still off-limits.
  const canManage =
    currentMember?.role !== 'member' && member.role !== 'owner' && !member.isCurrentUser;

  const copyEmail = async (email: string) => {
    await Clipboard.setStringAsync(email);
    showToast('Email address copied.', 'success');
    dismiss();
  };

  const changeRole = (role: MemberRole) => {
    if (updateRole.isPending) return;
    if (role === member.role) return dismiss();
    updateRole.mutate({ memberId: member.id, role, name: member.name }, { onSuccess: dismiss });
  };

  const handleRemove = () => {
    removeMember.mutate({ memberId: member.id, name: member.name }, { onSuccess: dismiss });
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <Avatar initial={initial(member.name)} accent={member.accent} size={44} />

        <View style={styles.headerText}>
          <Text variant="cardTitle" numberOfLines={1}>
            {member.name}
            {member.isCurrentUser ? (
              <Text variant="micro" tone="muted">
                {' · you'}
              </Text>
            ) : null}
          </Text>
          <Text variant="meta" tone="muted" numberOfLines={1}>
            {member.email}
          </Text>
        </View>

        <Badge label={badge.label} background={badge.background} color={badge.color} />
      </View>

      {mode === 'menu' ? (
        <View style={styles.menu}>
          {canManage ? (
            <>
              <Text variant="meta" tone="muted" style={styles.groupLabel}>
                Role
              </Text>

              {ROLE_OPTIONS.map((option, index) => (
                <View key={option.role}>
                  {index > 0 ? <Divider /> : null}
                  <MenuRow
                    icon={option.role === 'admin' ? Icons.star : Icons.user}
                    title={option.title}
                    meta={option.meta}
                    selected={member.role === option.role}
                    onPress={() => changeRole(option.role)}
                  />
                </View>
              ))}

              <Divider />
            </>
          ) : null}

          <MenuRow
            icon={Icons.copy}
            title="Copy email address"
            meta={member.email}
            onPress={() => void copyEmail(member.email)}
          />

          {canManage ? (
            <>
              <Divider />
              <MenuRow
                icon={Icons.close}
                title="Remove from workspace"
                meta="They lose access to every shared shelf"
                danger
                onPress={() => setMode('remove')}
              />
            </>
          ) : (
            <Text variant="micro" tone="muted" style={styles.note}>
              {noteFor(member.isCurrentUser, member.role, currentMember?.role)}
            </Text>
          )}
        </View>
      ) : (
        <>
          <Text variant="cardTitle" style={styles.confirmTitle}>
            Remove {member.name}?
          </Text>
          <Text variant="bodySm" tone="muted" style={styles.confirmBody}>
            They lose access to this workspace&apos;s shared folders. Links they saved stay where
            they are.
          </Text>

          <View style={styles.footer}>
            <Button
              label="Keep them"
              variant="secondary"
              size="block"
              fullWidth={false}
              onPress={() => setMode('menu')}
              style={styles.secondaryButton}
            />
            <Button
              label="Remove"
              size="block"
              onPress={handleRemove}
              loading={removeMember.isPending}
              style={[styles.primaryButton, styles.removeButton]}
            />
          </View>
        </>
      )}
    </Sheet>
  );
}

/** Why the role rows aren't offered — there are four different reasons. */
function noteFor(
  isCurrentUser: boolean,
  role: MemberRole,
  viewerRole: MemberRole | undefined,
): string {
  if (isCurrentUser) {
    return role === 'owner'
      ? 'You own this workspace, so your own access stays as it is.'
      : 'Your role is set by the workspace owner.';
  }
  if (role === 'owner') {
    return "The owner keeps full access — transferring ownership isn't built yet.";
  }
  return viewerRole === 'member'
    ? 'Only the owner and admins can change roles.'
    : 'This role can only be changed by the workspace owner.';
}

function MenuRow({
  icon,
  title,
  meta,
  onPress,
  selected = false,
  danger = false,
}: {
  icon: IconComponent;
  title: string;
  meta: string;
  onPress: () => void;
  /** Marks the member's current role with the design's check. */
  selected?: boolean;
  danger?: boolean;
}) {
  return (
    <ListRow
      title={title}
      meta={meta}
      onPress={onPress}
      card={false}
      padding={undefined}
      style={styles.menuRow}
      leading={
        <IconBubble
          icon={icon}
          backgroundColor={danger ? colors.danger : colors.sand}
          color={danger ? colors.onInk : colors.ink}
          size={36}
          iconSize={17}
        />
      }
      trailing={
        selected ? <Icons.check size={18} color={colors.ink} strokeWidth={STROKE} /> : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  headerText: { flex: 1, minWidth: 0, gap: 2 },

  menu: { marginHorizontal: -spacing.xxs },
  menuRow: { paddingVertical: spacing.base, paddingHorizontal: spacing.xxs },
  groupLabel: { marginBottom: spacing.xs, marginHorizontal: spacing.xxs },
  note: { marginTop: spacing.lg, marginHorizontal: spacing.xxs, lineHeight: 16 },

  confirmTitle: { marginBottom: spacing.xs },
  confirmBody: { marginBottom: spacing['3xl'] },

  footer: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { paddingHorizontal: spacing['3xl'] },
  primaryButton: { flex: 1 },
  removeButton: { backgroundColor: colors.danger },
});
