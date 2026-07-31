import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, text as textStyles } from '@/theme';

/**
 * Typed text component.
 *
 * `variant` names come straight from `@/theme/typography`, so a screen reads as
 * `<Text variant="screenTitle">` rather than a pile of inline font styles.
 */

export type TextVariant = keyof typeof textStyles;
export type TextTone = 'ink' | 'muted' | 'faint' | 'onInk' | 'onInkMuted' | 'onPinkMuted' | 'danger' | 'inherit';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

const tones: Record<Exclude<TextTone, 'inherit'>, string> = {
  ink: colors.ink,
  muted: colors.inkMuted,
  faint: colors.inkFaint,
  onInk: colors.onInk,
  onInkMuted: colors.alpha.onInkMuted,
  onPinkMuted: colors.alpha.onPinkMuted,
  danger: colors.danger,
};

export function Text({
  variant = 'bodyText',
  tone = 'ink',
  color,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        textStyles[variant](),
        tone !== 'inherit' && { color: color ?? tones[tone] },
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/**
 * Bold run inside a sentence. The API returns copy with an `emphasis`
 * substring rather than markup, so `Emphasis` renders that span inline.
 */
export function Emphasis({ children, style, ...rest }: RNTextProps & { children: React.ReactNode }) {
  return (
    <RNText style={[emphasisStyles.bold, style]} {...rest}>
      {children}
    </RNText>
  );
}

const emphasisStyles = StyleSheet.create({
  bold: { fontWeight: '700' },
});

/**
 * Splits `body` around `emphasis` and renders the matched span bold. Used by
 * assistant cards, notifications and timeline rows, which all ship copy in that
 * shape. Returns the plain string when there's no match.
 */
export function RichText({
  body,
  emphasis,
  variant = 'bodySm',
  tone = 'ink',
  style,
  ...rest
}: Omit<TextProps, 'children'> & { body: string; emphasis?: string }) {
  if (!emphasis || !body.includes(emphasis)) {
    return (
      <Text variant={variant} tone={tone} style={style} {...rest}>
        {body}
      </Text>
    );
  }

  const [before, ...after] = body.split(emphasis);

  return (
    <Text variant={variant} tone={tone} style={style} {...rest}>
      {before}
      <Emphasis>{emphasis}</Emphasis>
      {after.join(emphasis)}
    </Text>
  );
}

/** Multi-span variant, for the Ask answer which bolds several fragments. */
export function RichTextMulti({
  body,
  emphasis = [],
  variant = 'bodySm',
  tone = 'ink',
  style,
  ...rest
}: Omit<TextProps, 'children'> & { body: string; emphasis?: string[] }) {
  if (emphasis.length === 0) {
    return (
      <Text variant={variant} tone={tone} style={style} {...rest}>
        {body}
      </Text>
    );
  }

  // Build a splitter that keeps the delimiters, so the bold runs survive.
  const escaped = emphasis.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = body.split(pattern);

  return (
    <Text variant={variant} tone={tone} style={style} {...rest}>
      {parts.map((part, index) =>
        emphasis.includes(part) ? <Emphasis key={`${part}-${index}`}>{part}</Emphasis> : part,
      )}
    </Text>
  );
}
