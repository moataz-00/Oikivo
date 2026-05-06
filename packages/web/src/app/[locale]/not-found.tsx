'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');
  const locale = useLocale();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold text-neutral-200 select-none">404</p>
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">{t('title')}</h1>
      <p className="mt-2 text-neutral-500 max-w-sm text-sm">
        {t('desc')}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
