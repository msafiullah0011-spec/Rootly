import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { HomeFeed } from '@/api/schemas';
import { QueryBoundary } from '@/components/layout/query-boundary';
import { Screen } from '@/components/layout/screen';
import { Avatar } from '@/components/ui/avatar';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { AssistantCard } from '@/features/assistant/components/assistant-card';
import { ResumeCard } from '@/features/links/components/resume-card';
import { formatGreetingDate, greetingFor } from '@/lib/date';
import { initial } from '@/lib/format';
import { screenPadding, spacing } from '@/theme';
import { useHomeFeed } from '../hooks';
import { EmptyHome } from './empty-home';
import { RootChip } from './root-chip';
import { RootRow } from './root-row';

/**
 * Frames 1 and 8 — Home.
 *
 * The assistant card is interleaved after the second root row, matching the
 * design's rhythm rather than being appended at the end of the list.
 */

const ASSISTANT_AFTER_INDEX = 1;

export function HomeScreen() {
  const router = useRouter();
  const feed = useHomeFeed();

  const openRoot = useCallback(
    (rootId: string) => router.push(`/roots/${rootId}`),
    [router],
  );

  const isEmpty = useCallback((data: HomeFeed) => data.roots.length === 0, []);

  return (
    <Screen
      hasTabBar
      onRefresh={() => void feed.refetch()}
      refreshing={feed.isRefetching && !feed.isPending}
      // The zero-state centres itself, so it needs a non-scrolling flex column.
      scroll={feed.data?.roots.length !== 0}
      contentStyle={feed.data?.roots.length === 0 ? styles.emptyContent : undefined}
      padding={feed.data?.roots.length === 0 ? screenPadding.wide : screenPadding.default}
    >
      <QueryBoundary
        query={feed}
        loading={
          <>
            <SkeletonCard height={92} style={styles.loadingResume} />
            <SkeletonList count={3} />
          </>
        }
      >
        {(data) => (
          <>
            <View style={styles.greeting}>
              <View style={styles.greetingText}>
                <Text variant="label" tone="muted" style={styles.date}>
                  {formatGreetingDate()}
                </Text>
                <Text variant="screenTitle">
                  {greetingFor()}, {data.greetingName}
                </Text>
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/settings')}
                accessibilityRole="button"
                accessibilityLabel="Your profile"
              >
                <Avatar initial={initial(data.user.name)} accent={data.user.accent} size={44} />
              </Pressable>
            </View>

            {isEmpty(data) ? (
              <EmptyHome
                onCreateRoot={() => router.push('/(onboarding)')}
                onPasteLink={() => router.push('/quick-add')}
              />
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroller}
                  contentContainerStyle={styles.chipContent}
                >
                  {data.roots.map((root) => (
                    <RootChip key={root.id} root={root} onPress={() => openRoot(root.id)} />
                  ))}
                </ScrollView>

                {data.resume ? (
                  <ResumeCard
                    link={data.resume}
                    onPress={() => router.push(`/links/${data.resume!.id}`)}
                  />
                ) : null}

                <SectionHeader title="Your roots" count={data.roots.length} style={styles.section} />

                {data.roots.map((root, index) => (
                  <View key={root.id}>
                    <RootRow root={root} onPress={() => openRoot(root.id)} />

                    {data.suggestion && index === ASSISTANT_AFTER_INDEX ? (
                      <AssistantCard
                        suggestion={data.suggestion}
                        onAction={() => router.push('/notifications')}
                        style={styles.assistant}
                      />
                    ) : index < data.roots.length - 1 ? (
                      <View style={styles.rowGap} />
                    ) : null}
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyContent: { flexGrow: 1 },
  loadingResume: { marginBottom: spacing.xl },

  greeting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing['3xl'],
  },
  greetingText: { flex: 1 },
  date: { marginBottom: 2 },

  chipScroller: {
    // Bleed the scroller to the screen edges so chips scroll past the padding.
    marginHorizontal: -screenPadding.default,
    marginBottom: spacing['4xl'],
  },
  chipContent: {
    gap: spacing.base,
    paddingHorizontal: screenPadding.default,
    paddingVertical: 2,
  },

  section: { marginTop: spacing.xxl },
  rowGap: { height: spacing.base },
  assistant: { marginVertical: spacing.lg },
});
