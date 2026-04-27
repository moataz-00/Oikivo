'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ConfirmEmailChangePage() {
  const locale      = useLocale();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { logout }  = useAuth();
  const token       = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link. Please request a new one.');
      return;
    }

    authApi
      .confirmEmailChange(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email address has been updated successfully.');
        // Log out so the user authenticates with the new email
        logout();
        setTimeout(() => router.push(`/${locale}/login`), 3000);
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(
          err?.response?.data?.message ?? 'This confirmation link is invalid or has expired.',
        );
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 text-center">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-8">
          <span className="text-2xl font-bold text-brand">Oikivo</span>
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-brand mx-auto animate-spin" />
            <h1 className="mt-5 text-xl font-bold text-neutral-900">Confirming your new email…</h1>
            <p className="mt-2 text-sm text-neutral-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-neutral-900">Email updated!</h1>
            <p className="mt-2 text-sm text-neutral-500">{message}</p>
            <p className="mt-4 text-xs text-neutral-400">Redirecting you to login…</p>
            <Link
              href={`/${locale}/login`}
              className="mt-6 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Log in now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-neutral-900">Confirmation failed</h1>
            <p className="mt-2 text-sm text-neutral-500">{message}</p>
            <Link
              href={`/${locale}/account`}
              className="mt-6 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Back to account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
