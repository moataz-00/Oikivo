'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function HostingActivationPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setUser } = useAuth();

  const confirmActivation = useMutation({
    mutationFn: (value: string) => usersApi.confirmHostActivation(value),
    onSuccess: (data) => {
      setUser(data.user);
      router.replace(`/${locale}/hosting/listings/new/structure`);
    },
  });

  useEffect(() => {
    if (!token) return;
    if (!confirmActivation.isPending && !confirmActivation.isSuccess && !confirmActivation.isError) {
      confirmActivation.mutate(token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Invalid activation link</h1>
          <p className="mt-3 text-neutral-600">This activation link is missing a token.</p>
          <Link
            href={`/${locale}/hosting/become-a-host`}
            className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to host setup
          </Link>
        </div>
      </div>
    );
  }

  if (confirmActivation.isPending) {
    return <FullPageSpinner />;
  }

  if (confirmActivation.isError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Activation failed</h1>
          <p className="mt-3 text-neutral-600">
            This link is invalid or expired. Request a new activation email and try again.
          </p>
          <Link
            href={`/${locale}/hosting/become-a-host`}
            className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Request new email
          </Link>
        </div>
      </div>
    );
  }

  return <FullPageSpinner />;
}
