import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Icons, STROKE, STROKE_HEAVY, type IconComponent } from '@/components/icons';
import { alpha, colors, layout, radii, shadows, spacing } from '@/theme';

/**
 * The floating pill navigation from the handoff.
 *
 * Five slots: Home, Recent (clock), the raised pink FAB, Spaces (grid) and
 * Settings. The FAB is not a tab — it opens the quick-add sheet — so it sits
 * between the second and third tab routes and is rendered separately.
 *
 * Geometry: 66px tall, inset 20px each side, 26px above the bottom (plus the
 * safe-area inset), radius 999, `0 6px 24px rgba(0,0,0,.1)`. The 58px FAB is
 * lifted 30px above the bar.
 */

const TAB_ICONS: Record<string, IconComponent> = {
  index: Icons.home,
  timeline: Icons.clock,
  spaces: Icons.grid,
  settings: Icons.settings,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  timeline: 'Recent',
  spaces: 'Spaces',
  settings: 'Settings',
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Split the routes either side of the centre FAB.
  const left = state.routes.slice(0, 2);
  const right = state.routes.slice(2);

  const renderTab = (route: BottomTabBarProps['state']['routes'][number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const Icon = TAB_ICONS[route.name] ?? Icons.folder;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (focused || event.defaultPrevented) return;
      void Haptics.selectionAsync();
      navigation.navigate(route.name, route.params);
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={TAB_LABELS[route.name] ?? route.name}
        hitSlop={12}
        style={styles.tab}
      >
        <Icon size={24} color={focused ? colors.ink : colors.inkMuted} strokeWidth={STROKE} />
      </Pressable>
    );
  };

  const openQuickAdd = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/quick-add');
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: layout.navBottom + insets.bottom }]}
    >
      <View style={styles.bar}>
        {left.map(renderTab)}

        <Pressable
          onPress={openQuickAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a link"
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Icons.plus size={26} color={colors.ink} strokeWidth={STROKE_HEAVY} />
        </Pressable>

        {right.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: layout.navInset,
    right: layout.navInset,
  },
  bar: {
    height: layout.navHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['6xl'],
    backgroundColor: colors.screen,
    borderWidth: 1,
    borderColor: alpha.hairline,
    borderRadius: radii.pill,
    ...shadows.nav,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: layout.navHeight,
    width: 32,
  },
  fab: {
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    // Raises the button above the bar, as in the design.
    marginTop: -layout.fabLift,
    ...shadows.fab,
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
});
