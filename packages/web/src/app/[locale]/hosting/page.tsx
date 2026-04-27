'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, ChevronRight,
  Sparkles, Rocket,
} from 'lucide-react';
import { bookingsApi, propertiesApi, payoutsApi } from '@/lib/api';
import { HostCalendar } from '@/components/hosting/HostCalendar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { NumberTicker } from '@/components/ui/Motion';
import { formatPrice, formatDate, getImageUrl } from '@/lib/utils';
import Image from 'next/image';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function HostDashboardPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();

  const { data: upcomingReservations, isLoading: resLoading } = useQuery({
    queryKey: ['host-reservations', 'upcoming'],
    queryFn: () => bookingsApi.getHostReservations('upcoming'),
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  const { data: pendingReservations } = useQuery({
    queryKey: ['host-reservations', 'pending'],
    queryFn: () => bookingsApi.getHostReservations('pending'),
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  const { data: listings } = useQuery({
    queryKey: ['host-listings'],
    queryFn: propertiesApi.getHostListings,
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const { data: earningsData } = useQuery({
    queryKey: ['earnings'],
    queryFn: payoutsApi.getEarnings,
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 60 * 1000,
  });

  const [dashTab, setDashTab] = useState<'properties' | 'calendar' | 'experiences'>('properties');

  const { data: allReservations = [] } = useQuery({
    queryKey: ['host-reservations', 'all'],
    queryFn: () => bookingsApi.getHostReservations(),
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ['host-pending-payments'],
    queryFn: bookingsApi.getHostPendingPayments,
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  if (!hasHydrated) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /></div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.1),transparent_40%),linear-gradient(180deg,#fff,rgba(245,247,244,0.92))]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="rounded-3xl border border-neutral-200 bg-white/90 p-8 sm:p-12 backdrop-blur"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t('notLoggedInBadge')}
            </motion.div>
            <motion.h1 variants={fadeUp} className="mt-5 max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 leading-tight">
              {t('notLoggedInTitle')}
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base sm:text-lg text-neutral-600 leading-relaxed">
              {t('notLoggedInDesc')}
            </motion.p>

            <motion.div variants={stagger} className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { emoji: '🚀', titleKey: 'featureLaunchTitle', descKey: 'featureLaunchDesc' },
                { emoji: '🔒', titleKey: 'featureProtectTitle', descKey: 'featureProtectDesc' },
                { emoji: '✅', titleKey: 'featureRunTitle', descKey: 'featureRunDesc' },
              ].map(({ emoji, titleKey, descKey }) => (
                <motion.div key={titleKey} variants={fadeUp} whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">{emoji}</span>
                  <p className="mt-3 text-sm font-semibold text-neutral-900">{t(titleKey as any)}</p>
                  <p className="mt-1 text-sm text-neutral-600">{t(descKey as any)}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={`/${locale}/login`}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
                {t('signInToHost')} →
              </Link>
              <Link href={`/${locale}/register`}
                className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
                {t('createListing')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.12),transparent_38%),radial-gradient(circle_at_100%_10%,rgba(245,158,11,0.12),transparent_36%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.section variants={fadeUp} className="rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Sparkles className="h-3.5 w-3.5" /> {t('nonHostBadge')}
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 leading-tight">
                {t('nonHostTitle')}
              </h1>
              <p className="mt-4 max-w-2xl text-neutral-600 leading-relaxed">
                {t('nonHostDesc')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={`/${locale}/hosting/become-a-host`}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
                  🚀 {t('becomeAHost')}
                </Link>
                <Link href={`/${locale}/hosting/become-a-host`}
                  className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
                  {t('learnMore')}
                </Link>
              </div>
            </motion.section>

            <motion.section variants={fadeUp} className="rounded-3xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">✨ {t('whatYouGet')}</h2>
              <div className="mt-4 space-y-3">
                {[
                  { emoji: '💰', key: 'featureRevenue' },
                  { emoji: '🗓️', key: 'featureReservations' },
                  { emoji: '💬', key: 'featureInbox' },
                  { emoji: '📅', key: 'featureCalendar' },
                ].map(({ emoji, key }) => (
                  <motion.div key={key} whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    className="flex items-center gap-2 rounded-xl bg-neutral-50 p-3">
                    <p className="text-sm text-neutral-700">{emoji} {t(key as any)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
    );
  }

  const earningsTotal = earningsData?.summary?.total ?? 0;
  const totalReviews = (listings ?? []).reduce((sum: number, l: any) => sum + ((l.reviewCount as number) ?? 0), 0);

  const stats = [
    { emoji: '💰', label: t('thisMonthEarnings'), value: formatPrice(earningsTotal, 'EGP'), numValue: earningsTotal, color: 'text-indigo-700 bg-indigo-50', border: 'border-indigo-100', href: `/${locale}/hosting/earnings` },
    { emoji: '🗓️', label: t('upcomingCheckins'), value: String(upcomingReservations?.length ?? 0), numValue: upcomingReservations?.length ?? 0, color: 'text-violet-700 bg-violet-50', border: 'border-violet-100', href: `/${locale}/hosting/reservations` },
    { emoji: '⏳', label: t('pendingRequests'), value: String(pendingReservations?.length ?? 0), numValue: pendingReservations?.length ?? 0, color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100', href: `/${locale}/hosting/reservations` },
    { emoji: '⭐', label: t('totalReviews'), value: String(totalReviews), numValue: totalReviews, color: 'text-violet-600 bg-violet-50', border: 'border-violet-100' },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.10),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.06),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">🏠 {t('dashboard')}</h1>
            <p className="mt-1 text-sm text-neutral-500">Your command center for listings, guests, and upcoming stays.</p>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href={`/${locale}/hosting/new`}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" />
              {t('createListing')}
            </Link>
          </motion.div>
        </motion.div>

        {/* Pending-payments alert banner */}
        {pendingPayments && pendingPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💳</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''} awaiting your confirmation
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review submitted InstaPay proofs and confirm receipt to release the reservation.
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/hosting/pending-payments`}
              className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
            >
              Review now →
            </Link>
          </motion.div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center border-b border-neutral-200 mb-8 -mt-2">
          {(['properties', 'calendar', 'experiences'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDashTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-semibold border-b-2 transition-all',
                dashTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              )}
            >
              {tab === 'properties' ? '🏠 Properties' : tab === 'calendar' ? '📅 Calendar' : '🎭 Experiences'}
            </button>
          ))}
        </div>

        {dashTab === 'properties' && (<>
        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map(({ emoji, label, value, numValue, color, border, href }) => {
            const el = (
              <motion.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`rounded-2xl border bg-white p-5 hover:shadow-md transition-all cursor-default ${border ?? 'border-neutral-200'}`}>
                <span className={`inline-flex rounded-xl p-2.5 mb-3 text-lg ${color}`}>{emoji}</span>
                <div className="text-2xl font-bold text-neutral-900 tabular-nums">
                  {typeof numValue === 'number' && numValue > 0 ? (
                    <NumberTicker value={numValue} className="font-bold text-2xl" />
                  ) : value}
                </div>
                <p className="text-xs text-neutral-500 mt-1">{label}</p>
              </motion.div>
            );
            return href ? (
              <Link key={label} href={href}>{el}</Link>
            ) : (
              <div key={label}>{el}</div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Upcoming reservations */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">🗓️ Upcoming check-ins</h2>
              <Link href={`/${locale}/hosting/reservations`}
                className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                View all →
              </Link>
            </div>
            {resLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : !upcomingReservations || upcomingReservations.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center">
                <p className="text-3xl mb-3">🌙</p>
                <p className="text-neutral-500 text-sm">{t('noUpcomingReservations')}</p>
                <p className="text-xs text-neutral-400 mt-1">New reservations will appear here</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                {upcomingReservations.slice(0, 5).map((res) => {
                  const coverImage = res.property.images?.[0]?.url;
                  return (
                    <motion.div key={res.id} variants={fadeUp} whileHover={{ x: 3, transition: { duration: 0.15 } }}
                      className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-sm transition-shadow">
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                        {coverImage && (
                          <Image src={getImageUrl(coverImage)} alt={res.property.title} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{res.property.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          📅 {formatDate(res.checkIn, 'MMM d')} – {formatDate(res.checkOut, 'MMM d')} · 👥 {res.guests} guest{res.guests > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar src={res.guest.avatar} firstName={res.guest.firstName} lastName={res.guest.lastName} size="sm" />
                        <Badge variant={res.status === 'confirmed' ? 'success' : 'warning'}>{res.status}</Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Quick actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">⚡ {t('quickActions')}</h2>
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
              {[
                { emoji: '🏠', label: t('listings'), href: `/${locale}/hosting/listings`, desc: `${listings?.length ?? 0} listings` },
                { emoji: '🗓️', label: t('reservations'), href: `/${locale}/hosting/reservations`, desc: `${pendingReservations?.length ?? 0} pending` },
                { emoji: '📊', label: 'Analytics', href: `/${locale}/hosting/analytics`, desc: 'Revenue & booking stats' },
                { emoji: <img src="https://flagcdn.com/24x18/eg.png" width={24} height={18} alt="Egypt" className="rounded-sm object-cover" />, label: 'Egypt Regulations', href: `/${locale}/hosting/regulations/egypt`, desc: 'Holiday Home License (MoTA)' },
                { emoji: '✨', label: t('createListing'), href: `/${locale}/hosting/new`, desc: 'Add a home or experience' },
              ].map(({ emoji, label, href, desc }, i, arr) => (
                <motion.div key={label} whileHover={{ backgroundColor: 'rgba(249,250,251,1)', x: 2 }}>
                  <Link href={href}
                    className={`flex items-center justify-between px-5 py-4 transition-colors ${i < arr.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{label}</p>
                        <p className="text-xs text-neutral-500">{desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        </>)}

        {dashTab === 'calendar' && (
          <HostCalendar reservations={allReservations} />
        )}

        {dashTab === 'experiences' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Rocket className="h-8 w-8 text-rose-400" strokeWidth={1.5} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-neutral-900">Experiences — Coming Soon</h3>
            <p className="max-w-sm text-sm text-neutral-500">
              The ability to host and manage experiences is launching soon. You'll be able to offer workshops, guided tours, and activities to travellers worldwide.
            </p>
          </div>
        )}


      </div>
    </div>
  );
}
