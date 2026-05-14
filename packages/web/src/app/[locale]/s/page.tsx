'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, Map, X, MapPin, CalendarDays, Users, Search, Bookmark } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CategoryFilters } from '@/components/search/CategoryFilters';
import { FilterModal } from '@/components/search/FilterModal';
import { Spinner } from '@/components/ui/Spinner';
import { propertiesApi, savedSearchesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchPropertiesParams } from '@/types';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-neutral-100 rounded-xl flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  }
);

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('home');
  const tFilter = useTranslations('filter');
  const tCommon = useTranslations('common');
  const tSearch = useTranslations('search');
  const { isLoggedIn } = useAuth();
  const [savingSearch, setSavingSearch] = useState(false);

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<SearchPropertiesParams>({
    city: searchParams.get('city') ?? undefined,
    checkIn: searchParams.get('checkIn') ?? undefined,
    checkOut: searchParams.get('checkOut') ?? undefined,
    guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
    listingType: (searchParams.get('listingType') as SearchPropertiesParams['listingType']) ?? undefined,
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      city: searchParams.get('city') ?? undefined,
      checkIn: searchParams.get('checkIn') ?? undefined,
      checkOut: searchParams.get('checkOut') ?? undefined,
      guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
      listingType: (searchParams.get('listingType') as SearchPropertiesParams['listingType']) ?? undefined,
    }));
    setPage(1);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', filters, activeCategory, page],
    queryFn: () =>
      propertiesApi.searchProperties({
        ...filters,
        categoryId:
          activeCategory && Number(activeCategory) > 0
            ? Number(activeCategory)
            : undefined,
        page,
        limit: 20,
      }),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  } as any);

  const properties = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = (data as any)?.totalPages ?? 1;

  const handleApplyFilters = (newFilters: SearchPropertiesParams) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleSaveSearch = async () => {
    if (!isLoggedIn) { toast.error(tSearch('loginToSave')); return; }
    setSavingSearch(true);
    try {
      const name = filters.city
        ? `${filters.city}${filters.checkIn ? ` · ${filters.checkIn}` : ''}`
        : 'My Search';
      await savedSearchesApi.create(name, filters as unknown as Record<string, unknown>);
      toast.success(tSearch('searchSaved'));
    } catch {
      toast.error(tSearch('searchSaveFailed'));
    } finally {
      setSavingSearch(false);
    }
  };

  const activeFilterCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.spaceType,
    filters.bedrooms,
    filters.beds,
    filters.bathrooms,
    filters.instantBook,
    filters.allowPets,
    filters.listingType,
    ...(filters.amenities ?? []),
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* ── Compact search context bar ────────────────────────────────────── */}
      <div className="border-b border-neutral-100 bg-white/90 backdrop-blur-sm py-2.5 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-sm text-neutral-700">
            {filters.city ? (
              <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                {filters.city}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                {tSearch('anywhere')}
              </span>
            )}

            {(filters.checkIn || filters.checkOut) && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {filters.checkIn && format(new Date(filters.checkIn + 'T00:00:00'), 'MMM d')}
                  {filters.checkOut && ` – ${format(new Date(filters.checkOut + 'T00:00:00'), 'MMM d')}`}
                </span>
              </>
            )}

            {filters.guests && filters.guests > 0 && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {filters.guests} {tSearch('guestLabel', { count: filters.guests })}
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center gap-1.5 shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:shadow hover:border-neutral-300 transition-all"
          >
            <Search className="h-3 w-3" />
            {tSearch('modify')}
          </button>
        </div>
      </div>

      {/* ── Category filters + filter button ─────────────────────────────── */}
      <div className="border-b border-neutral-100 bg-white sticky top-[64px] z-30 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center">
          <div className="flex-1 overflow-hidden">
            <CategoryFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
          <div className="flex items-center gap-2 ps-4 border-s border-neutral-100 ms-2 shrink-0">
            <button
              onClick={() => setFilterModalOpen(true)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                activeFilterCount > 0
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:shadow-sm'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {tFilter('title')}
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex-1">
        <div className={`flex gap-6 ${showMap ? 'flex-row' : 'flex-col'}`}>
          {/* Property grid */}
          <div className={showMap ? 'flex-1 overflow-y-auto max-h-[calc(100vh-200px)] py-6' : 'py-6'}>

            {/* Results count + clear filters */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {isLoading ? (
                  <p className="text-sm text-neutral-400">{tSearch('searching')}</p>
                ) : total > 0 ? (
                  <p className="text-sm text-neutral-700">
                    <span className="font-semibold text-neutral-900">{total.toLocaleString()}</span>
                    {' '}{tSearch('staysCount', { count: total })}{filters.city ? ` ${tSearch('inCity', { city: filters.city })}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-neutral-500">{t('noResults')}</p>
                )}
              </div>

              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    onClick={() =>
                      setFilters({
                        city: filters.city,
                        checkIn: filters.checkIn,
                        checkOut: filters.checkOut,
                        guests: filters.guests,
                        page: 1,
                        limit: 20,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    {tCommon('clear')} {tSearch('filtersLabel')}
                  </motion.button>
                )}
              </AnimatePresence>
              {/* G5: Save Search button */}
              {!isLoading && total > 0 && (
                <button
                  onClick={handleSaveSearch}
                  disabled={savingSearch}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors disabled:opacity-50"
                >
                  <Bookmark className="h-3 w-3" />
                  {tSearch('saveSearch')}
                </button>
              )}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand/20 to-violet-500/20 flex items-center justify-center">
                    <Spinner size="md" />
                  </div>
                </div>
                <p className="text-sm text-neutral-400">{tSearch('findingStays')}</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && properties.length === 0 && (
              <motion.div
                className="flex flex-col items-center py-24 gap-5 text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand/10 to-violet-500/10 flex items-center justify-center text-4xl">
                  🏠
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-800">{t('noResults')}</p>
                  <p className="text-sm text-neutral-400 mt-1 max-w-xs">{t('tryDifferentSearch')}</p>
                </div>
                <button
                  onClick={() => router.push(`/${locale}`)}
                  className="mt-1 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  {tSearch('startOver')}
                </button>
              </motion.div>
            )}

            {/* Property grid */}
            {!isLoading && properties.length > 0 && (
              <>
                <motion.div
                  className={`grid gap-x-5 gap-y-8 ${
                    showMap
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.03 } },
                  }}
                >
                  {properties.map((property: any, idx: number) => (
                    <motion.div
                      key={property.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] },
                        },
                      }}
                    >
                      <PropertyCard property={property} priority={idx < 8} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <button
                      disabled={page === 1}
                      onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 disabled:opacity-30 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                    >
                      ‹
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button
                            key={p}
                            onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                              p === page
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      {totalPages > 7 && page < totalPages && (
                        <>
                          {page < totalPages - 3 && <span className="text-neutral-400 px-1">…</span>}
                          <button
                            onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      disabled={page === totalPages}
                      onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 disabled:opacity-30 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map panel */}
          {showMap && (
            <div className="w-[45%] sticky top-[140px] h-[calc(100vh-140px)] rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
              <MapView properties={properties} />
            </div>
          )}
        </div>
      </div>

      {/* ── Floating map toggle ───────────────────────────────────────────── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <Map className="h-4 w-4" />
          {showMap ? t('hideMap') : t('showMap')}
        </button>
      </div>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
