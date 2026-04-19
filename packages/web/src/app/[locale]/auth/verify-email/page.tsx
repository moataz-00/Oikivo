'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function VerifyEmailPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please request a new one.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        // Redirect to verification page after 3 s
        setTimeout(() => router.push(`/${locale}/account/verification`), 3000);
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(
          err?.response?.data?.message ?? 'This verification link is invalid or has expired.',
        );
      });
  }, [token, locale, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 text-center">
        {/* Brand mark */}
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-8">
          <span className="text-2xl font-bold text-brand">Oikivo</span>
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-brand mx-auto animate-spin" />
            <h1 className="mt-5 text-xl font-bold text-neutral-900">Verifying your email…</h1>
            <p className="mt-2 text-sm text-neutral-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-neutral-900">Email verified!</h1>
            <p className="mt-2 text-sm text-neutral-500">{message}</p>
            <p className="mt-4 text-xs text-neutral-400">Redirecting you automatically…</p>
            <Link
              href={`/${locale}/account/verification`}
              className="mt-6 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Go to verification
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-neutral-900">Verification failed</h1>
            <p className="mt-2 text-sm text-neutral-500">{message}</p>
            <Link
              href={`/${locale}/account/verification`}
              className="mt-6 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
