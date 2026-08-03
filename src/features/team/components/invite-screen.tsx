import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ApiError } from '@/api/errors';
import type { AccessLevel } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, STROKE } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/chip';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { Text } from '@/components/ui/text';
import { initial, pluralize } from '@/lib/format';
import { useUiStore } from '@/store/ui.store';
import { alpha, colors, radii, spacing, status } from '@/theme';
import { useRevokeInvite, useSendInvite, useWorkspace } from '../hooks';

/**
 * Frame 16 — invite members.
 *
 * A copyable invite link, an email composer with an access selector, and the
 * current people list mixing accepted members with pending invites.
 */

export function InviteScreen() {
  const showToast = useUiStore((state) => state.showToast);
  const workspace = useWorkspace();
  const sendInvite = useSendInvite();
  const revokeInvite = useRevokeInvite();

  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<AccessLevel>('edit');
  const [emailError, setEmailError] = useState<string>();

  const copyInviteLink = async (url: string) => {
    await Clipboard.setStringAsync(url);
    showToast('Invite link copied.', 'success');
  };

  const handleAdd = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Enter an email address.');
      return;
    }

    sendInvite.mutate(
      { email: trimmed, access },
      {
        onSuccess: () => {
          setEmail('');
          setEmailError(undefined);
        },
        onError: (error) => {
          const apiError = ApiError.from(error);
          setEmailError(apiError.fieldErrors?.email ?? apiError.message);
        },
      },
    );
  };

  const pendingCount = workspace.data?.pendingInvites.length ?? 0;

  return (
    <Screen bottomInset={72}>
      <ScreenHeader title="Invite members" />

      <QueryBoundary query={workspace}>
        {(data) => (
          <>
            <Text variant="sectionHero" style={styles.hero}>
              Bring people into{'\n'}
              {data.name}
            </Text>
            <Text variant="bodySm" tone="muted" style={styles.heroSubtitle}>
              Everyone you add can browse and save links in this workspace&apos;s shared shelves.
            </Text>

            <Card tone="ink" elevated={false} style={styles.inviteCard}>
              <IconBubble
                icon={Icons.link}
                backgroundColor={alpha.onInkSurface}
                color={colors.onInk}
                size={44}
                iconSize={20}
                radius={radii.tile}
                strokeWidth={STROKE}
              />

              <View style={styles.inviteCardText}>
                <Text variant="rowTitle" tone="onInk">
                  Invite link
                </Text>
                <Text variant="meta" color={alpha.onInkMuted} numberOfLines={1}>
                  {data.inviteUrl}
                </Text>
              </View>

              <Button
                label="Copy"
                variant="pink"
                size="sm"
                onPress={() => void copyInviteLink(data.inviteUrl)}
              />
            </Card>

            <Text variant="bodySmStrong" tone="muted" style={styles.sectionLabel}>
              Invite by email
            </Text>

            <TextField
              icon={Icons.mail}
              placeholder="name@company.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(undefined);
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              radius={radii.field}
              containerStyle={styles.emailField}
              fieldStyle={styles.emailFieldBox}
              trailing={
                <Button label="Add" onPress={handleAdd} size="md" loading={sendInvite.isPending} />
              }
            />

            <SegmentedControl
              options={[
                { value: 'edit', label: 'Can edit', icon: Icons.pencil },
                { value: 'view', label: 'Can view', icon: Icons.eye },
              ]}
              value={access}
              onChange={setAccess}
              variant="tiles"
              style={styles.accessSelector}
            />

            <SectionHeader
              title="People"
              count={data.members.length + pendingCount}
              variant="rowTitle"
            />

            <View style={styles.peopleList}>
              {data.members.map((member) => (
                <Card
                  key={member.id}
                  elevated={false}
                  radius={radii.row}
                  style={styles.personRow}
                  accessibilityLabel={`${member.name}, ${member.role}`}
                >
                  <Avatar initial={initial(member.name)} accent={member.accent} size={40} />

                  <View style={styles.personText}>
                    <Text variant="bodySmStrong" numberOfLines={1}>
                      {member.name}
                      {member.isCurrentUser ? (
                        <Text variant="micro" tone="muted">
                          {' · You'}
                        </Text>
                      ) : null}
                    </Text>
                    <Text variant="meta" tone="muted" numberOfLines={1}>
                      {member.email}
                    </Text>
                  </View>

                  <Text variant="meta" tone="muted">
                    {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                  </Text>
                </Card>
              ))}

              {data.pendingInvites.map((invite) => (
                <Card
                  key={invite.id}
                  elevated={false}
                  radius={radii.row}
                  style={styles.personRow}
                  accessibilityLabel={`${invite.email}, invite pending`}
                >
                  <Avatar initial={initial(invite.email)} accent="blue" size={40} />

                  <View style={styles.personText}>
                    <Text variant="bodySmStrong" numberOfLines={1}>
                      {invite.email}
                    </Text>
                    <View style={styles.pendingLine}>
                      <StatusDot color={status.pending.dot} size={6} />
                      <Text variant="meta" color={status.pending.text}>
                        Pending · Can {invite.access}
                      </Text>
                    </View>
                  </View>

                  <IconButton
                    icon={Icons.close}
                    accessibilityLabel={`Revoke invite for ${invite.email}`}
                    onPress={() =>
                      revokeInvite.mutate({ inviteId: invite.id, email: invite.email })
                    }
                    size={32}
                    iconSize={16}
                    color={colors.inkMuted}
                    backgroundColor={colors.screen}
                    bordered={false}
                    strokeWidth={1.7}
                  />
                </Card>
              ))}
            </View>

            {pendingCount > 0 ? (
              <Button
                label={`Send ${pluralize(pendingCount, 'invite')}`}
                icon={Icons.send}
                onPress={() => showToast('Invites sent.', 'success')}
                size="block"
                style={styles.sendButton}
              />
            ) : null}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: 2, marginBottom: spacing.xs, lineHeight: 28 },
  heroSubtitle: { marginHorizontal: 2, marginBottom: spacing['4xl'] },

  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing['4xl'],
  },
  inviteCardText: { flex: 1, minWidth: 0 },

  sectionLabel: { marginHorizontal: 2, marginBottom: spacing.md },
  emailField: { marginBottom: spacing.base },
  // The Add button lives inside the field, so the box loses its right padding.
  emailFieldBox: { paddingVertical: spacing.xs, paddingRight: spacing.xs, paddingLeft: spacing.xxl },
  accessSelector: { marginBottom: spacing['6xl'] },

  peopleList: { gap: spacing.md },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  personText: { flex: 1, minWidth: 0 },
  pendingLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },

  sendButton: { marginTop: spacing['5xl'] },
});
