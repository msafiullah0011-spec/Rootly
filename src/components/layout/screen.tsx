import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing, tabBarClearance } from '@/theme';

/**
 * Screen container.
 *
 * Handles the cream background, safe-area insets and the extra bottom padding
 * that keeps content clear of the floating tab bar. Screens should never apply
 * their own top padding — the header sits under the status bar inset.
 */

export interface ScreenProps {
  children: React.ReactNode;
  /** Horizontal padding. 20 by default; onboarding uses 24, auth 28. */
  padding?: number;
  /** Adds bottom padding for the floating tab bar. */
  hasTabBar?: boolean;
  /** Extra bottom padding, for screens with a pinned footer CTA. */
  bottomInset?: number;
  scroll?: boolean;
  /** Vertically centres content — the auth and empty-home layouts. */
  centered?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: Partial<ScrollViewProps>;
  testID?: string;
}

export function Screen({
  children,
  padding = screenPadding.default,
  hasTabBar = false,
  bottomInset = 0,
  scroll = true,
  centered = false,
  onRefresh,
  refreshing = false,
  backgroundColor = colors.screen,
  style,
  contentStyle,
  scrollProps,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const paddingBottom =
    insets.bottom + bottomInset + (hasTabBar ? tabBarClearance : spacing['3xl']);

  const contentPadding: ViewStyle = {
    paddingTop: insets.top + spacing.sm,
    paddingHorizontal: padding,
    paddingBottom,
  };

  if (!scroll) {
    return (
      <View style={[styles.container, { backgroundColor }, style]} testID={testID}>
        <View style={[contentPadding, styles.flex, centered && styles.centered, contentStyle]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]} testID={testID}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          contentPadding,
          centered && styles.centeredContent,
          contentStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.inkMuted}
              colors={[colors.ink]}
            />
          ) : undefined
        }
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { justifyContent: 'center' },
  centeredContent: { flexGrow: 1, justifyContent: 'center' },
});
