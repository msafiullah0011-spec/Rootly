import { useRouter } from 'expo-router';
import { StyleSheet, View, type StyleProp,
  type ViewStyle } from 'react-native';

import { Icons } from '@/components/icons';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { layout, spacing } from '@/theme';

/**
 * Push-navigation header: a circular back button, a centred title (with an
 * optional status line), and an optional trailing action.
 *
 * The design uses two layouts — a centred title with a matching-width spacer on
 * the right (root detail, invite), and a left-aligned title beside the back
 * button (shelf links). `align` picks between them.
 */

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: React.ReactNode;
  /** Element rendered between the back button and the title (a shelf's icon). */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  align?: 'center' | 'left';
  onBack?: () => void;
  showBack?: boolean;
  /** Uses an X instead of a chevron — the modal variant. */
  closeIcon?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  subtitle,
  leading,
  trailing,
  align = 'center',
  onBack,
  showBack = true,
  closeIcon = false,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.container, style]}>
      {showBack ? (
        <IconButton
          icon={closeIcon ? Icons.close : Icons.chevronLeft}
          onPress={handleBack}
          accessibilityLabel={closeIcon ? 'Close' : 'Go back'}
          iconSize={20}
        />
      ) : (
        <View style={styles.spacer} />
      )}

      {align === 'left' ? (
        <View style={styles.leftGroup}>
          {leading}
          <View style={styles.leftText}>
            {title ? (
              <Text variant="navTitle" numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle}
          </View>
        </View>
      ) : (
        <View style={styles.centerGroup}>
          {title ? (
            <Text variant="navTitle" align="center" numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle}
        </View>
      )}

      {trailing ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: spacing.lg,
  },
  leftText: { flex: 1 },
  // Keeps a centred title actually centred when there's no trailing action.
  spacer: { width: layout.headerButton, height: layout.headerButton },
});
