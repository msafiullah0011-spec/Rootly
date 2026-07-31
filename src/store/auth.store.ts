import { create } from 'zustand';

import { configureApiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { post } from '@/api/http';
import { sessionSchema, type Session, type User } from '@/api/schemas';
import { logger } from '@/lib/logger';
import { secureStorage, storageKeys } from '@/lib/storage';

/**
 * Session state and token lifecycle.
 *
 * Tokens live in the keychain, never in AsyncStorage, and never in a query
 * cache. The store also supplies the API client's auth bridge (see
 * `configureApiClient` at the bottom), which is what lets a 401 trigger exactly
 * one refresh across any number of concurrent requests.
 */

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True when the user has no roots yet and should see onboarding. */
  needsOnboarding: boolean;

  /** Reads persisted tokens on boot. Always resolves. */
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => void;
  /** Internal: called by the API client when a 401 can't be recovered. */
  clearSession: () => void;
}

async function persistSession(session: Session) {
  await Promise.all([
    secureStorage.set(storageKeys.accessToken, session.accessToken),
    secureStorage.set(storageKeys.refreshToken, session.refreshToken),
    secureStorage.set(storageKeys.user, JSON.stringify(session.user)),
  ]);
}

async function clearPersistedSession() {
  await Promise.all([
    secureStorage.remove(storageKeys.accessToken),
    secureStorage.remove(storageKeys.refreshToken),
    secureStorage.remove(storageKeys.user),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  refreshToken: null,
  needsOnboarding: false,

  restore: async () => {
    set({ status: 'restoring' });

    const [accessToken, refreshToken, rawUser] = await Promise.all([
      secureStorage.get(storageKeys.accessToken),
      secureStorage.get(storageKeys.refreshToken),
      secureStorage.get(storageKeys.user),
    ]);

    if (!accessToken || !refreshToken || !rawUser) {
      set({ status: 'unauthenticated', user: null, accessToken: null, refreshToken: null });
      return;
    }

    try {
      const user = JSON.parse(rawUser) as User;
      set({ status: 'authenticated', user, accessToken, refreshToken });
    } catch (error) {
      // Corrupt payload — safer to sign out than to run with a half-session.
      logger.warn('Stored user payload was unreadable; signing out', error);
      await clearPersistedSession();
      set({ status: 'unauthenticated', user: null, accessToken: null, refreshToken: null });
    }
  },

  signIn: async (email, password) => {
    const session = await post(endpoints.auth.signIn, { email, password }, { schema: sessionSchema, skipAuth: true });
    await persistSession(session);
    set({
      status: 'authenticated',
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      needsOnboarding: session.needsOnboarding,
    });
  },

  signUp: async (email, password) => {
    const session = await post(endpoints.auth.signUp, { email, password }, { schema: sessionSchema, skipAuth: true });
    await persistSession(session);
    set({
      status: 'authenticated',
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      needsOnboarding: session.needsOnboarding,
    });
  },

  signOut: async () => {
    // Fire-and-forget: a failed sign-out call must not keep the user trapped
    // in the app, so local state is cleared regardless.
    try {
      await post(endpoints.auth.signOut, {}, { schema: sessionSchema.partial(), retries: 0 });
    } catch (error) {
      logger.debug('Sign-out request failed; clearing local session anyway', error);
    }
    await clearPersistedSession();
    set({
      status: 'unauthenticated',
      user: null,
      accessToken: null,
      refreshToken: null,
      needsOnboarding: false,
    });
  },

  completeOnboarding: () => set({ needsOnboarding: false }),

  clearSession: () => {
    void clearPersistedSession();
    set({
      status: 'unauthenticated',
      user: null,
      accessToken: null,
      refreshToken: null,
      needsOnboarding: false,
    });
  },
}));

/**
 * Hands the API client the three things it needs to manage auth headers and
 * refresh, without the client importing this store (which would be circular).
 */
configureApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,

  refreshSession: async () => {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return null;

    try {
      const session = await post(
        endpoints.auth.refresh,
        { refreshToken },
        { schema: sessionSchema, skipAuth: true, retries: 0 },
      );
      await persistSession(session);
      useAuthStore.setState({
        status: 'authenticated',
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      return session.accessToken;
    } catch (error) {
      logger.warn('Token refresh failed', error);
      return null;
    }
  },

  onUnauthenticated: () => {
    useAuthStore.getState().clearSession();
  },
});
