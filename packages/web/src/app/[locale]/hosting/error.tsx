'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('title')}</h2>
      <p className="text-neutral-500 text-sm mb-6 max-w-md">
        {t('desc')}
      </p>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
