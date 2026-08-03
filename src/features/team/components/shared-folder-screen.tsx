import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, iconForKey } from '@/components/icons';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Text } from '@/components/ui/text';
import { LinkCard } from '@/features/links/components/link-card';
import { joinMeta, pluralize } from '@/lib/format';
import { radii, spacing } from '@/theme';
import { useSharedFolder, useSharedFolderLinks } from '../hooks';

/**
 * A shared folder's links, reached from the workspace's folder grid.
 *
 * The handoff has no frame for this — it's the shelf-links layout (frame 3)
 * with the workspace's people row in place of the swipe hint, because a shared
 * folder's point is *who else can see it*.
 */

export function SharedFolderScreen({ folderId }: { folderId: string }) {
  const router = useRouter();
  const folder = useSharedFolder(folderId);
  const links = useSharedFolderLinks(folderId);

  const folderName = folder.data?.name ?? 'Shared folder';

  return (
    <Screen>
      <ScreenHeader
        align="left"
        title={folder.data?.name}
        leading={
          folder.data ? (
            <IconBubble
              icon={iconForKey(folder.data.icon)}
              accent={folder.data.accent}
              size={36}
              iconSize={18}
            />
          ) : null
        }
        subtitle={
          folder.data ? (
            <Text variant="meta" tone="muted">
              {joinMeta(
                'Shared folder',
                pluralize(links.data?.length ?? folder.data.linkCount, 'link'),
              )}
            </Text>
          ) : null
        }
      />

      {folder.data && folder.data.members.length > 0 ? (
        <Card elevated={false} radius={radii.row} style={styles.people}>
          <AvatarStack members={folder.data.members} total={folder.data.memberCount} />
          <View style={styles.peopleText}>
            <Text variant="bodySmStrong" numberOfLines={1}>
              Shared with {pluralize(folder.data.memberCount, 'person', 'people')}
            </Text>
            <Text variant="micro" tone="muted" numberOfLines={1}>
              Everyone here can open every link in {folderName}.
            </Text>
          </View>
        </Card>
      ) : null}

      <QueryBoundary
        query={links}
        isEmpty={(data) => data.length === 0}
        empty={{
          title: 'Nothing shared here yet',
          description: `Links added to ${folderName} show up for everyone it's shared with.`,
          icon: Icons.folder,
        }}
      >
        {(data) => (
          <View style={styles.list}>
            {data.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onPress={() => router.push(`/links/${link.id}`)}
              />
            ))}
          </View>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  peopleText: { flex: 1, minWidth: 0, gap: 2 },

  list: { gap: spacing.base },
});
