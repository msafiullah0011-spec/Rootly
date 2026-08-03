import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Icons, STROKE, type IconComponent } from '@/components/icons';
import { Badge } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Divider, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { formatRelative } from '@/lib/date';
import { useUiStore } from '@/store/ui.store';
import { alpha, colors, spacing, status } from '@/theme';
import { useInvite, useResendInvite, useRevokeInvite, useWorkspace } from '../hooks';

/**
 * What a pending-invite row on frame 15 opens.
 *
 * An outstanding invite has three useful moves: nudge it, hand the join link to
 * the person directly, or take it back. Revoking is destructive and irreversible
 * from here, so it asks first — the same two-step the member sheet uses.
 */

type Mode = 'menu' | 'revoke';

export function InviteOptionsSheet({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);

  const workspace = useWorkspace();
  const invite = useInvite(inviteId);
  const resend = useResendInvite();
  const revoke = useRevokeInvite();

  const [mode, setMode] = useState<Mode>('menu');

  const dismiss = () => router.back();

  if (!invite) {
    return (
      <Sheet onDismiss={dismiss}>
        <Text variant="cardTitle" style={styles.confirmTitle}>
          That invite isn&apos;t outstanding anymore
        </Text>
        <Text variant="bodySm" tone="muted" style={styles.confirmBody}>
          It may have been accepted or already revoked.
        </Text>
        <Button label="Close" size="block" onPress={dismiss} />
      </Sheet>
    );
  }

  const copyInviteLink = async () => {
    const url = workspace.data?.inviteUrl;
    if (!url) {
      showToast("This workspace doesn't have a join link yet.", 'info');
      return;
    }
    await Clipboard.setStringAsync(url);
    showToast('Invite link copied.', 'success');
    dismiss();
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <IconBubble
          icon={Icons.mail}
          backgroundColor={colors.sand}
          color={colors.inkFaint}
          size={44}
          iconSize={19}
          strokeWidth={STROKE}
        />

        <View style={styles.headerText}>
          <Text variant="cardTitle" numberOfLines={1}>
            {invite.email}
          </Text>
          <Text variant="meta" tone="muted" numberOfLines={1}>
            Invited {formatRelative(invite.invitedAt).toLowerCase()} ·{' '}
            {invite.access === 'edit' ? 'can edit' : 'can view'}
          </Text>
        </View>

        <Badge label="Pending" background={alpha.pendingBadge} color={status.slow.text} />
      </View>

      {mode === 'menu' ? (
        <View style={styles.menu}>
          <MenuRow
            icon={Icons.send}
            title="Resend invite"
            meta="Emails them the join link again"
            disabled={resend.isPending}
            onPress={() => resend.mutate(invite.id, { onSuccess: dismiss })}
          />

          <Divider />

          <MenuRow
            icon={Icons.copy}
            title="Copy invite link"
            meta={workspace.data?.inviteUrl ?? 'The workspace join link'}
            onPress={() => void copyInviteLink()}
          />

          <Divider />

          <MenuRow
            icon={Icons.close}
            title="Revoke invite"
            meta="The link stops working immediately"
            danger
            onPress={() => setMode('revoke')}
          />
        </View>
      ) : (
        <>
          <Text variant="cardTitle" style={styles.confirmTitle}>
            Revoke this invite?
          </Text>
          <Text variant="bodySm" tone="muted" style={styles.confirmBody}>
            {invite.email} won&apos;t be able to join with the link they were sent. You can invite
            them again at any time.
          </Text>

          <View style={styles.footer}>
            <Button
              label="Keep it"
              variant="secondary"
              size="block"
              fullWidth={false}
              onPress={() => setMode('menu')}
              style={styles.secondaryButton}
            />
            <Button
              label="Revoke"
              size="block"
              loading={revoke.isPending}
              onPress={() =>
                revoke.mutate({ inviteId: invite.id, email: invite.email }, { onSuccess: dismiss })
              }
              style={[styles.primaryButton, styles.revokeButton]}
            />
          </View>
        </>
      )}
    </Sheet>
  );
}

function MenuRow({
  icon,
  title,
  meta,
  onPress,
  danger = false,
  disabled = false,
}: {
  icon: IconComponent;
  title: string;
  meta: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <ListRow
      title={title}
      meta={meta}
      onPress={disabled ? undefined : onPress}
      card={false}
      padding={undefined}
      style={[styles.menuRow, disabled && styles.menuRowDisabled]}
      leading={
        <IconBubble
          icon={icon}
          backgroundColor={danger ? colors.danger : colors.sand}
          color={danger ? colors.onInk : colors.ink}
          size={36}
          iconSize={17}
        />
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
  menuRowDisabled: { opacity: 0.5 },

  confirmTitle: { marginBottom: spacing.xs },
  confirmBody: { marginBottom: spacing['3xl'] },

  footer: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { paddingHorizontal: spacing['3xl'] },
  primaryButton: { flex: 1 },
  revokeButton: { backgroundColor: colors.danger },
});
