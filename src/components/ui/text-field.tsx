import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icons, STROKE, STROKE_BOLD, type IconComponent } from '@/components/icons';
import { alpha, colors, radii, spacing, text } from '@/theme';
import { Text } from './text';

/**
 * Labelled text input.
 *
 * The handoff's fields are a white box with a 1px border, radius 16, an
 * optional leading icon, and a 12px muted label above. `error` swaps the border
 * to red and shows the message underneath — that path is fed by the API's
 * `fieldErrors`, so server-side validation lands on the right field.
 */

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: IconComponent;
  /** Trailing element — the password eye toggle, a chevron, an inline button. */
  trailing?: React.ReactNode;
  error?: string;
  hint?: string;
  radius?: number;
  containerStyle?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  /** Renders the value with a semibold weight, as filled fields do. */
  strong?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    icon: Icon,
    trailing,
    error,
    hint,
    radius = radii.input,
    containerStyle,
    fieldStyle,
    strong = false,
    multiline,
    ...inputProps
  },
  ref,
) {
  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="meta" tone="muted" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            borderRadius: radius,
            borderColor: error ? colors.danger : alpha.border,
            alignItems: multiline ? 'flex-start' : 'center',
          },
          multiline && styles.multilineField,
          fieldStyle,
        ]}
      >
        {Icon ? <Icon size={16} color={colors.inkMuted} strokeWidth={STROKE} /> : null}

        <TextInput
          ref={ref}
          style={[styles.input, strong && styles.inputStrong, multiline && styles.multilineInput]}
          placeholderTextColor={colors.inkFaint}
          multiline={multiline}
          accessibilityLabel={label}
          {...inputProps}
        />

        {trailing}
      </View>

      {error ? (
        <Text variant="meta" tone="danger" style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="meta" tone="muted" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

/**
 * Read-only field that behaves like a select — the Root and Shelf pickers on
 * the manual add form. Renders as a field box with a trailing chevron.
 *
 * It's a `Pressable`, not a `View` with a touch handler: `onTouchEnd` never
 * fires on web and is swallowed by any scroll gesture on native, which is what
 * made these two fields look dead.
 */
export function SelectField({
  label,
  value,
  onPress,
  trailing,
  leading,
  error,
  /** Renders the field in its open state, matching the chevron's direction. */
  expanded = false,
  containerStyle,
}: {
  label?: string;
  value: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
  error?: string;
  expanded?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="meta" tone="muted" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value}` : value}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [
          styles.field,
          styles.selectField,
          { borderColor: error ? colors.danger : expanded ? colors.ink : alpha.border },
          pressed && styles.selectPressed,
        ]}
      >
        <View style={styles.selectValue}>
          {leading}
          <Text variant="bodySmStrong" numberOfLines={1}>
            {value}
          </Text>
        </View>
        {trailing}
      </Pressable>

      {error ? (
        <Text variant="meta" tone="danger" style={styles.message}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export interface SelectOption {
  id: string;
  label: string;
  /** A status dot or icon bubble shown before the label. */
  leading?: React.ReactNode;
  meta?: string;
}

/**
 * The list a `SelectField` opens.
 *
 * Rendered in the flow underneath the field rather than in an overlay: these
 * fields sit on a scrolling form, and a floating menu would need to track the
 * field's position through every scroll and keyboard change for no gain.
 */
export function SelectOptions({
  options,
  selectedId,
  onSelect,
  emptyLabel = 'Nothing to choose from yet.',
  style,
}: {
  options: SelectOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  emptyLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (options.length === 0) {
    return (
      <View style={[styles.optionSheet, styles.optionEmpty, style]}>
        <Text variant="meta" tone="muted">
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.optionSheet, style]}>
      {options.map((option, index) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}${selected ? ', selected' : ''}`}
            style={({ pressed }) => [
              styles.optionRow,
              index > 0 && styles.optionDivider,
              pressed && styles.selectPressed,
            ]}
          >
            {option.leading}

            <View style={styles.optionText}>
              <Text variant="bodySmStrong" numberOfLines={1}>
                {option.label}
              </Text>
              {option.meta ? (
                <Text variant="micro" tone="muted" numberOfLines={1}>
                  {option.meta}
                </Text>
              ) : null}
            </View>

            {selected ? (
              <Icons.check size={17} color={colors.ink} strokeWidth={STROKE_BOLD} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm, marginHorizontal: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radii.input,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  selectField: {
    borderRadius: radii.input,
    justifyContent: 'space-between',
  },
  selectPressed: { opacity: 0.75 },
  selectValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  multilineField: {
    minHeight: 72,
    paddingTop: spacing.lg,
  },
  input: {
    flex: 1,
    ...text.bodySm(),
    color: colors.ink,
    // RN adds vertical padding to inputs on Android; the box already has it.
    paddingVertical: 0,
    minWidth: 0,
  },
  inputStrong: { ...text.bodySmStrong() },
  multilineInput: {
    ...text.bodySm(),
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  message: { marginTop: spacing.xs, marginHorizontal: 2 },

  optionSheet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.border,
    borderRadius: radii.input,
    overflow: 'hidden',
  },
  optionEmpty: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  optionDivider: { borderTopWidth: 1, borderTopColor: alpha.hairline },
  optionText: { flex: 1, minWidth: 0 },
});
