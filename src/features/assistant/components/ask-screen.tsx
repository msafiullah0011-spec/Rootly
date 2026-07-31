import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Icons, SparkleFilled, STROKE_BOLD } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { InlineError } from '@/components/ui/states';
import { RichTextMulti, Text } from '@/components/ui/text';
import { alpha, colors, radii, shadows, spacing, text } from '@/theme';
import { useAsk } from '../hooks';

/**
 * Frame 5 — Ask, natural-language search over saved pages.
 *
 * The composer is pinned to the bottom and lifts with the keyboard. Errors
 * render inline above the answer rather than as a toast, because the user is
 * looking right at the thing that failed.
 */

const STARTER_QUESTIONS = [
  'The ad account we onboarded in March',
  'Which Gmail owns the GA4 property?',
  'All renewals due this month',
];

export function AskScreen() {
  const router = useRouter();
  const ask = useAsk();
  const [question, setQuestion] = useState('');

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || ask.isPending) return;
    setQuestion('');
    ask.mutate(trimmed);
  };

  const answer = ask.data;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen bottomInset={72}>
        <Text variant="heroSm" style={styles.title}>
          Ask your{'\n'}bookmarks
        </Text>
        <Text variant="bodySm" tone="muted" style={styles.subtitle}>
          Search inside pages, not just titles.
        </Text>

        {ask.isPending ? <SkeletonCard height={200} style={styles.answerCard} /> : null}

        {ask.isError ? (
          <InlineError
            error={ask.error}
            onRetry={() => ask.reset()}
            style={styles.answerCard}
          />
        ) : null}

        {answer && !ask.isPending ? (
          <Card padding={spacing.xxl} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <SparkleFilled size={16} color={colors.brand} />
              <Text variant="meta" tone="muted">
                You asked
              </Text>
            </View>

            <Text variant="rowTitle" style={styles.question}>
              “{answer.question}”
            </Text>

            <RichTextMulti
              body={answer.answer}
              emphasis={answer.emphasis}
              variant="bodySm"
              style={styles.answerBody}
            />

            {answer.citations.length > 0 ? (
              <>
                <Text variant="micro" tone="muted" style={styles.citedLabel}>
                  Cited from
                </Text>

                {answer.citations.map((citation) => (
                  <View key={citation.linkId} style={styles.citation}>
                    <Avatar
                      initial={citation.initial}
                      accent={citation.accent}
                      size={32}
                      radius={radii.chip}
                    />
                    <View style={styles.citationText}>
                      <Text variant="labelStrong" numberOfLines={1}>
                        {citation.title}
                      </Text>
                      <Text variant="micro" tone="muted" numberOfLines={1}>
                        {citation.path}
                      </Text>
                    </View>
                    <IconButton
                      icon={Icons.chevronRight}
                      accessibilityLabel={`Open ${citation.title}`}
                      onPress={() => router.push(`/links/${citation.linkId}`)}
                      size={32}
                      iconSize={16}
                      color={colors.inkMuted}
                      backgroundColor="transparent"
                      bordered={false}
                    />
                  </View>
                ))}
              </>
            ) : null}
          </Card>
        ) : null}

        {!answer && !ask.isPending ? (
          <>
            <Text variant="meta" tone="muted" style={styles.tryLabel}>
              Try asking
            </Text>
            <View style={styles.chips}>
              {STARTER_QUESTIONS.map((starter) => (
                <Chip key={starter} label={starter} onPress={() => submit(starter)} />
              ))}
            </View>
          </>
        ) : null}
      </Screen>

      <View style={styles.composerWrapper} pointerEvents="box-none">
        <View style={styles.composer}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask anything…"
            placeholderTextColor={alpha.onInkMuted}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => submit(question)}
            accessibilityLabel="Ask a question"
            editable={!ask.isPending}
          />

          <IconButton
            icon={Icons.arrowRight}
            accessibilityLabel="Send question"
            onPress={() => submit(question)}
            size={44}
            iconSize={20}
            color={colors.ink}
            backgroundColor={colors.brand}
            bordered={false}
            strokeWidth={STROKE_BOLD}
            disabled={ask.isPending || question.trim().length === 0}
            haptic
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginBottom: spacing.xs, lineHeight: 31 },
  subtitle: { marginBottom: spacing['3xl'] },

  answerCard: { marginBottom: spacing.xl },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  question: { marginBottom: spacing.lg },
  answerBody: { marginBottom: spacing.lg, lineHeight: 21 },
  citedLabel: { marginBottom: spacing.sm },
  citation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.chipBeige,
    borderRadius: radii.input,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  citationText: { flex: 1, minWidth: 0 },

  tryLabel: { marginHorizontal: 2, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  composerWrapper: {
    position: 'absolute',
    left: spacing['3xl'],
    right: spacing['3xl'],
    bottom: spacing['7xl'],
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    padding: spacing.sm,
    paddingLeft: spacing['3xl'],
    ...shadows.floatingBar,
  },
  input: {
    flex: 1,
    ...text.rowTitle(),
    fontWeight: '400',
    color: colors.onInk,
    paddingVertical: 0,
  },
});
