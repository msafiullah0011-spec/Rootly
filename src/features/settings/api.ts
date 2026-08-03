import { endpoints } from '@/api/endpoints';
import { del, get, patch, post } from '@/api/http';
import {
  connectedAccountListSchema,
  connectedAccountSchema,
  settingsSchema,
  userSchema,
  type AccentNameValue,
  type AppSettings,
} from '@/api/schemas';

/** Endpoint functions for settings, the profile and connected accounts. */

export function fetchSettings(signal?: AbortSignal) {
  return get(endpoints.settings.get, { schema: settingsSchema, signal });
}

export function fetchProfile(signal?: AbortSignal) {
  return get(endpoints.auth.profile, { schema: userSchema, signal });
}

export interface ProfileInput {
  name: string;
  email: string;
  accent: AccentNameValue;
}

export function updateProfile(input: Partial<ProfileInput>) {
  return patch(endpoints.auth.profile, input, { schema: userSchema });
}

export function updateSettings(input: Partial<AppSettings>) {
  return patch(endpoints.settings.update, input, { schema: settingsSchema });
}

export function fetchConnectedAccounts(signal?: AbortSignal) {
  return get(endpoints.settings.connectedAccounts, { schema: connectedAccountListSchema, signal });
}

/**
 * Stands where the provider's OAuth consent screen will go. The real
 * implementation hands `expo-auth-session` the provider and posts the resulting
 * code here; the response shape is the same either way.
 */
export function connectAccount(accountId: string) {
  return post(endpoints.settings.connectAccount(accountId), {}, { schema: connectedAccountSchema });
}

export function disconnectAccount(accountId: string) {
  return del(endpoints.settings.disconnectAccount(accountId), { schema: connectedAccountSchema });
}
