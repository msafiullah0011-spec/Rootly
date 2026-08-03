import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
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
 *
 * The active tab sits on a sand pill that springs across to it. Its position
 * comes from each tab's measured centre rather than arithmetic on the padding,
 * so it stays honest if the bar's spacing or slot count ever changes. The row
 * carries the padding and the bar itself carries none, which keeps the
 * indicator's absolute coordinates and the tabs' `onLayout` in one frame of
 * reference.
 */

const INDICATOR_SIZE = 40;
const INDICATOR_SPRING = { damping: 18, stiffness: 180, mass: 0.6 } as const;

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

  const indicatorX = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  /** Tab centres, keyed by route, in the row's coordinate space. */
  const centers = useRef<Record<string, number>>({});
  /** The first placement snaps; every one after it springs. */
  const placed = useRef(false);

  const placeIndicator = useCallback(
    (key: string) => {
      const center = centers.current[key];
      if (center === undefined) return;

      const target = center - INDICATOR_SIZE / 2;
      if (placed.current) {
        indicatorX.value = withSpring(target, INDICATOR_SPRING);
      } else {
        placed.current = true;
        indicatorX.value = target;
        indicatorOpacity.value = withTiming(1, { duration: 220 });
      }
    },
    [indicatorOpacity, indicatorX],
  );

  const activeKey = state.routes[state.index]?.key;

  useEffect(() => {
    if (activeKey) placeIndicator(activeKey);
  }, [activeKey, placeIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ translateX: indicatorX.value }, { translateY: -INDICATOR_SIZE / 2 }],
  }));

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

    // Layout arrives after the first render, so the active tab places the
    // indicator again here — the effect above ran with nothing to measure.
    const onLayout = (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      centers.current[route.key] = x + width / 2;
      if (focused) placeIndicator(route.key);
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        onLayout={onLayout}
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
        <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />

        <View style={styles.row}>
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
    backgroundColor: colors.screen,
    borderWidth: 1,
    borderColor: alpha.hairline,
    borderRadius: radii.pill,
    ...shadows.nav,
  },
  // Holds the padding so the bar's own box stays the indicator's origin.
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['6xl'],
  },
  indicator: {
    position: 'absolute',
    left: 0,
    // Centred by the translateY below, so it ignores the bar's border inset.
    top: '50%',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.sand,
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
