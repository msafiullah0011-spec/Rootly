import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Icons, STROKE } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { formatShortDate } from '@/lib/date';
import { initial } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';
import { useSettings } from '../hooks';

/**
 * Frame 9 — Settings / profile.
 *
 * The account card, grouped preference rows and the log-out button. Settings
 * load from the API so the "Connected accounts" and renewal values are real.
 */

export function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const showToast = useUiStore((state) => state.showToast);
  const settings = useSettings();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  return (
    <Screen hasTabBar>
      <Text variant="screenTitle" style={styles.title}>
        Settings
      </Text>

      <Card padding={spacing.xxl} style={styles.accountCard}>
        <Avatar initial={initial(user?.name ?? '?')} accent={user?.accent ?? 'lavender'} size={56} />

        <View style={styles.accountText}>
          <Text variant="navTitle" numberOfLines={1}>
            {user?.name ?? 'Your account'}
          </Text>
          <Text variant="label" tone="muted" numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
        </View>

        {user?.plan === 'pro' ? (
          <Badge label="Pro" background={colors.accents.yellow} color={colors.ink} />
        ) : null}
      </Card>

      <Text variant="meta" tone="muted" style={styles.groupLabel}>
        Preferences
      </Text>

      <Card elevated style={styles.group}>
        <ListRow
          title="Notifications"
          card={false}
          divider
          chevron
          onPress={() => router.push('/notifications')}
          leading={<IconBubble icon={Icons.bell} accent="pink" size={36} iconSize={18} strokeWidth={STROKE} />}
          style={styles.groupRow}
        />
        <ListRow
          title="Connected accounts"
          card={false}
          chevron
          onPress={() => showToast('Connected accounts are coming soon.', 'info')}
          leading={<IconBubble icon={Icons.link} accent="blue" size={36} iconSize={18} strokeWidth={STROKE} />}
          trailing={
            <Text variant="meta" tone="muted">
              {settings.data?.connectedAccountCount ?? '—'}
            </Text>
          }
          style={styles.groupRow}
        />
      </Card>

      <Text variant="meta" tone="muted" style={styles.groupLabel}>
        Plan
      </Text>

      <Card elevated style={styles.group}>
        <ListRow
          title="Subscription & billing"
          card={false}
          chevron
          onPress={() => showToast('Billing is coming soon.', 'info')}
          leading={<IconBubble icon={Icons.card} accent="lavender" size={36} iconSize={18} strokeWidth={STROKE} />}
          trailing={
            settings.data?.planRenewsAt ? (
              <Text variant="meta" tone="muted">
                Renews {formatShortDate(settings.data.planRenewsAt)}
              </Text>
            ) : null
          }
          style={styles.groupRow}
        />
      </Card>

      <Button
        label="Log out"
        variant="danger"
        icon={Icons.logOut}
        size="block"
        onPress={() => void handleSignOut()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginHorizontal: 2, marginBottom: spacing.xxl },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['4xl'],
  },
  accountText: { flex: 1, minWidth: 0 },

  groupLabel: { marginHorizontal: 2, marginBottom: spacing.md },
  group: { overflow: 'hidden', marginBottom: spacing['3xl'] },
  groupRow: { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl },
});
