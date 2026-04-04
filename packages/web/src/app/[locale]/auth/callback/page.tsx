'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

/**
 * Landing page after Google OAuth redirect.
 * The backend sends: /en/auth/callback?accessToken=...&refreshToken=...&user=...
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const handled = useRef(false);

  useEffect(() => {
    // Guard against React 18 Strict Mode running effects twice
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userRaw = searchParams.get('user');

    if (!accessToken || !userRaw) {
      toast.error('Google sign-in failed. Please try again.');
      router.replace('/en/login');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      login(user, accessToken, refreshToken ?? undefined);
      toast.success(`Welcome, ${user.firstName}!`);
      router.replace('/en');
    } catch {
      toast.error('Something went wrong. Please try again.');
      router.replace('/en/login');
    }
  }, [searchParams, login, router]);

  return <FullPageSpinner />;
}
