import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ApiError } from '@/api/errors';
import type { AccentNameValue } from '@/api/schemas';
import { Screen } from '@/components/layout/screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { Icons, STROKE } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Text } from '@/components/ui/text';
import { initial } from '@/lib/format';
import { accentOrder, accents, colors, radii, spacing } from '@/theme';
import { useProfile, useUpdateProfile } from '../hooks';

/**
 * Settings → My profile.
 *
 * The account card on frame 9 is the entry point; this is what it opens. Name,
 * email and avatar colour are the three things the design actually renders
 * anywhere, so they're the three things this edits — everything else about the
 * account lives behind "Subscription & billing".
 */

export function ProfileScreen() {
  const router = useRouter();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();

  const user = profile.data;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [accent, setAccent] = useState<AccentNameValue>(user?.accent ?? 'lavender');
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Guards the fields from being overwritten by a refetch mid-edit. */
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!user || touched) return;
    setName(user.name);
    setEmail(user.email);
    setAccent(user.accent);
  }, [user, touched]);

  const edit = <T,>(setter: (value: T) => void, field: string) => (value: T) => {
    setTouched(true);
    setter(value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }));
  };

  const dirty =
    Boolean(user) && (name !== user?.name || email !== user?.email || accent !== user?.accent);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Give yourself a name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'That email address looks wrong.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    updateProfile.mutate(
      { name: name.trim(), email: email.trim(), accent },
      {
        onSuccess: () => {
          setTouched(false);
          router.back();
        },
        onError: (error) => {
          const apiError = ApiError.from(error);
          if (apiError.fieldErrors) setErrors(apiError.fieldErrors);
        },
      },
    );
  };

  return (
    <Screen bottomInset={72}>
      <ScreenHeader title="My profile" />

      <Card padding={spacing.xxl} style={styles.preview}>
        <Avatar initial={initial(name || '?')} accent={accent} size={56} />

        <View style={styles.previewText}>
          <Text variant="navTitle" numberOfLines={1}>
            {name || 'Your account'}
          </Text>
          <Text variant="label" tone="muted" numberOfLines={1}>
            {email || 'No email address yet'}
          </Text>
        </View>

        {user?.plan === 'pro' ? (
          <Badge label="Pro" background={colors.accents.yellow} color={colors.ink} />
        ) : null}
      </Card>

      <TextField
        label="Name"
        placeholder="Umar Farooq"
        value={name}
        onChangeText={edit(setName, 'name')}
        error={errors.name}
        strong
        containerStyle={styles.field}
      />

      <TextField
        label="Email"
        icon={Icons.mail}
        placeholder="umar@mystore.pk"
        value={email}
        onChangeText={edit(setEmail, 'email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.field}
      />

      <Text variant="meta" tone="muted" style={styles.label}>
        Avatar colour
      </Text>
      <View style={styles.swatches}>
        {accentOrder.map((option) => {
          const selected = option === accent;
          return (
            <Pressable
              key={option}
              onPress={() => edit<AccentNameValue>(setAccent, 'accent')(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option} avatar colour${selected ? ', selected' : ''}`}
              style={[
                styles.swatch,
                { backgroundColor: accents[option] },
                selected && styles.swatchSelected,
              ]}
            >
              {selected ? (
                <Icons.check size={18} color={colors.ink} strokeWidth={STROKE} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Save changes"
        onPress={handleSave}
        size="block"
        loading={updateProfile.isPending}
        disabled={!dirty}
        style={styles.save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['4xl'],
  },
  previewText: { flex: 1, minWidth: 0 },

  field: { marginBottom: spacing.xl },
  label: { marginHorizontal: 2, marginBottom: spacing.sm },

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 2, borderColor: colors.ink },

  save: { marginTop: spacing['4xl'] },
});
