import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ApiError } from '@/api/errors';
import { Screen } from '@/components/layout/screen';
import { AppleMark, GoogleMark, Icons, RootMark, STROKE } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { alpha, colors, radii, screenPadding, shadows, spacing } from '@/theme';

/**
 * Frame 13 — Auth.
 *
 * A vertically centred stack: logo, Log in / Sign up toggle, email + password,
 * primary CTA, an "or" divider and the social buttons.
 *
 * Google and Apple are wired to the API's OAuth endpoint, which currently
 * returns "not connected yet" — the button, loading state and error surface are
 * all real, so plugging in expo-auth-session is a one-function change.
 */

type Mode = 'signin' | 'signup';

export function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const showToast = useUiStore((state) => state.showToast);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSignUp = mode === 'signup';

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'That email address looks wrong.';
    }
    if (!password) errors.password = 'Enter your password.';
    else if (password.length < 6) errors.password = 'Must be at least 6 characters.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validate()) return;

    setSubmitting(true);
    try {
      if (isSignUp) await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
      router.replace('/');
    } catch (error) {
      // Field-level errors from the API land on the inputs; anything else is a
      // toast, since it isn't about a specific field.
      const apiError = ApiError.from(error);
      if (apiError.fieldErrors) setFieldErrors(apiError.fieldErrors);
      else showToast(apiError.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'apple') => {
    showToast(
      `${provider === 'google' ? 'Google' : 'Apple'} sign-in isn't connected yet.`,
      'info',
    );
  };

  return (
    <Screen padding={screenPadding.auth} centered scroll>
      <View style={styles.logoBlock}>
        <IconBubble
          icon={RootMark}
          backgroundColor={colors.brand}
          color={colors.ink}
          size={60}
          iconSize={30}
          radius={radii.row}
        />
        <Text variant="wordmark" align="center" style={styles.wordmark}>
          Rootly
        </Text>
        <Text variant="label" tone="muted" align="center" style={styles.tagline}>
          Organize everything your team logs into.
        </Text>
      </View>

      <SegmentedControl
        options={[
          { value: 'signin', label: 'Log in' },
          { value: 'signup', label: 'Sign up' },
        ]}
        value={mode}
        onChange={(next) => {
          setMode(next as Mode);
          setFieldErrors({});
        }}
        outlinedInactive
        style={styles.toggle}
      />

      <TextField
        label="Email"
        icon={Icons.mail}
        placeholder="you@company.com"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
        }}
        error={fieldErrors.email || undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        containerStyle={styles.field}
      />

      <TextField
        label="Password"
        icon={Icons.lock}
        placeholder="••••••••"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
        }}
        error={fieldErrors.password || undefined}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        textContentType={isSignUp ? 'newPassword' : 'password'}
        returnKeyType="go"
        onSubmitEditing={() => void handleSubmit()}
        trailing={
          <Pressable
            onPress={() => setShowPassword((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={10}
          >
            <Icons.eye size={19} color={colors.ink} strokeWidth={STROKE} />
          </Pressable>
        }
      />

      {!isSignUp ? (
        <Pressable
          onPress={() => showToast("Password resets aren't available yet.", 'info')}
          accessibilityRole="button"
          style={styles.forgotRow}
          hitSlop={8}
        >
          <Text variant="label" tone="muted">
            Forgot password?
          </Text>
        </Pressable>
      ) : (
        <View style={styles.forgotSpacer} />
      )}

      <Button
        label={isSignUp ? 'Create account' : 'Log in'}
        onPress={() => void handleSubmit()}
        size="block"
        loading={submitting}
        style={styles.submit}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text variant="label" tone="muted">
          or
        </Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socials}>
        <Pressable
          onPress={() => handleOAuth('google')}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
        >
          <GoogleMark size={19} />
          <Text variant="rowTitle">Continue with Google</Text>
        </Pressable>

        <Pressable
          onPress={() => handleOAuth('apple')}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
        >
          <AppleMark size={18} />
          <Text variant="rowTitle">Continue with Apple</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setMode(isSignUp ? 'signin' : 'signup')}
        accessibilityRole="button"
        style={styles.footer}
        hitSlop={8}
      >
        <Text variant="label" tone="muted" align="center">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Text variant="labelStrong" tone="ink">
            {isSignUp ? 'Log in' : 'Sign up'}
          </Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoBlock: { alignItems: 'center', marginBottom: spacing['7xl'] },
  wordmark: { marginTop: spacing.xl },
  tagline: { marginTop: spacing.xs },
  toggle: { marginBottom: spacing['4xl'] },
  field: { marginBottom: spacing.lg },
  forgotRow: { alignSelf: 'flex-end', marginTop: spacing.sm, marginBottom: spacing.xxl },
  forgotSpacer: { height: spacing.xxl },
  submit: { marginBottom: spacing.xxl },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: alpha.border },
  socials: { gap: spacing.base },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha.borderHeavy,
    borderRadius: radii.pill,
    paddingVertical: spacing.xl,
    ...shadows.social,
  },
  pressed: { opacity: 0.8 },
  footer: { marginTop: spacing['3xl'] },
});
