import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { Member } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { Icons, STROKE, STROKE_BOLD, iconForKey } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { formatRelative } from '@/lib/date';
import { initial, joinMeta, pluralize } from '@/lib/format';
import { useUiStore } from '@/store/ui.store';
import { alpha, colors, layout, radii, spacing, status } from '@/theme';
import { useWorkspace } from '../hooks';

/**
 * Frame 15 — the team workspace hub: members, shared folders, what's assigned
 * to you and any pending invites.
 */

const ROLE_BADGES: Record<Member['role'], { label: string; background: string; color: string }> = {
  owner: { label: 'Owner', background: colors.ink, color: colors.onInk },
  admin: { label: 'Admin', background: colors.accents.green, color: colors.onInk },
  member: { label: 'Member', background: colors.sand, color: colors.inkMuted },
};

export function WorkspaceScreen() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const workspace = useWorkspace();

  return (
    <Screen hasTabBar onRefresh={() => void workspace.refetch()} refreshing={workspace.isRefetching}>
      <QueryBoundary query={workspace}>
        {(data) => (
          <>
            <View style={styles.switcher}>
              <View style={styles.switcherLeft}>
                <Avatar
                  initial={initial(data.name)}
                  accent={data.accent}
                  size={44}
                  radius={radii.tile}
                />

                <View style={styles.switcherText}>
                  <Pressable
                    onPress={() => showToast('Workspace switching is coming soon.', 'info')}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch workspace, currently ${data.name}`}
                    style={styles.switcherTitle}
                  >
                    <Text variant="navTitle" numberOfLines={1}>
                      {data.name}
                    </Text>
                    <Icons.chevronDown size={16} color={colors.ink} strokeWidth={STROKE_BOLD} />
                  </Pressable>

                  <Text variant="meta" tone="muted">
                    {joinMeta('Workspace', pluralize(data.memberCount, 'member'))}
                  </Text>
                </View>
              </View>

              <IconButton
                icon={Icons.settings}
                accessibilityLabel="Workspace settings"
                size={layout.headerButtonSm}
                iconSize={18}
                onPress={() => router.push('/(tabs)/settings')}
              />
            </View>

            <SectionHeader title="Members" count={data.memberCount} variant="rowTitle" />

            <View style={styles.memberList}>
              {data.members.map((member) => {
                const badge = ROLE_BADGES[member.role];
                return (
                  <Card
                    key={member.id}
                    elevated={false}
                    radius={radii.row}
                    style={styles.memberRow}
                    accessibilityLabel={`${member.name}, ${badge.label}`}
                  >
                    <Avatar initial={initial(member.name)} accent={member.accent} size={40} />

                    <View style={styles.memberText}>
                      <Text variant="bodySmStrong" numberOfLines={1}>
                        {member.name}
                        {member.isCurrentUser ? (
                          <Text variant="micro" tone="muted">
                            {' · you'}
                          </Text>
                        ) : null}
                      </Text>
                      <Text variant="micro" tone="muted" numberOfLines={1}>
                        {member.email}
                      </Text>
                    </View>

                    <Badge label={badge.label} background={badge.background} color={badge.color} />
                  </Card>
                );
              })}
            </View>

            <Button
              label="Invite member"
              icon={Icons.userPlus}
              onPress={() => router.push('/team/invite')}
              size="lg"
              fullWidth
              style={styles.inviteButton}
            />

            <Text variant="rowTitle" style={styles.sectionTitle}>
              Shared folders
            </Text>
            <View style={styles.folderGrid}>
              {data.sharedFolders.map((folder) => (
                <Card
                  key={folder.id}
                  elevated={false}
                  radius={radii.row}
                  style={styles.folderTile}
                  onPress={() => showToast('Shared folders are coming soon.', 'info')}
                  accessibilityLabel={`${folder.name}, ${pluralize(folder.linkCount, 'link')}`}
                >
                  <IconBubble
                    icon={iconForKey(folder.icon)}
                    accent={folder.accent}
                    size={34}
                    iconSize={17}
                    strokeWidth={STROKE}
                    style={styles.folderIcon}
                  />
                  <Text variant="bodySmStrong">{folder.name}</Text>
                  <Text variant="micro" tone="muted" style={styles.folderMeta}>
                    {joinMeta(
                      pluralize(folder.linkCount, 'link'),
                      pluralize(folder.memberCount, 'member'),
                    )}
                  </Text>
                </Card>
              ))}
            </View>

            {data.assignments.length > 0 ? (
              <>
                <Text variant="rowTitle" style={styles.sectionTitle}>
                  Assigned to you
                </Text>

                {data.assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    tone="pink"
                    elevated={false}
                    radius={radii.row}
                    style={styles.assignment}
                  >
                    <View style={styles.assignmentBubble}>
                      <Icons.checklist size={16} color={colors.ink} strokeWidth={STROKE} />
                    </View>

                    <View style={styles.assignmentText}>
                      <Text variant="bodySmStrong">{assignment.title}</Text>
                      <Text
                        variant="micro"
                        color={alpha.onPinkMutedStrong}
                        style={styles.assignmentMeta}
                      >
                        {joinMeta(`Assigned by ${assignment.assignedBy}`, assignment.dueLabel)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => showToast('Assignments are coming soon.', 'info')}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text variant="metaStrong">Start</Text>
                    </Pressable>
                  </Card>
                ))}
              </>
            ) : null}

            {data.pendingInvites.length > 0 ? (
              <>
                <Text variant="rowTitle" style={styles.sectionTitle}>
                  Pending invites
                </Text>

                <View style={styles.memberList}>
                  {data.pendingInvites.map((invite) => (
                    <View key={invite.id} style={styles.pendingRow}>
                      <IconBubble
                        icon={Icons.mail}
                        backgroundColor={colors.sand}
                        color={colors.inkFaint}
                        size={40}
                        iconSize={17}
                        strokeWidth={STROKE}
                      />

                      <View style={styles.memberText}>
                        <Text variant="bodySmStrong" tone="muted" numberOfLines={1}>
                          {invite.email}
                        </Text>
                        <Text variant="micro" tone="muted">
                          Invited {formatRelative(invite.invitedAt).toLowerCase()}
                        </Text>
                      </View>

                      <Badge
                        label="Pending"
                        background={alpha.pendingBadge}
                        color={status.slow.text}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['3xl'],
  },
  switcherLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, flex: 1 },
  switcherText: { flex: 1, minWidth: 0 },
  switcherTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  memberList: { gap: spacing.md, marginBottom: spacing.lg },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  memberText: { flex: 1, minWidth: 0 },

  inviteButton: { marginBottom: spacing['5xl'] },
  sectionTitle: { marginHorizontal: 2, marginBottom: spacing.base },

  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['5xl'],
  },
  folderTile: {
    // Two per row, accounting for the 10px gap.
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  folderIcon: { marginBottom: spacing.md },
  folderMeta: { marginTop: 2 },

  assignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  assignmentBubble: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: alpha.onPinkBubble,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentText: { flex: 1, minWidth: 0 },
  assignmentMeta: { marginTop: 2 },

  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: alpha.borderDashed,
    borderRadius: radii.row,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
});
