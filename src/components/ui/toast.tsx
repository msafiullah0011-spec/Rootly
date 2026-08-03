import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icons, STROKE_HEAVY } from '@/components/icons';
import { useUiStore, type Toast as ToastModel } from '@/store/ui.store';
import { colors, radii, shadows, spacing } from '@/theme';
import { IconBubble } from './icon-bubble';
import { Text } from './text';

/**
 * Toast host. Mounted once in the root layout.
 *
 * Styled after the add-flow's confirmation banner: an ink card with a leading
 * status circle and optional inline actions. Toasts drop from the top so they
 * don't collide with the floating tab bar or a pinned CTA.
 *
 * A toast leaves the way it arrived — upward. It can be flicked away, tapped
 * away, or left to time out, and all three run the same exit, so dismissing one
 * never looks like a different thing from it expiring. The animation is driven
 * by shared values rather than `entering` / `exiting` layout animations,
 * because a layout animation would snap the card back to its resting transform
 * before playing, undoing whatever drag the finger had just left it at.
 */

/** How far up the card travels on its way out — past the safe area, offscreen. */
const EXIT_OFFSET = -160;
/** Drag past this, or flick faster than the velocity below, and it goes. */
const DISMISS_DISTANCE = -12;
const DISMISS_VELOCITY = -600;

export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + spacing.base }]}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: ToastModel }) {
  const dismissToast = useUiStore((state) => state.dismissToast);

  const translateY = useSharedValue(-24);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);
  /**
   * Guards against a tap landing on top of the timeout, or a second flick.
   * A shared value rather than a ref because the gesture reads it from the UI
   * thread, where a ref would only ever be the snapshot taken at mount.
   */
  const leaving = useSharedValue(false);

  const remove = useCallback(() => dismissToast(toast.id), [dismissToast, toast.id]);

  const hide = useCallback(() => {
    if (leaving.value) return;
    leaving.value = true;

    opacity.value = withTiming(0, { duration: 170 });
    translateY.value = withTiming(
      EXIT_OFFSET,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(remove)();
      },
    );
  }, [leaving, opacity, translateY, remove]);

  // Slide in, then start the clock. Re-running would restart both, so this is
  // deliberately mount-only — a toast's id never changes under it.
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });

    const timer = setTimeout(hide, toast.durationMs);
    return () => clearTimeout(timer);
  }, [hide, toast.durationMs, opacity, scale, translateY]);

  /**
   * Up is free, down is rubber-banded: the toast has nowhere to go downward, and
   * a card that follows the finger into the status bar reads as broken.
   */
  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((event) => {
      if (leaving.value) return;
      translateY.value =
        event.translationY < 0 ? event.translationY : event.translationY * 0.2;
    })
    .onEnd((event) => {
      if (leaving.value) return;
      if (translateY.value < DISMISS_DISTANCE || event.velocityY < DISMISS_VELOCITY) {
        runOnJS(hide)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const tone = toneConfig[toast.tone];

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle} layout={LinearTransition.duration(200)}>
        <Pressable
          onPress={hide}
          accessibilityRole="alert"
          accessibilityLabel={toast.message}
          accessibilityHint="Tap or swipe up to dismiss"
          style={styles.toast}
        >
          <IconBubble
            icon={tone.icon}
            backgroundColor={tone.background}
            color={colors.onInk}
            size={34}
            iconSize={18}
            strokeWidth={STROKE_HEAVY}
          />

          <Text variant="label" tone="onInk" style={styles.message} numberOfLines={3}>
            {toast.message}
          </Text>

          {toast.action ? (
            <Pressable
              onPress={() => {
                toast.action?.onPress();
                hide();
              }}
              accessibilityRole="button"
              accessibilityLabel={toast.action.label}
              hitSlop={8}
            >
              <Text variant="labelStrong" color={colors.brand}>
                {toast.action.label}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const toneConfig = {
  success: { icon: Icons.check, background: colors.accents.green },
  error: { icon: Icons.close, background: colors.accents.red },
  info: { icon: Icons.sparkles, background: colors.brand },
} as const;

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing['3xl'],
    right: spacing['3xl'],
    gap: spacing.sm,
    zIndex: 100,
    // Android orders overlapping siblings by elevation before draw order, so
    // without this the toast can end up under a screen that has its own.
    elevation: 24,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.ink,
    borderRadius: radii.row,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    ...shadows.toast,
  },
  message: { flex: 1 },
});
