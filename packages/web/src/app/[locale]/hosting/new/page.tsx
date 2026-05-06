'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CHOICE_IDS = ['home', 'experience'] as const;

const CHOICE_META = {
  home: {
    icon: Home,
    emoji: '🏠',
    gradient: 'from-neutral-50 to-neutral-100',
    border: 'border-neutral-200 hover:border-neutral-400',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-700',
    ctaClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    pathSuffix: 'listing',
  },
  experience: {
    icon: Compass,
    emoji: '🎭',
    gradient: 'from-neutral-50 to-neutral-100',
    border: 'border-neutral-200 hover:border-neutral-400',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-700',
    ctaClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    pathSuffix: 'experience',
  },
};

export default function HostingNewChoicePage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const t = useTranslations('hostingNew');
  const router = useRouter();
  const { user, isLoggedIn, isHost, hasHydrated } = useAuth();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) {
      router.replace(`/${locale}/login?redirect=/${locale}/hosting/new`);
    } else if (!isHost) {
      router.replace(`/${locale}/hosting/become-a-host`);
    }
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  if (!hasHydrated || !user?.isHost) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const listingHref = `/${locale}/hosting/listings/new`;
  const experienceHref = `/${locale}/hosting/experiences/new`;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={`/${locale}/hosting`}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-10"
        >
          <BackIcon className="h-4 w-4" />
          {t('back')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mb-12 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-neutral-500 text-base sm:text-lg max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CHOICE_IDS.map((id, i) => {
            const choice = CHOICE_META[id];
            const Icon = choice.icon;
            const href = id === 'home' ? listingHref : experienceHref;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <Link
                  href={href}
                  className={`group flex flex-col h-full rounded-3xl border-2 bg-gradient-to-br ${choice.gradient} ${choice.border} p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${choice.iconBg} flex items-center justify-center mb-6`}>
                    <Icon className={`h-7 w-7 ${choice.iconColor}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 mb-8">
                    <h2 className="text-xl font-bold text-neutral-900 mb-3">
                      {choice.emoji} {t(`${id}Title` as any)}
                    </h2>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {t(`${id}Desc` as any)}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className={`inline-flex items-center justify-between w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${choice.ctaClass}`}>
                    <span>{t(`${id}Cta` as any)}</span>
                    <ForwardIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Help note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center text-xs text-neutral-400"
        >
          {t('helpNote')}
        </motion.p>
      </div>
    </div>
  );
}
