'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Star, Clock, ChevronLeft, ChevronRight,
  Filter, SlidersHorizontal, X, Award,
} from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

const SPECS = [
  { value: 'listing_optimization',  en: 'Listing Optimization',  ar: 'تحسين الإعلان' },
  { value: 'pricing_strategy',      en: 'Pricing Strategy',       ar: 'استراتيجية التسعير' },
  { value: 'interior_design',       en: 'Interior Design',        ar: 'التصميم الداخلي' },
  { value: 'guest_experience',      en: 'Guest Experience',       ar: 'تجربة الضيوف' },
  { value: 'photography',           en: 'Photography',            ar: 'التصوير' },
  { value: 'superhost_coaching',    en: 'Superhost Coaching',     ar: 'تدريب المضيف المتميز' },
  { value: 'property_management',   en: 'Property Management',    ar: 'إدارة العقارات' },
  { value: 'revenue_management',    en: 'Revenue Management',     ar: 'إدارة الإيرادات' },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function ConsultantCard({ consultant, locale, isAr }: { consultant: any; locale: string; isAr: boolean }) {
  const avatar = consultant.user?.avatar
    ? `${BACKEND_URL}${consultant.user.avatar}`
    : null;
  const specs: string[] = consultant.specializations ?? [];
  const specLabel = (v: string) => SPECS.find((s) => s.value === v)?.[isAr ? 'ar' : 'en'] ?? v;

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/${locale}/consultations/${consultant.id}`}
        className="group flex flex-col rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-rose-100 to-rose-200">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={consultant.displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-rose-500">
                {consultant.displayName?.[0] ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-neutral-900 group-hover:text-rose-600 transition truncate">
                {consultant.displayName}
              </p>
              {consultant.isFeatured && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                  <Award className="h-2.5 w-2.5" /> Featured
                </span>
              )}
            </div>
            {Number(consultant.avgRating) > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-neutral-700">{Number(consultant.avgRating).toFixed(1)}</span>
                <span className="text-xs text-neutral-400">({consultant.reviewCount} reviews)</span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-neutral-900">{Number(consultant.hourlyRate).toLocaleString()}</p>
            <p className="text-xs text-neutral-500">{consultant.currency}/hr</p>
          </div>
        </div>

        {/* Bio */}
        {consultant.bio && (
          <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{consultant.bio}</p>
        )}

        {/* Specializations */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {specs.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
              {specLabel(s)}
            </span>
          ))}
          {specs.length > 3 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              +{specs.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between pt-3 border-t border-neutral-50">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Clock className="h-3 w-3" />
            {consultant.yearsExperience} yrs exp
          </div>
          <span className="text-xs font-semibold text-rose-500 group-hover:underline">
            {isAr ? 'عرض الملف' : 'View Profile'} →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ConsultationMarketplacePage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['consultants-browse', spec, minRating, maxPrice, page],
    queryFn: () =>
      consultationsApi.getConsultants({
        page,
        limit: 12,
        specialization: spec || undefined,
        minRating: minRating ? Number(minRating) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      } as any),
    keepPreviousData: true,
  } as any);

  const d = data as any;
  const consultants: any[] = d?.data ?? [];
  const total: number = d?.total ?? 0;
  const totalPages: number = d?.totalPages ?? 1;

  const clearFilters = useCallback(() => {
    setSpec(''); setMinRating(''); setMaxPrice(''); setPage(1);
  }, []);

  const hasFilters = spec || minRating || maxPrice;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-600 to-rose-800 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isAr ? 'خبراء الضيافة — استشر أفضل المتخصصين' : 'Hospitality Experts — Book a Consultation'}
          </h1>
          <p className="text-rose-100 mb-8 text-sm sm:text-base">
            {isAr
              ? 'تواصل مع خبراء معتمدين في إدارة العقارات والتسعير والتصميم والمزيد'
              : 'Connect with certified experts in property management, pricing, design, and more'}
          </p>

          {/* Search + filter row */}
          <div className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث عن خبير...' : 'Search experts...'}
                className="w-full rounded-xl bg-white/10 border border-white/20 pl-9 pr-4 py-2.5 text-sm text-white placeholder-rose-200 focus:outline-none focus:bg-white/20"
                onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'rounded-xl border px-3.5 py-2.5 transition flex items-center gap-1.5 text-sm font-medium',
                hasFilters
                  ? 'bg-white text-rose-600 border-white'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isAr ? 'تصفية' : 'Filters'}
              {hasFilters && <span className="rounded-full bg-rose-600 text-white text-xs px-1.5 py-0.5">●</span>}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 max-w-xl mx-auto bg-white rounded-2xl p-4 shadow-lg text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {isAr ? 'التخصص' : 'Specialization'}
                  </label>
                  <select
                    value={spec}
                    onChange={(e) => { setSpec(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  >
                    <option value="">{isAr ? 'الكل' : 'All'}</option>
                    {SPECS.map((s) => (
                      <option key={s.value} value={s.value}>{isAr ? s.ar : s.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {isAr ? 'تقييم لا يقل عن' : 'Min Rating'}
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  >
                    <option value="">{isAr ? 'أي تقييم' : 'Any'}</option>
                    {[4, 4.5, 5].map((r) => (
                      <option key={r} value={r}>⭐ {r}+</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {isAr ? 'السعر الأقصى (EGP/ساعة)' : 'Max Price (EGP/hr)'}
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    placeholder="e.g. 1000"
                    className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-2 flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700">
                  <X className="h-3 w-3" /> {isAr ? 'مسح الفلاتر' : 'Clear filters'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Spec chip strip */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => { setSpec(''); setPage(1); }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition',
              !spec ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-rose-300',
            )}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          {SPECS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setSpec(spec === s.value ? '' : s.value); setPage(1); }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition',
                spec === s.value
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-rose-300',
              )}
            >
              {isAr ? s.ar : s.en}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-neutral-500 mb-4">
          {isLoading ? '...' : `${total} ${isAr ? 'خبير متاح' : 'experts available'}`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          </div>
        ) : consultants.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-lg">
              {isAr ? 'لا يوجد خبراء مطابقون' : 'No experts match your filters'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-rose-500 hover:underline">
                {isAr ? 'مسح الفلاتر' : 'Clear filters'}
              </button>
            )}
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {consultants.map((c: any) => (
              <ConsultantCard key={c.id} consultant={c} locale={locale} isAr={isAr} />
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-neutral-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Become consultant CTA */}
        <div className="mt-14 rounded-2xl bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 px-8 py-8 text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {isAr ? 'هل أنت خبير في الضيافة؟' : 'Are you a hospitality expert?'}
          </h2>
          <p className="text-sm text-neutral-600 mb-4">
            {isAr
              ? 'انضم إلى شبكة الخبراء وشارك معرفتك لتحقيق دخل إضافي'
              : 'Join our expert network and share your knowledge to earn extra income'}
          </p>
          <Link
            href={`/${locale}/consultations/become-a-consultant`}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition"
          >
            {isAr ? 'ابدأ الآن' : 'Get Started'}
          </Link>
        </div>
      </div>
    </div>
  );
}
