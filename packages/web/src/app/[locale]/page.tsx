'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Home, GraduationCap, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/Motion';
import { propertiesApi } from '@/lib/api';
import { cn } from '@/lib/utils';


const SECTIONS = [
  { key: 'cairo',    labelKey: 'topPicksCairo',        emoji: '🏙️', params: { city: 'Cairo',          limit: 10, sortBy: 'rating' } },
  { key: 'alex',     labelKey: 'topPicksAlexandria',   emoji: '🌊', params: { city: 'Alexandria',     limit: 10, sortBy: 'rating' } },
  { key: 'hurghada', labelKey: 'topPicksHurghada',     emoji: '🏖️', params: { city: 'Hurghada',       limit: 10, sortBy: 'rating' } },
  { key: 'sharm',    labelKey: 'topPicksSharm',        emoji: '🐠', params: { city: 'Sharm El Sheikh', limit: 10, sortBy: 'rating' } },
  { key: 'luxor',    labelKey: 'topPicksLuxor',        emoji: '🏛️', params: { city: 'Luxor',          limit: 10, sortBy: 'rating' } },
  { key: 'aswan',    labelKey: 'topPicksAswan',        emoji: '⛵', params: { city: 'Aswan',          limit: 10, sortBy: 'rating' } },
  { key: 'sinai',    labelKey: 'exploreSinai',         emoji: '🌄', params: { city: 'Dahab',          limit: 10, sortBy: 'rating' } },
  { key: 'gouna',    labelKey: 'elGounaRedSea',        emoji: '🌊', params: { city: 'El Gouna',       limit: 10, sortBy: 'rating' } },
  { key: 'value',      labelKey: 'bestValueStays',       emoji: '💰', params: {                          limit: 10, sortBy: 'price_asc'  } },
  { key: 'rated',      labelKey: 'highestRatedHomes',    emoji: '⭐', params: {                          limit: 10, sortBy: 'rating', minRating: 4.5 } },
  { key: 'instant',    labelKey: 'instantBookAvailable', emoji: '⚡', params: {                          limit: 10, instantBook: true } },
] as const;

function ScrollSection({
  label, emoji, properties, isLoading, seeAllHref, isFirst = false,
}: {
  label: string; emoji: string; properties: any[]; isLoading: boolean; seeAllHref: string; isFirst?: boolean;
}) {
  const t = useTranslations('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });

  if (!isLoading && properties.length === 0) return null;

  return (
    <FadeIn className="py-2">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-neutral-900">{label}</h2>
        </div>
        <Link
          href={seeAllHref}
          className="flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
        >
          {t('seeAll')} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Scroll container */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-lg border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5 text-neutral-800" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[260px] sm:w-[290px]">
                  <div className="aspect-[4/3] rounded-2xl bg-neutral-200 animate-pulse" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
                  </div>
                </div>
              ))
            : properties.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="shrink-0 w-[260px] sm:w-[290px]"
                >
                  <PropertyCard property={p} priority={isFirst && i < 4} />
                </motion.div>
              ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-lg border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95"
        >
          <ChevronRight className="h-5 w-5 text-neutral-800" />
        </button>
      </div>
    </FadeIn>
  );
}

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'homes' | 'consultations') || 'homes';

  const setActiveTab = (tab: 'homes' | 'consultations') => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'homes') params.delete('tab');
    else params.set('tab', tab);
    const query = params.toString();
    router.push(`/${locale}${query ? `?${query}` : ''}`, { scroll: false });
  };

  const results = useQueries({
    queries: SECTIONS.map((s) => ({
      queryKey: ['home-section', s.key],
      queryFn: () => propertiesApi.searchProperties(s.params as any),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0c0a1e] pt-12 pb-24">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-brand/20 blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {([
              { id: 'homes' as const, Icon: Home, label: t('homes') },
              { id: 'consultations' as const, Icon: GraduationCap, label: t('consultations') },
            ]).map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200',
                  activeTab === id
                    ? 'bg-white text-neutral-900 shadow-lg'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Headline */}
          <div className="text-center mb-9">
            <motion.h1
              key={activeTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] mb-5 tracking-tight"
            >
              {activeTab === 'homes' ? t('heroTitle') : t('heroTitleConsultations')}
            </motion.h1>
            <motion.p
              key={`sub-${activeTab}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="text-indigo-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
            >
              {activeTab === 'homes' ? t('heroSubtitleHomes') : t('heroSubtitleConsultations')}
            </motion.p>
          </div>

          {/* Search card / Consultation CTA */}
          {activeTab === 'homes' ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="rounded-2xl bg-white shadow-2xl p-1.5"
              >
                <SearchBar />
              </motion.div>

              {/* Quick destination chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-6 flex items-center justify-center gap-2 flex-wrap"
              >
                <span className="text-white/40 text-xs font-medium mr-1">{t('explore')}</span>
                {[
                  { labelKey: 'cityCairo', city: 'Cairo', emoji: '🏙️' },
                  { labelKey: 'cityAlexandria', city: 'Alexandria', emoji: '🌊' },
                  { labelKey: 'cityHurghada', city: 'Hurghada', emoji: '🏖️' },
                  { labelKey: 'citySharm', city: 'Sharm El Sheikh', emoji: '🐠' },
                  { labelKey: 'cityLuxor', city: 'Luxor', emoji: '🏛️' },
                  { labelKey: 'cityAswan', city: 'Aswan', emoji: '⛵' },
                  { labelKey: 'cityDahab', city: 'Dahab', emoji: '🌄' },
                  { labelKey: 'cityElGouna', city: 'El Gouna', emoji: '🌊' },
                ].map(({ labelKey, city, emoji }) => (
                  <Link
                    key={city}
                    href={`/${locale}/search?city=${encodeURIComponent(city)}`}
                    className="rounded-full border border-white/15 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium text-white/80 hover:text-white transition-all"
                  >
                    {emoji} {t(labelKey as any)}
                  </Link>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-sm"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                {isAr ? 'قريباً' : 'Coming Soon'}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                {isAr ? 'الاستشارات قادمة قريباً على موقع Oikivo' : 'Consultations are coming soon on the Oikivo website'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100 sm:text-base">
                {isAr
                  ? 'نعمل حالياً على تجهيز تجربة الاستشارات بالكامل. في الوقت الحالي، تصفح الإقامات واستخدم الموقع للحجوزات والاستضافة فقط.'
                  : 'We are still preparing the full consultations experience. For now, use the website for stays, bookings, and hosting only.'}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('homes')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-neutral-900 shadow-lg transition hover:bg-neutral-50"
                >
                  <Home className="h-4 w-4" />
                  {isAr ? 'العودة للإقامات' : 'Back to Stays'}
                </button>
                <Link
                  href={`/${locale}/hosting`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <ArrowRight className="h-4 w-4" />
                  {isAr ? 'استكشف الاستضافة' : 'Explore Hosting'}
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {[
                  isAr ? 'الحجوزات' : 'Bookings',
                  isAr ? 'الاستضافة' : 'Hosting',
                  isAr ? 'الرسائل' : 'Messaging',
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Scrollable sections ── */}
      <div className="py-8 space-y-10 bg-white">
        {activeTab === 'homes' && SECTIONS.map((s, i) => {
          const res = results[i];
          const props = (res.data as any)?.data ?? [];
          const city = (s.params as any).city;
          const seeAllHref = city
            ? `/${locale}/search?city=${encodeURIComponent(city)}`
            : `/${locale}/search`;
          return (
            <ScrollSection
              key={s.key}
              label={t(s.labelKey as any)}
              emoji={s.emoji}
              properties={props}
              isLoading={res.isLoading}
              seeAllHref={seeAllHref}
              isFirst={i === 0}
            />
          );
        })}
        {activeTab === 'consultations' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-16 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <GraduationCap className="h-8 w-8 text-rose-500" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-neutral-900">
                {isAr ? 'الاستشارات غير متاحة حالياً' : 'Consultations are not live yet'}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                {isAr
                  ? 'تم إيقاف جميع الصفحات المتعلقة بالمستشارين مؤقتاً حتى يتم إطلاق التجربة الكاملة بشكل رسمي على الموقع.'
                  : 'All consultant-related pages are temporarily held in a coming-soon state until the full experience is ready to launch on the website.'}
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('homes')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Home className="h-4 w-4" />
                  {isAr ? 'تصفح الإقامات' : 'Browse stays'}
                </button>
                <Link
                  href={`/${locale}/hosting`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400"
                >
                  <ArrowRight className="h-4 w-4" />
                  {isAr ? 'الانتقال إلى الاستضافة' : 'Go to hosting'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Trust stats ── */}
      <section className="py-12 bg-white border-t border-neutral-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { stat: '150K+', desc: t('staysBooked') },
              { stat: '4.8★', desc: t('averageRatingStat') },
              { stat: '0%', desc: t('hostCommissionStat') },
              { stat: '48+', desc: t('citiesCovered') },
            ].map(({ stat, desc }) => (
              <div key={desc}>
                <p className="text-3xl font-display font-bold text-brand">{stat}</p>
                <p className="text-sm text-neutral-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-neutral-50 border-t border-neutral-200 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">{t('forGuests')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900">{t('bookIn3Steps')}</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: t('searchFilterTitle'), desc: t('searchFilterDesc'), icon: '🔍' },
              { step: '02', title: t('bookInstantlyTitle'), desc: t('bookInstantlyDesc'), icon: '✅' },
              { step: '03', title: t('checkInTitle'), desc: t('checkInDesc'), icon: '🏡' },
            ].map(({ step, title, desc, icon }) => (
              <StaggerItem key={step}>
                <div className="relative rounded-3xl bg-white border border-neutral-200 p-8 hover:shadow-md transition-shadow">
                  <span className="text-4xl mb-4 block">{icon}</span>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">{t('step')} {step}</p>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Become a host CTA ── */}
      <section className="py-20 relative overflow-hidden bg-[#0c0a1e] text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-brand/20 blur-[100px]" />
          <div className="absolute -bottom-20 left-0 w-96 h-96 rounded-full bg-indigo-300/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 border border-brand/30 px-4 py-1.5 text-sm font-bold text-indigo-200 mb-6">
                  🎉 {t('zeroCommissionBadge')}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5 leading-tight">
                  {t('hostCTATitle')}
                </h2>
                <p className="text-indigo-100 text-base mb-8 leading-relaxed">
                  {t('hostCTADesc')}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/${locale}/hosting/become-a-host`}
                    className="rounded-xl bg-white text-brand-dark px-8 py-4 text-sm font-bold hover:bg-neutral-50 transition-colors shadow-xl"
                  >
                    🏠 {t('startHostingFree')}
                  </Link>
                  <Link
                    href={`/${locale}/experiences`}
                    className="rounded-xl border border-white/25 text-white px-8 py-4 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    🎭 {t('exploreExperiencesCTA')}
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '💸', stat: '0%', desc: t('hostCommissionStat'), highlight: true },
                  { icon: '⚡', stat: '24h', desc: t('fastPayouts'), highlight: false },
                  { icon: '🛡️', stat: '100%', desc: t('hostProtection'), highlight: false },
                  { icon: '📱', stat: '24/7', desc: t('support'), highlight: false },
                ].map(({ icon, stat, desc, highlight }) => (
                  <div
                    key={desc}
                    className={cn(
                      'rounded-2xl p-5 text-center border backdrop-blur',
                      highlight ? 'bg-white text-brand-dark border-white' : 'bg-white/10 text-white border-white/15'
                    )}
                  >
                    <div className="text-2xl mb-1.5">{icon}</div>
                    <div className={cn('text-2xl font-bold', highlight ? 'text-brand' : 'text-white')}>{stat}</div>
                    <div className={cn('text-xs mt-0.5', highlight ? 'text-neutral-500' : 'text-indigo-200')}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
