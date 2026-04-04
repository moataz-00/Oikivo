'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CalendarClock, Home, Users,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, parseISO,
} from 'date-fns';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { cn, formatPrice, getImageUrl } from '@/lib/utils';
import type { Booking } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-emerald-500',
  completed: 'bg-gray-400',
};

function getBookingDates(booking: Booking): string[] {
  const dates: string[] = [];
  const ci = new Date(booking.checkIn);
  const co = new Date(booking.checkOut);
  for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function ReservationsCalendarPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const month = format(currentDate, 'yyyy-MM');

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['host-calendar', month],
    queryFn: () => bookingsApi.getHostCalendar(month),
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 60_000,
  });

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const paddingDays = Array.from({ length: startDow });

  // Build date → bookings map
  const dateMap = new Map<string, Booking[]>();
  for (const booking of bookings) {
    for (const d of getBookingDates(booking)) {
      if (!dateMap.has(d)) dateMap.set(d, []);
      dateMap.get(d)!.push(booking);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/${locale}/hosting/reservations`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-neutral-600" />
            Reservations Calendar
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">All bookings across your listings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-200 bg-white overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-indigo-50 to-violet-50">
            <button
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold text-indigo-900">{format(currentDate, 'MMMM yyyy')}</h2>
            <button
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-6 py-2.5 border-b border-neutral-100 bg-neutral-50/50">
            {['pending', 'confirmed', 'completed'].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn('h-2.5 w-2.5 rounded-full', STATUS_COLORS[s])} />
                <span className="text-xs text-neutral-600 capitalize">{s}</span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-neutral-400 py-2">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                {days.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayBookings = dateMap.get(dateStr) ?? [];
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                  const hasSelected = selected && dayBookings.some((b) => b.id === selected.id);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => dayBookings.length > 0 ? setSelected(dayBookings[0]) : setSelected(null)}
                      className={cn(
                        'relative rounded-xl min-h-[52px] p-1.5 border text-left transition-all',
                        isPast && 'opacity-40',
                        dayBookings.length > 0
                          ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'
                          : 'border-transparent bg-white hover:bg-neutral-50',
                        hasSelected && 'ring-2 ring-indigo-500',
                      )}
                    >
                      <span className="text-sm font-medium text-neutral-700 block">{format(date, 'd')}</span>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {dayBookings.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className={cn('h-1.5 w-1.5 rounded-full', STATUS_COLORS[b.status] ?? 'bg-gray-400')}
                          />
                        ))}
                        {dayBookings.length > 3 && (
                          <span className="text-[9px] text-neutral-400">+{dayBookings.length - 3}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary footer */}
          <div className="border-t border-neutral-100 px-6 py-3 bg-neutral-50/50 flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} this month
            </span>
            {bookings.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {bookings.reduce((s, b) => s + (b.guests ?? 0), 0)} total guests
              </span>
            )}
          </div>
        </div>

        {/* Booking detail sidebar */}
        <div className="space-y-3">
          {selected ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-neutral-200 bg-white p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                  selected.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  selected.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600',
                )}>
                  {selected.status}
                </span>
                <button onClick={() => setSelected(null)} className="text-xs text-neutral-400 hover:text-neutral-600">✕</button>
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">{selected.property?.title}</h3>
              <p className="text-xs text-neutral-500 mt-1">
                {format(parseISO(selected.checkIn), 'MMM d')} – {format(parseISO(selected.checkOut), 'MMM d, yyyy')}
                {' '}· {selected.nights} nights
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600">
                  {selected.guest?.firstName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800">{selected.guest?.firstName} {selected.guest?.lastName}</p>
                  <p className="text-xs text-neutral-400">{selected.guests} guest{selected.guests !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-800">
                {formatPrice(selected.total, 'EGP')}
              </div>
              <Link
                href={`/${locale}/hosting/reservations`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                View in Reservations
              </Link>
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 text-center">
              <CalendarClock className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Click a date with bookings to see details</p>
            </div>
          )}

          {/* All bookings list (compact) */}
          {bookings.length > 0 && (
            <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                This month
              </div>
              <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
                {bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors',
                      selected?.id === b.id && 'bg-indigo-50',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full shrink-0', STATUS_COLORS[b.status] ?? 'bg-gray-300')} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-800 truncate">{b.property?.title}</p>
                        <p className="text-[11px] text-neutral-400">
                          {format(parseISO(b.checkIn), 'MMM d')} – {format(parseISO(b.checkOut), 'MMM d')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-neutral-700 shrink-0">{formatPrice(b.total, 'EGP')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
