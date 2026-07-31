import { Pressable, StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { alpha, colors, radii, shadows } from '@/theme';

/**
 * The white surface used for every card and list row.
 *
 * Note `elevated` defaults to true but is deliberately turned off in several
 * places — the handoff omits the shadow on shelf rows, related-link rows, the
 * onboarding explainer and all pink AI cards.
 */

export type CardTone = 'surface' | 'ink' | 'pink';

export interface CardProps {
  children: React.ReactNode;
  tone?: CardTone;
  /** Corner radius. Defaults to 24 (cards); rows use 20. */
  radius?: number;
  padding?: number;
  /** Applies the standard card shadow. */
  elevated?: boolean;
  /** Hairline border. Ink and pink cards have none. */
  bordered?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const toneStyles: Record<CardTone, { backgroundColor: string; defaultBordered: boolean }> = {
  surface: { backgroundColor: colors.surface, defaultBordered: true },
  ink: { backgroundColor: colors.ink, defaultBordered: false },
  pink: { backgroundColor: colors.brand, defaultBordered: false },
};

export function Card({
  children,
  tone = 'surface',
  radius = radii.card,
  padding,
  elevated = true,
  bordered,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: CardProps) {
  const toneConfig = toneStyles[tone];
  const showBorder = bordered ?? toneConfig.defaultBordered;

  const cardStyle: ViewStyle = {
    backgroundColor: toneConfig.backgroundColor,
    borderRadius: radius,
    borderWidth: showBorder ? 1 : 0,
    borderColor: alpha.hairline,
    ...(padding !== undefined ? { padding } : null),
  };

  if (!onPress) {
    return (
      <View style={[cardStyle, elevated && shadows.card, style]} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={({ pressed }) => [cardStyle, elevated && shadows.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});
