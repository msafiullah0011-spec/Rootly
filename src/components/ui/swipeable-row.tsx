import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Icons, STROKE, type IconComponent } from '@/components/icons';
import { colors, radii, spacing } from '@/theme';
import { IconButton } from './icon-button';

/**
 * Swipe-to-reveal row, used by the shelf's link cards.
 *
 * The handoff shows the card translated 84px left over a red underlay carrying
 * archive and move actions. Dragging past half that distance snaps open; a flick
 * opens or closes based on velocity.
 */

const REVEAL_WIDTH = 84;
const SNAP_THRESHOLD = REVEAL_WIDTH / 2;
const VELOCITY_THRESHOLD = 500;

export interface SwipeAction {
  icon: IconComponent;
  label: string;
  onPress: () => void;
}

export interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  /** Renders already-open, for the design's demo state. */
  initiallyOpen?: boolean;
  enabled?: boolean;
  radius?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function SwipeableRow({
  children,
  actions,
  initiallyOpen = false,
  enabled = true,
  radius = radii.card,
  backgroundColor = colors.accents.red,
  style,
}: SwipeableRowProps) {
  const translateX = useSharedValue(initiallyOpen ? -REVEAL_WIDTH : 0);
  const startX = useSharedValue(0);

  const notifyOpen = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    // Let vertical scrolling win until the drag is clearly horizontal.
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      // Clamp: no dragging past the actions, and only a little rubber-band right.
      translateX.value = Math.min(0, Math.max(-REVEAL_WIDTH, next));
    })
    .onEnd((event) => {
      const shouldOpen =
        event.velocityX < -VELOCITY_THRESHOLD ||
        (event.velocityX < VELOCITY_THRESHOLD && translateX.value < -SNAP_THRESHOLD);

      if (shouldOpen) {
        if (translateX.value > -REVEAL_WIDTH) runOnJS(notifyOpen)();
        translateX.value = withSpring(-REVEAL_WIDTH, { damping: 20, stiffness: 220 });
      } else {
        translateX.value = withTiming(0, { duration: 180 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const close = () => {
    translateX.value = withTiming(0, { duration: 180 });
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.underlay, { borderRadius: radius, backgroundColor }]}>
        {actions.map((action) => (
          <IconButton
            key={action.label}
            icon={action.icon}
            accessibilityLabel={action.label}
            onPress={() => {
              close();
              action.onPress();
            }}
            size={32}
            iconSize={22}
            color={colors.onInk}
            backgroundColor="transparent"
            bordered={false}
            strokeWidth={STROKE}
          />
        ))}
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Default archive + move actions, matching the design. */
export const defaultSwipeActions = (options: {
  onArchive: () => void;
  onMove: () => void;
}): SwipeAction[] => [
  { icon: Icons.archive, label: 'Archive', onPress: options.onArchive },
  { icon: Icons.move, label: 'Move', onPress: options.onMove },
];

const styles = StyleSheet.create({
  container: { position: 'relative' },
  underlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing['4xl'],
    paddingRight: spacing['5xl'],
  },
});
