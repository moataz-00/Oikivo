'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle, ShieldCheck, Phone } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function HostActivationRequestPage() {
  const locale = useLocale();
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState<string | null>(null);

  const requestActivation = useMutation({
    mutationFn: () => usersApi.requestHostActivation(locale as 'en' | 'ar'),
    onSuccess: () => {
      setSent(true);
    },
    onError: (err: any) => {
      const msg: string = err?.response?.data?.message ?? 'Failed to send activation email';
      // If the error is about phone/email verification, redirect to the verification gate
      const isVerificationError =
        msg.toLowerCase().includes('phone') ||
        msg.toLowerCase().includes('verified') ||
        msg.toLowerCase().includes('mobile') ||
        msg.toLowerCase().includes('email verif');
      if (isVerificationError) {
        setVerificationNeeded(msg);
      } else {
        toast.error(msg);
      }
    },
  });

  // ── Verification gate screen ──────────────────────────────────────────────
  if (verificationNeeded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900">Verification required</h1>
          <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{verificationNeeded}</p>

          <div className="mt-6 space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push(`/${locale}/account/verification`)}
            >
              <Phone className="mr-2 h-4 w-4" />
              Go to verification settings
            </Button>
            <button
              onClick={() => setVerificationNeeded(null)}
              className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        {sent ? (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-teal-600" />
            <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Check your inbox</h1>
            <p className="mt-3 text-neutral-600">
              We've sent you an activation link. Click it to activate your hosting account.
              The link expires in 24 hours.
            </p>
            <p className="mt-4 text-sm text-neutral-400">Didn't receive it? Check your spam folder.</p>
          </>
        ) : (
          <>
            <Mail className="mx-auto h-14 w-14 text-teal-600" />
            <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Activate hosting</h1>
            <p className="mt-3 text-neutral-600">
              We'll send an activation link to your email address. Click it to start hosting on
              Journey Stay.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => requestActivation.mutate()}
              disabled={requestActivation.isPending}
            >
              {requestActivation.isPending ? 'Sending…' : 'Send activation email'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
