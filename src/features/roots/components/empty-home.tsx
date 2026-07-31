import { Pressable, StyleSheet, View } from 'react-native';

import { Icons, STROKE_HEAVY } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ConicRing } from '@/components/ui/conic-ring';
import { Text } from '@/components/ui/text';
import { alpha, colors, radii, shadows, spacing } from '@/theme';

/**
 * Frame 8 — the zero-state that replaces Home's content when a user has no
 * roots. The illustration is the brand ring at 40% opacity behind a small
 * placeholder card.
 */

export function EmptyHome({
  onCreateRoot,
  onPasteLink,
}: {
  onCreateRoot: () => void;
  onPasteLink: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <ConicRing size={180} thickness={18} opacity={0.4} />

        <View style={styles.card}>
          <View style={[styles.bar, { width: 56 }]} />
          <View style={[styles.bar, { width: 40 }]} />
          <View style={styles.dashedBox}>
            <Icons.plus size={14} color={alpha.emptyGlyph} strokeWidth={STROKE_HEAVY} />
          </View>
        </View>
      </View>

      <Text variant="pageTitle" align="center" style={styles.headline}>
        No roots yet
      </Text>

      <Text variant="bodyText" tone="muted" align="center" style={styles.body}>
        Every link needs a home. Create your first root and Rootly will start
        filing pages for you.
      </Text>

      <Button
        label="Create your first root"
        onPress={onCreateRoot}
        icon={Icons.plus}
        size="block"
        fullWidth={false}
        style={styles.cta}
      />

      <Pressable onPress={onPasteLink} accessibilityRole="button" hitSlop={8}>
        <Text variant="label" tone="muted" align="center" style={styles.secondary}>
          or{' '}
          <Text variant="labelStrong" tone="ink" style={styles.underline}>
            paste a link
          </Text>{' '}
          to auto-file it
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['3xl'],
  },
  illustration: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  card: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  bar: { height: 8, borderRadius: radii.pill, backgroundColor: colors.sand },
  dashedBox: {
    width: 26,
    height: 26,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: alpha.emptyDash,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxs,
  },
  headline: { marginBottom: spacing.sm },
  body: { maxWidth: 280, marginBottom: spacing['6xl'] },
  cta: { paddingHorizontal: 28 },
  secondary: { marginTop: spacing.xl },
  underline: { textDecorationLine: 'underline' },
});
