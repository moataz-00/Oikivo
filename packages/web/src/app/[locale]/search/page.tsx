'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

function RedirectContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  useEffect(() => {
    router.replace(`/${locale}/s?${searchParams.toString()}`);
  }, []);
  return null;
}

export default function SearchRedirect() {
  return (
    <Suspense>
      <RedirectContent />
    </Suspense>
  );
}