import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';
import { Sheet } from '@/components/ui/sheet';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/theme';
import { useReplyToTimelineEvent, useTimelineEvent } from '../hooks';

/**
 * What "Reply" on a comment row opens.
 *
 * There's no thread view yet, so a reply is posted as its own feed event — the
 * sheet echoes the comment it answers so the composer isn't context-free.
 */

const MAX = 500;

export function TimelineReplySheet({ eventId }: { eventId: string }) {
  const router = useRouter();
  const event = useTimelineEvent(eventId);
  const reply = useReplyToTimelineEvent(eventId);

  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();

  const dismiss = () => router.back();

  if (event.isError) {
    return (
      <Sheet onDismiss={dismiss}>
        <Text variant="cardTitle" style={styles.missingTitle}>
          That activity isn&apos;t here anymore
        </Text>
        <Text variant="bodySm" tone="muted" style={styles.missingBody}>
          It may have been undone or cleared from the feed.
        </Text>
        <Button label="Close" size="block" onPress={dismiss} />
      </Sheet>
    );
  }

  const data = event.data;
  const subject = data
    ? `${data.lead}${data.body}${data.trailingEmphasis ?? ''}`
    : 'Loading that comment…';

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Write a reply first.');
      return;
    }

    setError(undefined);
    reply.mutate(trimmed, { onSuccess: dismiss });
  };

  return (
    <Sheet onDismiss={dismiss}>
      <View style={styles.header}>
        <IconBubble icon={Icons.comment} accent="lavender" size={40} iconSize={19} />
        <View style={styles.headerText}>
          <Text variant="cardTitle">Reply</Text>
          <Text variant="meta" tone="muted" numberOfLines={2}>
            {subject}
          </Text>
        </View>
      </View>

      <TextField
        placeholder="Write a reply…"
        value={body}
        onChangeText={(value) => {
          setBody(value);
          if (error) setError(undefined);
        }}
        error={error}
        hint={`${body.trim().length}/${MAX}`}
        maxLength={MAX}
        multiline
        autoFocus
        containerStyle={styles.field}
      />

      {reply.isError ? <InlineError error={reply.error} style={styles.error} /> : null}

      <View style={styles.footer}>
        <Button
          label="Cancel"
          variant="secondary"
          size="block"
          fullWidth={false}
          onPress={dismiss}
          style={styles.cancelButton}
        />
        <Button
          label="Send"
          size="block"
          onPress={handleSend}
          loading={reply.isPending}
          style={styles.sendButton}
        />
      </View>
    </Sheet>
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

  field: { marginBottom: spacing.xl },
  error: { marginBottom: spacing.xl },

  footer: { flexDirection: 'row', gap: spacing.md },
  cancelButton: { paddingHorizontal: spacing['3xl'] },
  sendButton: { flex: 1 },

  missingTitle: { marginBottom: spacing.xs },
  missingBody: { marginBottom: spacing['3xl'] },
});
