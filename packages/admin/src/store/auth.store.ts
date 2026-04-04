import { create } from 'zustand';

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isActive: boolean;
}

interface AuthState {
  user: AdminUser | null;
  _hasHydrated: boolean;
  login: (user: AdminUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  _hasHydrated: false,

  login: (user) => {
    if (typeof window !== 'undefined') {
      // Token is stored in httpOnly cookie set by the backend.
      // Only non-sensitive user info lives in localStorage.
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user');
    }
    set({ user: null });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('admin_user');
      const user = raw ? (JSON.parse(raw) as AdminUser) : null;
      set({ user: user?.isAdmin ? user : null, _hasHydrated: true });
    } else {
      set({ _hasHydrated: true });
    }
  },
}));
