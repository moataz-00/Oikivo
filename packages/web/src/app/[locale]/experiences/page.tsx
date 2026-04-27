'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Users, Clock, Star, SlidersHorizontal, X } from 'lucide-react';
import { experiencesApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { Experience, ExperienceCategory } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

function ExperienceCard({ exp, locale }: { exp: Experience; locale: string }) {
  const cover = exp.photos?.[0];
  const hrs = Math.floor(exp.durationMinutes / 60);
  const mins = exp.durationMinutes % 60;
  const duration = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  return (
    <Link href={`/${locale}/experiences/${exp.id}`} className="group block rounded-2xl overflow-hidden border border-neutral-200 hover:shadow-lg transition-shadow bg-white">
      <div className="relative h-48 bg-neutral-100 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url.startsWith('http') ? cover.url : `${BACKEND_URL}${cover.url}`}
            alt={exp.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-neutral-300">
            <Clock className="h-10 w-10" />
          </div>
        )}
        {exp.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-neutral-700 px-2 py-1 rounded-full">
            {exp.category.name}
          </span>
        )}
        {exp.instantBook && (
          <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Instant Book
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 line-clamp-2 mb-1">{exp.title}</h3>
        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-2">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{exp.city}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{duration}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />Up to {exp.maxGuests}</span>
        </div>
        {exp.avgRating != null && (
          <div className="flex items-center gap-1 text-xs text-neutral-600 mb-3">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{exp.avgRating.toFixed(1)}</span>
            <span className="text-neutral-400">({exp.reviewCount})</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-neutral-900">${exp.pricePerPerson}</span>
            <span className="text-xs text-neutral-500 ml-1">/ person</span>
          </div>
          {exp.host && (
            <span className="text-xs text-neutral-400">by {exp.host.firstName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ExperiencesPage() {
  const locale = useLocale();
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useQuery<ExperienceCategory[]>({
    queryKey: ['experience-categories'],
    queryFn: experiencesApi.getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['experiences-search', city, categoryId, maxPrice, page],
    queryFn: () =>
      experiencesApi.search({
        city: city || undefined,
        categoryId,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        page,
        limit: 12,
      }),
    placeholderData: (prev) => prev,
  });

  const experiences: Experience[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  function clearFilters() {
    setCity('');
    setCategoryId(undefined);
    setMaxPrice('');
    setPage(1);
  }

  const hasFilters = !!city || !!categoryId || !!maxPrice;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Discover Experiences</h1>
        <p className="text-indigo-100 max-w-xl mx-auto text-sm">
          Unique activities hosted by locals — from cooking classes to city tours.
        </p>
        {/* City search bar */}
        <div className="mt-6 max-w-md mx-auto flex rounded-2xl overflow-hidden shadow-lg bg-white">
          <div className="flex items-center pl-4 text-neutral-400">
            <MapPin className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Where? (city)"
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          {city && (
            <button onClick={() => setCity('')} className="px-3 text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center pr-4 text-neutral-400">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter row */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          {/* Category chips */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setCategoryId(undefined); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                !categoryId ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100',
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(cat.id); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  categoryId === cat.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-xl px-3 py-1.5 hover:bg-neutral-100 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && <span className="bg-indigo-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">!</span>}
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Extra filters panel */}
        {showFilters && (
          <div className="mb-5 p-4 bg-white rounded-2xl border border-neutral-200 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Max price / person</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="border border-neutral-300 rounded-xl px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No experiences found</p>
            <p className="text-sm text-neutral-400 mt-1">Try adjusting your filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm text-indigo-600 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-4">{data?.total} experience{data?.total !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {experiences.map((exp) => (
                <ExperienceCard key={exp.id} exp={exp} locale={locale} />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
