'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { FullPageSpinner } from '@/components/ui/Spinner';

/**
 * Landing page after Google OAuth redirect.
 * The backend sends: /en/auth/callback?accessToken=...&refreshToken=...&user=...
 *
 * IMPORTANT: We parse window.location.search directly instead of using Next.js
 * useSearchParams() because the latter can return empty params during the
 * initial hydration cycle, which caused a redirect to /login before the real
 * params were available.
 */
export default function AuthCallbackPage() {
  const login = useAuthStore((s) => s.login);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Parse directly from the browser URL — always available synchronously
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userRaw = params.get('user');

    if (!accessToken || !userRaw) {
      window.location.replace('/en/login?error=google_failed');
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      // Store tokens synchronously before any navigation
      login(user, accessToken, refreshToken ?? undefined);
      // Hard navigate to home — avoids any Next.js router race conditions
      window.location.replace('/en');
    } catch {
      window.location.replace('/en/login?error=google_failed');
    }
  }, [login]);

  return <FullPageSpinner />;
}
