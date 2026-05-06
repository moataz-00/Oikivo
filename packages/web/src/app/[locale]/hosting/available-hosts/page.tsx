'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { UserSearch, Clock } from 'lucide-react';

export default function ComingSoonPage() {
  const locale = useLocale();
  const t = useTranslations('hosting');
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50 shadow-inner">
        <UserSearch className="h-10 w-10 text-violet-400" strokeWidth={1.5} />
      </div>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
        <Clock className="h-3.5 w-3.5" />
        {t('availableHostsBadge')}
      </div>
      <h1 className="mt-1 text-2xl font-bold text-neutral-900">{t('availableHostsTitle')}</h1>
      <p className="mt-3 max-w-sm text-sm text-neutral-500 leading-relaxed">
        {t('availableHostsDesc')}
      </p>
      <Link
        href={`/${locale}/hosting`}
        className="mt-8 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        {t('backToDashboard')}
      </Link>
    </div>
  );
}
