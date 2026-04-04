'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    hydrate();
    // Refresh user from server so fields like isConsultant, isHost are always current
    const token = localStorage.getItem('access_token');
    if (token) {
      apiClient.get('/auth/me').then((res) => {
        setUser(res.data);
      }).catch(() => {/* ignore — user stays as-is if request fails */});
    }
  }, [hydrate, setUser]);

  return <>{children}</>;
}
