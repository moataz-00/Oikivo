import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { setMemoryToken } from '../lib/api';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'oikivo_access_token';
const USER_KEY = 'oikivo_user';

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHostMode: boolean;
  isHydrated: boolean;

  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  toggleHostMode: () => void;
  hydrate: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isHostMode: false,
  isHydrated: false,

  login: async (user: User, token: string) => {
    // Persist to SecureStore
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
    } catch (e) {
      console.warn('[AuthStore] Failed to persist auth data:', e);
    }

    // Keep in-memory token in sync for the Axios interceptor
    setMemoryToken(token);

    set({ user, accessToken: token, isHostMode: false });
  },

  logout: async () => {
    // Clear SecureStore
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch (e) {
      console.warn('[AuthStore] Failed to clear auth data:', e);
    }

    // Clear in-memory token
    setMemoryToken(null);

    set({ user: null, accessToken: null, isHostMode: false });
  },

  setUser: (user: User) => {
    set({ user });
    // Fire-and-forget persist
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(() => {});
  },

  toggleHostMode: () => {
    const { user, isHostMode } = get();
    if (!user || !user.isHost) return;
    set({ isHostMode: !isHostMode });
  },

  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        setMemoryToken(token);
        set({ user, accessToken: token });
      }
    } catch (e) {
      console.warn('[AuthStore] Hydration failed:', e);
    } finally {
      set({ isHydrated: true });
    }
  },
}));
