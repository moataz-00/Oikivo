'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, MapPin, Calendar, Users, X, Minus, Plus } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

type SearchSection = 'where' | 'checkin' | 'checkout' | 'guests' | null;

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<SearchSection>(null);
  const [where, setWhere] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState<GuestCounts>({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  const totalGuests = guests.adults + guests.children;
  const hasGuests = totalGuests > 0 || guests.infants > 0 || guests.pets > 0;
  const hasDates = dateRange?.from;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (where) params.set('city', where);
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    if (totalGuests > 0) params.set('guests', String(totalGuests));
    router.push(`/${locale}/s?${params.toString()}`);
    setActiveSection(null);
  };

  const updateGuest = (type: keyof GuestCounts, delta: number) => {
    setGuests((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  return (
    <div className={cn('relative w-full max-w-3xl mx-auto', className)}>
      <div
        className={cn(
          'flex items-center rounded-full border border-neutral-300 bg-white shadow-md hover:shadow-lg transition-shadow',
          activeSection && 'shadow-xl'
        )}
      >
        {/* WHERE */}
        <Popover.Root
          open={activeSection === 'where'}
          onOpenChange={(o) => setActiveSection(o ? 'where' : null)}
        >
          <Popover.Trigger asChild>
            <button
              className={cn(
                'flex flex-col items-start px-6 py-3.5 flex-1 text-left rounded-full hover:bg-neutral-100 transition-colors',
                activeSection === 'where' && 'bg-white shadow-md rounded-full'
              )}
            >
              <span className="text-xs font-semibold text-neutral-900">{t('whereAreYouGoing')}</span>
              <span className={cn('text-sm truncate', where ? 'text-neutral-900' : 'text-neutral-400')}>
                {where || t('searchPlaceholder')}
              </span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={12}
              className="z-50 w-[320px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              {/* Suggested destinations */}
              <div className="mt-3">
                <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                  {t('suggestedDestinations')}
                </p>
                <div className="space-y-0.5">
                  {[
                    { city: 'Dubai',     cityKey: 'cityDubai',     descKey: 'descDubai' },
                    { city: 'Riyadh',    cityKey: 'cityRiyadh',    descKey: 'descRiyadh' },
                    { city: 'Cairo',     cityKey: 'cityCairo',     descKey: 'descCairo' },
                    { city: 'Istanbul',  cityKey: 'cityIstanbul',  descKey: 'descIstanbul' },
                    { city: 'Marrakech', cityKey: 'cityMarrakech', descKey: 'descMarrakech' },
                  ].map(({ city, cityKey, descKey }) => (
                    <button
                      key={city}
                      onClick={() => {
                        setWhere(city);
                        setActiveSection('checkin');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-neutral-50 text-left transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                        <MapPin className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{t(cityKey as any)}</p>
                        <p className="text-xs text-neutral-400">{t(descKey as any)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <div className="h-8 w-px bg-neutral-200" />

        {/* CHECK IN */}
        <Popover.Root
          open={activeSection === 'checkin'}
          onOpenChange={(o) => setActiveSection(o ? 'checkin' : null)}
        >
          <Popover.Trigger asChild>
            <button
              className={cn(
                'flex flex-col items-start px-5 py-3.5 text-left rounded-full hover:bg-neutral-100 transition-colors',
                activeSection === 'checkin' && 'bg-white shadow-md rounded-full'
              )}
            >
              <span className="text-xs font-semibold text-neutral-900">{t('checkIn')}</span>
              <span className={cn('text-sm', hasDates ? 'text-neutral-900' : 'text-neutral-400')}>
                {dateRange?.from ? format(dateRange.from, 'MMM d') : t('addDates')}
              </span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="center"
              sideOffset={12}
              className="z-50 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
            >
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={{ before: new Date() }}
                classNames={{
                  months: 'flex gap-6',
                  month: 'space-y-3',
                  caption: 'flex justify-center items-center py-1 relative',
                  caption_label: 'text-sm font-semibold text-neutral-900',
                  nav: 'flex items-center gap-1',
                  nav_button: 'h-7 w-7 flex items-center justify-center rounded-full hover:bg-neutral-100',
                  nav_button_previous: 'absolute left-0',
                  nav_button_next: 'absolute right-0',
                  table: 'w-full border-collapse',
                  head_row: 'flex',
                  head_cell: 'text-neutral-400 w-9 font-normal text-xs text-center',
                  row: 'flex w-full mt-1',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative',
                  day: 'h-9 w-9 rounded-full hover:bg-neutral-100 text-neutral-900 font-normal transition-colors',
                  day_selected: 'bg-neutral-900 text-white hover:bg-neutral-800',
                  day_range_start: 'bg-neutral-900 text-white rounded-l-full',
                  day_range_end: 'bg-neutral-900 text-white rounded-r-full',
                  day_range_middle: 'bg-neutral-100 rounded-none',
                  day_today: 'font-semibold',
                  day_disabled: 'text-neutral-300 hover:bg-transparent cursor-not-allowed',
                  day_outside: 'text-neutral-300',
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <div className="h-8 w-px bg-neutral-200" />

        {/* CHECK OUT */}
        <Popover.Root
          open={activeSection === 'checkout'}
          onOpenChange={(o) => setActiveSection(o ? 'checkout' : null)}
        >
          <Popover.Trigger asChild>
            <button
              className={cn(
                'flex flex-col items-start px-5 py-3.5 text-left rounded-full hover:bg-neutral-100 transition-colors',
                activeSection === 'checkout' && 'bg-white shadow-md rounded-full'
              )}
            >
              <span className="text-xs font-semibold text-neutral-900">{t('checkOut')}</span>
              <span className={cn('text-sm', dateRange?.to ? 'text-neutral-900' : 'text-neutral-400')}>
                {dateRange?.to ? format(dateRange.to, 'MMM d') : t('addDates')}
              </span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="center"
              sideOffset={12}
              className="z-50 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
            >
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={{ before: dateRange?.from ?? new Date() }}
                classNames={{
                  months: 'flex gap-6',
                  month: 'space-y-3',
                  caption: 'flex justify-center items-center py-1 relative',
                  caption_label: 'text-sm font-semibold text-neutral-900',
                  nav: 'flex items-center gap-1',
                  nav_button: 'h-7 w-7 flex items-center justify-center rounded-full hover:bg-neutral-100',
                  nav_button_previous: 'absolute left-0',
                  nav_button_next: 'absolute right-0',
                  table: 'w-full border-collapse',
                  head_row: 'flex',
                  head_cell: 'text-neutral-400 w-9 font-normal text-xs text-center',
                  row: 'flex w-full mt-1',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative',
                  day: 'h-9 w-9 rounded-full hover:bg-neutral-100 text-neutral-900 font-normal transition-colors',
                  day_selected: 'bg-neutral-900 text-white hover:bg-neutral-800',
                  day_range_start: 'bg-neutral-900 text-white rounded-l-full',
                  day_range_end: 'bg-neutral-900 text-white rounded-r-full',
                  day_range_middle: 'bg-neutral-100 rounded-none',
                  day_today: 'font-semibold',
                  day_disabled: 'text-neutral-300 hover:bg-transparent cursor-not-allowed',
                  day_outside: 'text-neutral-300',
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <div className="h-8 w-px bg-neutral-200" />

        {/* WHO / GUESTS */}
        <Popover.Root
          open={activeSection === 'guests'}
          onOpenChange={(o) => setActiveSection(o ? 'guests' : null)}
        >
          <Popover.Trigger asChild>
            <button
              className={cn(
                'flex flex-col items-start px-5 py-3.5 text-left rounded-full hover:bg-neutral-100 transition-colors flex-1',
                activeSection === 'guests' && 'bg-white shadow-md rounded-full'
              )}
            >
              <span className="text-xs font-semibold text-neutral-900">{t('guests')}</span>
              <span className={cn('text-sm', hasGuests ? 'text-neutral-900' : 'text-neutral-400')}>
                {hasGuests
                  ? [
                      totalGuests > 0 && t('guestSummary', { count: totalGuests }),
                      guests.infants > 0 && t('infantSummary', { count: guests.infants }),
                      guests.pets > 0 && t('petSummary', { count: guests.pets }),
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : t('addGuests')}
              </span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={12}
              className="z-50 w-[360px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
            >
              <div className="space-y-4">
                {(
                  [
                    { key: 'adults', label: t('adults'), desc: t('adultsDesc') },
                    { key: 'children', label: t('children'), desc: t('childrenDesc') },
                    { key: 'infants', label: t('infants'), desc: t('infantsDesc') },
                    { key: 'pets', label: t('pets'), desc: t('petsDesc') },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{label}</p>
                      <p className="text-xs text-neutral-500">{desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuest(key, -1)}
                        disabled={guests[key] === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium">{guests[key]}</span>
                      <button
                        onClick={() => updateGuest(key, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-neutral-900 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="m-2 flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 text-white hover:bg-brand-dark transition-colors font-semibold shrink-0"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:block text-sm">{t('search')}</span>
        </button>
      </div>
    </div>
  );
}
