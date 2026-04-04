'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/types';
import { useLocale } from 'next-intl';

// Fallback static categories if API is not ready
const STATIC_CATEGORIES: Category[] = [
  { id: 0, name: 'All', nameAr: 'الكل', icon: '🏠', slug: '' },
  { id: 1, name: 'Beachfront', nameAr: 'على الشاطئ', icon: '🏖️', slug: 'beachfront' },
  { id: 2, name: 'Amazing views', nameAr: 'إطلالات رائعة', icon: '🌄', slug: 'amazing-views' },
  { id: 3, name: 'Cabins', nameAr: 'كبائن', icon: '🌲', slug: 'cabins' },
  { id: 4, name: 'Trending', nameAr: 'رائج', icon: '🔥', slug: 'trending' },
  { id: 5, name: 'Mansions', nameAr: 'قصور', icon: '🏰', slug: 'mansions' },
  { id: 6, name: 'Desert', nameAr: 'صحراء', icon: '🏜️', slug: 'desert' },
  { id: 7, name: 'Pools', nameAr: 'مسابح', icon: '🏊', slug: 'pools' },
  { id: 8, name: 'Camping', nameAr: 'تخييم', icon: '⛺', slug: 'camping' },
  { id: 9, name: 'Countryside', nameAr: 'ريف', icon: '🌾', slug: 'countryside' },
  { id: 10, name: 'City', nameAr: 'مدينة', icon: '🏙️', slug: 'city' },
  { id: 11, name: 'Tiny homes', nameAr: 'منازل صغيرة', icon: '🏡', slug: 'tiny-homes' },
  { id: 12, name: 'Boats', nameAr: 'قوارب', icon: '⛵', slug: 'boats' },
  { id: 13, name: 'Ski-in/out', nameAr: 'تزلج', icon: '⛷️', slug: 'skiing' },
  { id: 14, name: 'Farms', nameAr: 'مزارع', icon: '🐄', slug: 'farms' },
];

interface CategoryFiltersProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryFilters({ activeCategory = '', onCategoryChange }: CategoryFiltersProps) {
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const items = categories
    ? [{ id: 0, name: 'All', nameAr: 'الكل', icon: '🏠', slug: '' }, ...categories]
    : STATIC_CATEGORIES;

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 300;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  return (
    <div className="relative flex items-center border-b border-neutral-100 bg-white">
      {/* Left fade + scroll button */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.div
            key="left-fade"
            className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10"
            style={{ background: 'linear-gradient(to right, white 40%, transparent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            key="left-btn"
            onClick={() => scroll('left')}
            className="absolute left-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            whileHover={{ scale: 1.1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.92 }}
          >
            <ChevronLeft className="h-4 w-4 text-neutral-700" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable categories */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-6 sm:px-10 py-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((cat) => {
          const isActive = activeCategory === String(cat.id);
          const name = locale === 'ar' ? cat.nameAr : cat.name;
          return (
            <motion.button
              key={cat.id}
              onClick={() => onCategoryChange?.(String(cat.id))}
              className={cn(
                'relative flex flex-col items-center gap-1 shrink-0 px-4 py-2 rounded-full transition-colors',
                isActive
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="category-pill"
                  className="absolute inset-0 rounded-full bg-neutral-100 border border-neutral-200"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative text-2xl leading-none">{cat.icon}</span>
              <span className="relative text-[11px] font-semibold whitespace-nowrap tracking-wide">{name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Right fade + scroll button */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.div
            key="right-fade"
            className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10"
            style={{ background: 'linear-gradient(to left, white 40%, transparent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            key="right-btn"
            onClick={() => scroll('right')}
            className="absolute right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            whileHover={{ scale: 1.1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.92 }}
          >
            <ChevronRight className="h-4 w-4 text-neutral-700" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
