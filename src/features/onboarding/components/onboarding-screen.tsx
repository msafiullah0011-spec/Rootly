import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { AccentNameValue, IconKey } from '@/api/schemas';
import { Screen } from '@/components/layout/screen';
import { Icons, STROKE_HEAVY } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useCreateRoot } from '@/features/roots/hooks';
import { useAuthStore } from '@/store/auth.store';
import {
  accents,
  alpha,
  colors,
  radii,
  screenPadding,
  spacing,
} from '@/theme';

/**
 * Frame 7 — Onboarding: create your first root.
 *
 * Step dots, a name field, a colour picker, an icon picker and the
 * Root → Shelf → Link explainer, over a pinned Continue button.
 */

const SWATCHES: AccentNameValue[] = ['pink', 'blue', 'yellow', 'green', 'lavender'];

const ICON_OPTIONS: { key: IconKey; icon: typeof Icons.store }[] = [
  { key: 'store', icon: Icons.store },
  { key: 'house', icon: Icons.house },
  { key: 'person', icon: Icons.person },
  { key: 'star', icon: Icons.star },
];

const HIERARCHY = [
  { step: '1', accent: 'pink' as const, lead: 'Root', rest: ' — the thing you manage', indent: 0 },
  { step: '2', accent: 'blue' as const, lead: 'Shelf', rest: ' — a category inside it', indent: 14 },
  { step: '3', accent: 'green' as const, lead: 'Link', rest: ' — the saved page', indent: 28 },
];

export function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const createRoot = useCreateRoot();

  const [name, setName] = useState('');
  const [accent, setAccent] = useState<AccentNameValue>('pink');
  const [icon, setIcon] = useState<IconKey>('store');
  const [nameError, setNameError] = useState<string>();

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Give your root a name.');
      return;
    }

    createRoot.mutate(
      { name: trimmed, accent, icon },
      { onSuccess: finish },
    );
  };

  return (
    <Screen padding={screenPadding.wide} bottomInset={72}>
      <View style={styles.stepRow}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Pressable onPress={finish} accessibilityRole="button" hitSlop={10}>
          <Text variant="label" tone="muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <Text variant="hero" style={styles.title}>
        Create your{'\n'}first root
      </Text>

      <Text variant="bodyText" tone="muted" style={styles.description}>
        A root is a real thing you manage — a business, a client, an office.
        Everything you save lives inside one.
      </Text>

      <TextField
        label="Root name"
        placeholder="mystore.pk"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (nameError) setNameError(undefined);
        }}
        error={nameError}
        strong
        radius={radii.field}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        // The design shows a pink caret in this field.
        selectionColor={colors.brand}
        containerStyle={styles.field}
        fieldStyle={styles.nameField}
      />

      <Text variant="meta" tone="muted" style={styles.pickerLabel}>
        Pick a colour
      </Text>
      <View style={styles.swatchRow}>
        {SWATCHES.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => setAccent(swatch)}
            accessibilityRole="radio"
            accessibilityState={{ selected: accent === swatch }}
            accessibilityLabel={`${swatch} colour`}
            style={[styles.swatch, { backgroundColor: accents[swatch] }]}
          >
            {accent === swatch ? (
              <Icons.check size={20} color={colors.ink} strokeWidth={STROKE_HEAVY} />
            ) : null}
          </Pressable>
        ))}
      </View>

      <Text variant="meta" tone="muted" style={styles.pickerLabel}>
        Pick an icon
      </Text>
      <View style={styles.iconRow}>
        {ICON_OPTIONS.map((option) => {
          const selected = icon === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setIcon(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.key} icon`}
              style={[styles.iconTile, selected ? styles.iconTileActive : styles.iconTileInactive]}
            >
              <option.icon
                size={20}
                color={selected ? colors.onInk : colors.ink}
                strokeWidth={1.6}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.explainer}>
        {HIERARCHY.map((row, index) => (
          <View
            key={row.step}
            style={[
              styles.explainerRow,
              { paddingLeft: row.indent },
              index < HIERARCHY.length - 1 && styles.explainerRowSpaced,
            ]}
          >
            <View style={[styles.explainerBadge, { backgroundColor: accents[row.accent] }]}>
              <Text
                variant="metaStrong"
                color={row.accent === 'green' ? colors.onInk : colors.ink}
              >
                {row.step}
              </Text>
            </View>
            <Text variant="bodySm">
              <Text variant="bodySmStrong">{row.lead}</Text>
              {row.rest}
            </Text>
          </View>
        ))}
      </View>

      <Button
        label="Continue"
        onPress={handleContinue}
        size="block"
        loading={createRoot.isPending}
        style={styles.continue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['6xl'],
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: alpha.stepDot,
  },
  dotActive: { width: 24, backgroundColor: colors.ink },

  title: { marginBottom: spacing.md, lineHeight: 33 },
  description: { marginBottom: spacing['5xl'], lineHeight: 23 },

  field: { marginBottom: spacing['4xl'] },
  nameField: { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl },

  pickerLabel: { marginHorizontal: 2, marginBottom: spacing.md },
  swatchRow: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing['4xl'] },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconRow: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing['6xl'] },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileActive: { backgroundColor: colors.ink },
  iconTileInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.border,
  },

  explainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.hairline,
    borderRadius: radii.row,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  explainerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  explainerRowSpaced: { marginBottom: spacing.md },
  explainerBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continue: { marginTop: spacing['6xl'] },
});
