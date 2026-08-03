import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp,
  type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { alpha, colors, radii, screenPadding, shadows, spacing } from '@/theme';

/**
 * Bottom sheet with a stacked scrim.
 *
 * The add-flow layers two scrims — a warm `#3A332A` at 55% under a
 * `rgba(0,0,0,.28)` — which is what gives the backdrop its brown cast rather
 * than a flat grey. Reproduced faithfully here.
 *
 * Two things a sheet pinned to the bottom of the screen has to survive:
 *
 * - **The keyboard.** Sheets hold inputs (the quick-add pills, the new-shelf
 *   name) and land exactly where the keyboard opens. `KeyboardAvoidingView`
 *   isn't enough here: Android runs edge-to-edge, so the window never resizes
 *   and the keyboard simply covers the sheet. `useAnimatedKeyboard` reports the
 *   real height on both platforms and drives the lift on the UI thread, so the
 *   sheet rides the keyboard's own curve instead of jumping after it.
 * - **Its own height.** A menu with six rows, or a picker grid, can outgrow the
 *   screen. The sheet is capped below the status bar and anything past that
 *   scrolls, so content can never run off the top edge.
 */

export interface SheetProps {
  children: React.ReactNode;
  onDismiss: () => void;
  /** Content rendered above the sheet, e.g. the add-flow's confirmation toast. */
  overlay?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Breathing room left between the top of a full-height sheet and the status bar. */
const TOP_CLEARANCE = spacing['5xl'];
/** Gap between the content and the keyboard once it's up. */
const KEYBOARD_GAP = spacing.xl;

export function Sheet({ children, onDismiss, overlay, style }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboard = useAnimatedKeyboard();

  const restingBottom = insets.bottom + spacing['8xl'];
  const maxHeight = windowHeight - insets.top - TOP_CLEARANCE;

  /**
   * Lifting is a transform, not a margin, so it stays off the layout thread.
   * The strip it uncovers at the bottom of the screen is exactly the keyboard's
   * own height, so the keyboard covers it.
   */
  const liftStyle = useAnimatedStyle(() => {
    const lift = keyboard.height.value;
    return {
      transform: [{ translateY: -lift }],
      paddingBottom: Math.max(restingBottom - lift, KEYBOARD_GAP),
      maxHeight: maxHeight - lift,
    };
  });

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.scrimWarm} />
          <View style={styles.scrimDark} />
        </Pressable>
      </Animated.View>

      {overlay ? (
        <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + spacing.base }]}>
          {overlay}
        </View>
      ) : null}

      {/*
        Entrance and lift live on separate views: a layout animation drives the
        transform of the view it's attached to, so sharing one with the
        keyboard's animated style would have them fighting over it.
      */}
      <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(200)}>
        <Animated.View style={[styles.sheet, liftStyle, style]}>
          <View style={styles.grabber} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrimWarm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha.scrimWarm,
    opacity: 0.55,
  },
  scrimDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha.scrimDark,
  },
  overlay: {
    position: 'absolute',
    left: spacing['3xl'],
    right: spacing['3xl'],
  },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.lg,
    paddingHorizontal: screenPadding.sheet,
    ...shadows.sheet,
  },
  // Grows only as far as its content, shrinks when the cap bites.
  scroll: { flexGrow: 0, flexShrink: 1 },
  // Room for a focus ring or an error line on the last field.
  scrollContent: { paddingBottom: 2 },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: alpha.grabber,
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
});
