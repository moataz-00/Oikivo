'use client';

import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface ComingSoonProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function ComingSoon({
  title,
  description,
  backHref,
  backLabel,
}: ComingSoonProps) {
  const locale = useLocale();
  const t = useTranslations('comingSoon');
  const href = backHref ?? `/${locale}`;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
        <Rocket className="h-10 w-10 text-rose-500" strokeWidth={1.5} />
      </div>

      <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">
        {title ?? t('title')}
      </h1>

      <p className="mb-8 max-w-sm text-base text-gray-500">{description ?? t('description')}</p>

      <div className="flex items-center gap-3">
        <Link
          href={href}
          className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          {backLabel ?? t('goHome')}
        </Link>
      </div>
    </div>
  );
}
