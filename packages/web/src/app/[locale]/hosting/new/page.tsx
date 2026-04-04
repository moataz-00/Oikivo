'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CHOICES = [
  {
    id: 'home',
    icon: Home,
    emoji: '🏠',
    title: 'List a home',
    description: 'Rent out your spare room, apartment, villa, or any unique space to guests looking for a place to stay.',
    cta: 'Start listing your home',
    gradient: 'from-neutral-50 to-neutral-100',
    border: 'border-neutral-200 hover:border-neutral-400',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-700',
    ctaClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    pathSuffix: 'listing',
  },
  {
    id: 'experience',
    icon: Compass,
    emoji: '🎭',
    title: 'Host an experience',
    description: 'Share your passion, skill, or local knowledge by hosting a unique activity for guests from around the world.',
    cta: 'Create an experience',
    gradient: 'from-neutral-50 to-neutral-100',
    border: 'border-neutral-200 hover:border-neutral-400',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-700',
    ctaClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    pathSuffix: 'experience',
  },
];

export default function HostingNewChoicePage() {
  const locale = useLocale();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={`/${locale}/hosting`}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mb-12 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
            What would you like to host?
          </h1>
          <p className="text-neutral-500 text-base sm:text-lg max-w-xl mx-auto">
            Choose the type of listing you want to create and we&apos;ll guide you through the setup.
          </p>
        </motion.div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CHOICES.map((choice, i) => {
            const Icon = choice.icon;
            const href = choice.id === 'home' ? listingHref : experienceHref;
            return (
              <motion.div
                key={choice.id}
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
                      {choice.emoji} {choice.title}
                    </h2>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {choice.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className={`inline-flex items-center justify-between w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${choice.ctaClass}`}>
                    <span>{choice.cta}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
          You can always add more listings later from your hosting dashboard.
        </motion.p>
      </div>
    </div>
  );
}
