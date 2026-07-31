import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { logger } from './logger';

/**
 * Two storage surfaces:
 *
 * - `secureStorage` for auth tokens (Keychain / Keystore). expo-secure-store has
 *   no web implementation, so web falls back to AsyncStorage — acceptable for
 *   dev, and flagged loudly here so nobody ships it as-is.
 * - `appStorage` for non-sensitive preferences and cache.
 *
 * Every method swallows failures and returns null. Storage being unavailable
 * should degrade the app, never crash it.
 */

const isWeb = Platform.OS === 'web';

if (isWeb && __DEV__) {
  logger.warn('expo-secure-store is unavailable on web — tokens fall back to AsyncStorage.');
}

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return isWeb ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.warn(`secureStorage.get("${key}") failed`, error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      if (isWeb) await AsyncStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.warn(`secureStorage.set("${key}") failed`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (isWeb) await AsyncStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.warn(`secureStorage.remove("${key}") failed`, error);
    }
  },
};

export const appStorage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      logger.warn(`appStorage.get("${key}") failed`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.warn(`appStorage.set("${key}") failed`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.warn(`appStorage.remove("${key}") failed`, error);
    }
  },
};

/** Namespaced keys, so nothing collides and everything is greppable. */
export const storageKeys = {
  accessToken: 'rootly.auth.accessToken',
  refreshToken: 'rootly.auth.refreshToken',
  user: 'rootly.auth.user',
  onboardingComplete: 'rootly.onboarding.complete',
  activeWorkspace: 'rootly.workspace.active',
} as const;
