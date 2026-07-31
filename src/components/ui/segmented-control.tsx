import { Pressable, StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { IconComponent } from '@/components/icons';
import { alpha, colors, radii, spacing } from '@/theme';
import { Text } from './text';

/**
 * Two-up segmented control.
 *
 * Three variants appear in the handoff:
 *  - `track`  — sand track with an ink pill (Auth's Log in / Sign up, Timeline's Personal / Team)
 *  - `tiles`  — side-by-side rounded tiles (Invite's Can edit / Can view)
 */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconComponent;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'track' | 'tiles';
  /** The auth toggle gives its inactive segment a white bordered background. */
  outlinedInactive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'track',
  outlinedInactive = false,
  style,
}: SegmentedControlProps<T>) {
  const isTiles = variant === 'tiles';

  const handleChange = (next: T) => {
    if (next === value) return;
    void Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View
      style={[isTiles ? styles.tilesContainer : styles.trackContainer, style]}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        const foreground = active ? colors.onInk : colors.inkMuted;

        return (
          <Pressable
            key={option.value}
            onPress={() => handleChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              isTiles ? styles.tile : styles.segment,
              active
                ? isTiles
                  ? styles.tileActive
                  : styles.segmentActive
                : outlinedInactive
                  ? styles.segmentOutlined
                  : isTiles
                    ? styles.tileInactive
                    : null,
              pressed && styles.pressed,
            ]}
          >
            {option.icon ? (
              <option.icon size={15} color={foreground} strokeWidth={1.7} />
            ) : null}
            <Text variant={isTiles ? 'labelStrong' : 'rowTitle'} color={foreground}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trackContainer: {
    flexDirection: 'row',
    backgroundColor: colors.sand,
    borderRadius: radii.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingVertical: 11,
  },
  segmentActive: { backgroundColor: colors.ink },
  segmentOutlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.borderStrong,
    // Compensate for the border so both segments keep the same height.
    paddingVertical: 10,
  },

  tilesContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.tile,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
  },
  tileActive: { backgroundColor: colors.ink },
  tileInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.border,
  },

  pressed: { opacity: 0.8 },
});
