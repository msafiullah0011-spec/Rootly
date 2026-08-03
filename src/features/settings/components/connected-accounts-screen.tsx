import { StyleSheet, View } from 'react-native';

import type { ConnectedAccount } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, iconForKey } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/chip';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { formatRelative } from '@/lib/date';
import { joinMeta, pluralize } from '@/lib/format';
import { colors, radii, spacing, status } from '@/theme';
import {
  useConnectAccount,
  useConnectedAccounts,
  useDisconnectAccount,
  type AccountMutationInput,
} from '../hooks';

/**
 * Connected accounts — reached from the Settings row of the same name.
 *
 * The handoff has no frame for this, so it's assembled from the invite screen's
 * vocabulary: hero, section headers, and the same white person-row card. Live
 * connections and providers on offer share one row component because they carry
 * the same shape — only the trailing action differs.
 */

export function ConnectedAccountsScreen() {
  const accounts = useConnectedAccounts();
  const connect = useConnectAccount();
  const disconnect = useDisconnectAccount();

  /** Which row is mid-request, so only that button shows a spinner. */
  const pendingId = connect.isPending
    ? connect.variables?.id
    : disconnect.isPending
      ? disconnect.variables?.id
      : undefined;

  return (
    <Screen>
      <ScreenHeader title="Connected accounts" />

      <QueryBoundary
        query={accounts}
        isEmpty={(data) => data.length === 0}
        empty={{
          title: 'Nothing to connect yet',
          description: 'Accounts you sign into from Rootly will show up here.',
          icon: Icons.link,
        }}
      >
        {(data) => {
          const linked = data.filter((account) => account.status !== 'available');
          const available = data.filter((account) => account.status === 'available');
          const expiredCount = linked.filter((account) => account.status === 'expired').length;

          return (
            <>
              <Text variant="sectionHero" style={styles.hero}>
                The logins behind{'\n'}your links
              </Text>
              <Text variant="bodySm" tone="muted" style={styles.heroSubtitle}>
                {expiredCount > 0
                  ? `${pluralize(expiredCount, 'account')} stopped syncing. Reconnect to keep link checks and renewal alerts accurate.`
                  : 'Rootly uses these to check a link is still alive and to spot a renewal before it bites.'}
              </Text>

              {linked.length > 0 ? (
                <>
                  <SectionHeader title="Connected" count={linked.length} variant="rowTitle" />
                  <View style={styles.list}>
                    {linked.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        pending={pendingId === account.id}
                        onConnect={connect.mutate}
                        onDisconnect={disconnect.mutate}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {available.length > 0 ? (
                <>
                  <SectionHeader title="Available" count={available.length} variant="rowTitle" />
                  <View style={styles.list}>
                    {available.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        pending={pendingId === account.id}
                        onConnect={connect.mutate}
                        onDisconnect={disconnect.mutate}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text variant="micro" tone="muted" style={styles.footnote}>
                Rootly only reads what it needs to check a link&apos;s health. Disconnecting stops
                the checks — it never deletes the links themselves.
              </Text>
            </>
          );
        }}
      </QueryBoundary>
    </Screen>
  );
}

function AccountRow({
  account,
  pending,
  onConnect,
  onDisconnect,
}: {
  account: ConnectedAccount;
  pending: boolean;
  onConnect: (input: AccountMutationInput) => void;
  onDisconnect: (input: AccountMutationInput) => void;
}) {
  const input: AccountMutationInput = { id: account.id, name: account.name };
  const isExpired = account.status === 'expired';
  const isAvailable = account.status === 'available';

  return (
    <Card
      elevated={false}
      radius={radii.row}
      style={styles.row}
      accessibilityLabel={joinMeta(account.name, account.purpose, statusLabel(account))}
    >
      <IconBubble
        icon={iconForKey(account.icon)}
        accent={account.accent}
        size={40}
        iconSize={19}
      />

      <View style={styles.rowText}>
        <Text variant="bodySmStrong" numberOfLines={1}>
          {account.name}
        </Text>
        <Text variant="meta" tone="muted" numberOfLines={1}>
          {joinMeta(account.purpose, account.linkCount > 0 && pluralize(account.linkCount, 'link'))}
        </Text>

        {isAvailable ? null : (
          <View style={styles.statusLine}>
            <StatusDot color={isExpired ? status.dead.dot : status.live.dot} size={6} />
            <Text
              variant="micro"
              color={isExpired ? status.dead.text : colors.inkMuted}
              numberOfLines={1}
              style={styles.statusText}
            >
              {statusLabel(account)}
            </Text>
          </View>
        )}
      </View>

      {isAvailable ? (
        <Button
          label="Connect"
          variant="secondary"
          size="sm"
          loading={pending}
          onPress={() => onConnect(input)}
        />
      ) : isExpired ? (
        <Button label="Reconnect" size="sm" loading={pending} onPress={() => onConnect(input)} />
      ) : (
        <IconButton
          icon={Icons.close}
          accessibilityLabel={`Disconnect ${account.name}`}
          onPress={() => onDisconnect(input)}
          disabled={pending}
          size={32}
          iconSize={16}
          color={colors.inkMuted}
          backgroundColor={colors.screen}
          bordered={false}
          strokeWidth={1.7}
        />
      )}
    </Card>
  );
}

/** The line under the account: who's signed in, or why it needs attention. */
function statusLabel(account: ConnectedAccount): string {
  if (account.status === 'available') return 'Not connected';
  if (account.status === 'expired') {
    return joinMeta('Sign-in expired', account.accountLabel);
  }
  return joinMeta(
    account.accountLabel,
    account.syncedAt && `Synced ${formatRelative(account.syncedAt).toLowerCase()}`,
  );
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: 2, marginBottom: spacing.xs, lineHeight: 28 },
  heroSubtitle: { marginHorizontal: 2, marginBottom: spacing['4xl'] },

  list: { gap: spacing.md, marginBottom: spacing['4xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { flex: 1 },

  footnote: { marginHorizontal: 2, lineHeight: 16 },
});
