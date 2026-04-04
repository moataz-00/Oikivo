import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHostMode: boolean;
  _hasHydrated: boolean;

  // Actions
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  toggleHostMode: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isHostMode: false,
  _hasHydrated: false,

  login: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      // refresh_token is managed via httpOnly cookie set by the backend
      // do NOT store it in localStorage (XSS risk)
      void refreshToken; // received for compat but unused client-side
    }
    set({ user, accessToken: token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('host_mode');
      // refresh_token cookie is cleared server-side by POST /auth/logout
    }
    set({ user: null, accessToken: null, isHostMode: false });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    set({ user });
  },

  toggleHostMode: () => {
    const next = !get().isHostMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('host_mode', String(next));
    }
    set({ isHostMode: next });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('access_token');
      const userRaw = localStorage.getItem('auth_user');
      const hostMode = localStorage.getItem('host_mode') === 'true';
      const user: User | null = userRaw ? JSON.parse(userRaw) : null;
      set({ user, accessToken: token, isHostMode: hostMode, _hasHydrated: true });
    } catch {
      set({ user: null, accessToken: null, isHostMode: false, _hasHydrated: true });
    }

    // Cross-tab sync: when another tab logs in or out, reflect it here
    window.addEventListener('storage', (event) => {
      if (event.key === 'access_token' || event.key === 'auth_user') {
        try {
          const token = localStorage.getItem('access_token');
          const userRaw = localStorage.getItem('auth_user');
          const user: User | null = userRaw ? JSON.parse(userRaw) : null;
          set({ user, accessToken: token });
        } catch { /* ignore parse errors */ }
      }
      if (event.key === 'host_mode') {
        set({ isHostMode: event.newValue === 'true' });
      }
    });
  },
}));
