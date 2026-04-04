'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Booking } from '@/types';
import { formatPrice, getImageUrl, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface Props {
  reservations: Booking[];
}

export function HostCalendar({ reservations }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build check-in / check-out maps
  const checkInMap = new Map<string, Booking[]>();
  const checkOutMap = new Map<string, Booking[]>();
  for (const res of reservations) {
    const ci = new Date(res.checkIn);
    const co = new Date(res.checkOut);
    const cik = dayKey(ci);
    const cok = dayKey(co);
    if (!checkInMap.has(cik)) checkInMap.set(cik, []);
    if (!checkOutMap.has(cok)) checkOutMap.set(cok, []);
    checkInMap.get(cik)!.push(res);
    checkOutMap.get(cok)!.push(res);
  }

  const selKey = selectedDate ? dayKey(selectedDate) : null;
  const selCheckIns = selKey ? (checkInMap.get(selKey) ?? []) : [];
  const selCheckOuts = selKey
    ? (checkOutMap.get(selKey) ?? []).filter((r) => !selCheckIns.includes(r))
    : [];
  const selRes = [...selCheckIns, ...selCheckOuts];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const sortedAll = [...reservations].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* ── Calendar grid ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <h2 className="text-base font-semibold text-neutral-900">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-neutral-600" />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 border-b border-neutral-100">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div
              key={`e${i}`}
              className="h-16 border-b border-r border-neutral-100"
            />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const k = dayKey(date);
            const isToday = sameDay(date, today);
            const isSel = selectedDate ? sameDay(date, selectedDate) : false;
            const hasCI = (checkInMap.get(k)?.length ?? 0) > 0;
            const hasCO = (checkOutMap.get(k)?.length ?? 0) > 0;
            const col = (firstDayOfWeek + i) % 7;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSel ? null : date)}
                className={cn(
                  'relative h-16 flex flex-col items-center justify-start pt-1.5 gap-1',
                  'border-b border-r border-neutral-100 transition-colors',
                  col === 6 && 'border-r-0',
                  isSel ? 'bg-indigo-50' : 'hover:bg-neutral-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : isSel
                      ? 'text-indigo-600 font-bold'
                      : 'text-neutral-700',
                  )}
                >
                  {day}
                </span>
                <div className="flex gap-0.5">
                  {hasCI && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {hasCO && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Check-in
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Check-out
        </span>
      </div>

      {/* ── Selected-day detail ───────────────────────────────────── */}
      {selectedDate && (
        <div className="rounded-2xl border border-indigo-100 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-indigo-50/40">
            <h3 className="text-sm font-semibold text-neutral-900">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            <span className="text-xs text-neutral-500">
              {selRes.length} reservation{selRes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {selRes.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">
              No reservations on this day
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {selRes.map((res) => {
                const isCI = selCheckIns.includes(res);
                const isCO = selCheckOuts.includes(res) || (!isCI && selCheckIns.findIndex(r => r.id === res.id) === -1);
                const coverImg = res.property.images?.[0]?.url;
                return (
                  <div key={res.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Property image */}
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                        {coverImg ? (
                          <Image
                            src={getImageUrl(coverImg)}
                            alt={res.property.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl">
                            🏠
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title + badges + total */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 truncate">
                              {res.property.title}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              {isCI && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  ✈️ Check-in
                                </span>
                              )}
                              {isCO && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                  🏁 Check-out
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-indigo-700">
                              {formatPrice(res.total, 'EGP')}
                            </p>
                            <Badge
                              variant={
                                res.status === 'confirmed'
                                  ? 'success'
                                  : res.status === 'cancelled'
                                  ? 'error'
                                  : 'warning'
                              }
                              className="mt-0.5"
                            >
                              {res.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Guest row */}
                        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2">
                          <Avatar
                            src={res.guest.avatar}
                            firstName={res.guest.firstName}
                            lastName={res.guest.lastName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900">
                              {res.guest.firstName} {res.guest.lastName}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {res.guest.email}
                            </p>
                          </div>
                        </div>

                        {/* Stay details grid */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: 'Check-in', val: formatDate(res.checkIn, 'MMM d, yyyy') },
                            { label: 'Check-out', val: formatDate(res.checkOut, 'MMM d, yyyy') },
                            { label: 'Nights', val: String(res.nights) },
                            { label: 'Guests', val: String(res.guests) },
                          ].map(({ label, val }) => (
                            <div key={label} className="rounded-lg bg-neutral-50 px-3 py-2">
                              <p className="text-xs text-neutral-400">{label}</p>
                              <p className="text-sm font-semibold text-neutral-800">{val}</p>
                            </div>
                          ))}
                        </div>

                        {/* Payment info */}
                        <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-neutral-500">
                          <span className="rounded-lg bg-neutral-50 border border-neutral-100 px-2 py-1">
                            💳 {res.paymentMethod ?? 'N/A'}
                          </span>
                          <span className="rounded-lg bg-neutral-50 border border-neutral-100 px-2 py-1">
                            Payment: {res.paymentStatus ?? 'N/A'}
                          </span>
                          {res.paymentReference && (
                            <span className="rounded-lg bg-neutral-50 border border-neutral-100 px-2 py-1 font-mono">
                              Ref: {res.paymentReference.slice(0, 14)}…
                            </span>
                          )}
                        </div>

                        {/* Price breakdown */}
                        <div className="mt-3 rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3 space-y-1.5">
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                            Price Breakdown
                          </p>
                          {[
                            { label: 'Base price', val: res.basePrice },
                            { label: 'Cleaning fee', val: res.cleaningFee },
                            { label: 'Service fee', val: res.serviceFee },
                            { label: 'Taxes', val: res.taxes },
                          ].map(({ label, val }) => (
                            <div
                              key={label}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-neutral-500">{label}</span>
                              <span className="font-medium text-neutral-700">
                                {formatPrice(val, 'EGP')}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-neutral-200 pt-1.5 flex items-center justify-between text-sm font-bold">
                            <span className="text-neutral-900">Total</span>
                            <span className="text-indigo-700">
                              {formatPrice(res.total, 'EGP')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── All reservations list (when no day selected) ──────────── */}
      {!selectedDate && reservations.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-4">
            All Reservations ({reservations.length})
          </h3>
          <div className="space-y-3">
            {sortedAll.map((res) => {
              const coverImg = res.property.images?.[0]?.url;
              return (
                <div
                  key={res.id}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                    {coverImg ? (
                      <Image
                        src={getImageUrl(coverImg)}
                        alt={res.property.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xl">
                        🏠
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {res.property.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      📅 {formatDate(res.checkIn, 'MMM d')} –{' '}
                      {formatDate(res.checkOut, 'MMM d, yyyy')} · {res.nights}n ·{' '}
                      {res.guests} guest{res.guests > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Avatar
                      src={res.guest.avatar}
                      firstName={res.guest.firstName}
                      lastName={res.guest.lastName}
                      size="sm"
                    />
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-700">
                        {formatPrice(res.total, 'EGP')}
                      </p>
                      <Badge
                        variant={
                          res.status === 'confirmed'
                            ? 'success'
                            : res.status === 'cancelled'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {res.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedDate && reservations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-4">🗓️</p>
          <p className="text-base font-semibold text-neutral-700">No reservations yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            When guests book your properties, their stays will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
