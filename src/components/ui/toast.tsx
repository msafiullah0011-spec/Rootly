import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

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
 */

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

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, dismissToast]);

  const tone = toneConfig[toast.tone];

  return (
    <Animated.View entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)}>
      <Pressable
        onPress={() => dismissToast(toast.id)}
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
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
              dismissToast(toast.id);
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
