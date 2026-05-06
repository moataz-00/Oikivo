'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle, ShieldCheck, Phone } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function HostActivationRequestPage() {
  const locale = useLocale();
  const t = useTranslations('hosting');
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
      <div className="min-h-[70vh] flex items-center justify-center px-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900">{t('activationVerificationRequired')}</h1>
          <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{verificationNeeded}</p>

          <div className="mt-6 space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push(`/${locale}/account/verification`)}
            >
              <Phone className="me-2 h-4 w-4" />
              {t('activationGoToVerification')}
            </Button>
            <button
              onClick={() => setVerificationNeeded(null)}
              className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              {t('activationBack')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        {sent ? (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-teal-600" />
            <h1 className="mt-4 text-2xl font-semibold text-neutral-900">{t('activationCheckInbox')}</h1>
            <p className="mt-3 text-neutral-600">
              {t('activationCheckInboxDesc')}
            </p>
            <p className="mt-4 text-sm text-neutral-400">{t('activationSpamNote')}</p>
          </>
        ) : (
          <>
            <Mail className="mx-auto h-14 w-14 text-teal-600" />
            <h1 className="mt-4 text-2xl font-semibold text-neutral-900">{t('activationTitle')}</h1>
            <p className="mt-3 text-neutral-600">
              {t('activationDesc')}
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => requestActivation.mutate()}
              disabled={requestActivation.isPending}
            >
              {requestActivation.isPending ? t('activationSending') : t('activationSendEmail')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
