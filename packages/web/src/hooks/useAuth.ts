'use client';

import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHostMode = useAuthStore((s) => s.isHostMode);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const toggleHostMode = useAuthStore((s) => s.toggleHostMode);

  const isLoggedIn = !!accessToken && !!user;
  const hasHostRole =
    isLoggedIn &&
    (['host', 'hotel_manager', 'agent', 'admin'] as UserRole[]).includes(user!.role);
  const hasHostFlag = isLoggedIn && Boolean((user as any)?.isHost);
  const isHost = hasHostRole || hasHostFlag;
  const isAdmin = isLoggedIn && user!.role === 'admin';
  const isConsultant = isLoggedIn && Boolean((user as any)?.isConsultant);
  const canToggleHostMode = isHost;

  return {
    user,
    accessToken,
    isHostMode,
    hasHydrated,
    isLoggedIn,
    isHost,
    isAdmin,
    isConsultant,
    canToggleHostMode,
    login,
    logout,
    setUser,
    toggleHostMode,
  };
}
