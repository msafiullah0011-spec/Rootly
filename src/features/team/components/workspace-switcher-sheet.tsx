import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { MemberRole } from '@/api/schemas';
import { Icons, STROKE } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Divider, ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeleton';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { initial, joinMeta, pluralize } from '@/lib/format';
import { colors, radii, spacing } from '@/theme';
import { useSwitchWorkspace, useWorkspaces } from '../hooks';

/**
 * What the workspace name on frame 15 opens.
 *
 * Every `/workspace` endpoint is scoped to whichever workspace is active, so
 * picking a row here genuinely changes the members, shared folders, assignments
 * and invites the screen behind this sheet is showing.
 */

const ROLE_BADGES: Record<MemberRole, { label: string; background: string; color: string }> = {
  owner: { label: 'Owner', background: colors.ink, color: colors.onInk },
  admin: { label: 'Admin', background: colors.accents.green, color: colors.onInk },
  member: { label: 'Member', background: colors.sand, color: colors.inkMuted },
};

export function WorkspaceSwitcherSheet() {
  const router = useRouter();
  const workspaces = useWorkspaces();
  const switchWorkspace = useSwitchWorkspace();

  const dismiss = () => router.back();

  const choose = (workspaceId: string, isCurrent: boolean) => {
    if (isCurrent) return dismiss();
    if (switchWorkspace.isPending) return;
    switchWorkspace.mutate(workspaceId, { onSuccess: dismiss });
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <Text variant="cardTitle">Your workspaces</Text>
        <Text variant="meta" tone="muted">
          {workspaces.data
            ? pluralize(workspaces.data.length, 'workspace')
            : 'Looking them up…'}
        </Text>
      </View>

      {workspaces.isPending ? (
        <SkeletonList count={3} />
      ) : workspaces.isError ? (
        <InlineError
          error={workspaces.error}
          onRetry={() => void workspaces.refetch()}
          style={styles.error}
        />
      ) : (
        <View style={styles.list}>
          {(workspaces.data ?? []).map((workspace, index) => {
            const badge = ROLE_BADGES[workspace.role];
            const pending =
              switchWorkspace.isPending && switchWorkspace.variables === workspace.id;

            return (
              <View key={workspace.id}>
                {index > 0 ? <Divider /> : null}
                <ListRow
                  title={workspace.name}
                  meta={joinMeta(
                    pluralize(workspace.memberCount, 'member'),
                    workspace.isCurrent ? 'current' : undefined,
                  )}
                  card={false}
                  padding={undefined}
                  style={[styles.row, pending && styles.rowPending]}
                  onPress={() => choose(workspace.id, workspace.isCurrent)}
                  accessibilityHint={
                    workspace.isCurrent
                      ? 'Already the workspace you are in'
                      : 'Switches to this workspace'
                  }
                  leading={
                    <Avatar
                      initial={initial(workspace.name)}
                      accent={workspace.accent}
                      size={40}
                      radius={radii.tile}
                    />
                  }
                  trailing={
                    <View style={styles.rowTrailing}>
                      <Badge
                        label={badge.label}
                        background={badge.background}
                        color={badge.color}
                      />
                      {workspace.isCurrent ? (
                        <Icons.check size={18} color={colors.ink} strokeWidth={STROKE} />
                      ) : null}
                    </View>
                  }
                />
              </View>
            );
          })}
        </View>
      )}

      <Button label="Done" size="block" onPress={dismiss} style={styles.done} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg, gap: 2 },
  error: { marginBottom: spacing.xl },

  list: { marginHorizontal: -spacing.xxs, marginBottom: spacing.xxl },
  row: { paddingVertical: spacing.base, paddingHorizontal: spacing.xxs },
  rowPending: { opacity: 0.5 },
  rowTrailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  done: { marginTop: spacing.xs },
});
