'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { availabilityApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  propertyId: number;
}

const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const grid: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) grid.push(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month - 1, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function MonthCalendar({
  year,
  month,
  statusMap,
  days,
  monthNames,
}: {
  year: number;
  month: number;
  statusMap: Record<string, 'available' | 'booked' | 'blocked'>;
  days: string[];
  monthNames: string[];
}) {
  const grid = buildMonthGrid(year, month);
  const today = toDateString(new Date());

  return (
    <div className="flex-1 min-w-[260px]">
      <p className="text-center text-sm font-semibold text-neutral-800 mb-3 tracking-tight">
        {monthNames[month - 1]} {year}
      </p>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-neutral-400 pb-2 uppercase tracking-wider">
            {d}
          </div>
        ))}
        {grid.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="h-9 w-9 mx-auto" />;
          const key = toDateString(date);
          const status = statusMap[key];
          const isPast = key < today;
          const isToday = key === today;

          return (
            <div
              key={key}
              title={status ? `${key}: ${status}` : key}
              className={cn(
                'relative flex items-center justify-center mx-auto h-9 w-9 rounded-full text-sm transition-colors',
                isPast && 'opacity-25 cursor-default',
                isToday && 'ring-1 ring-neutral-400 ring-offset-1',
                !isPast && status === 'available' && 'text-neutral-900 hover:bg-neutral-100 cursor-default',
                !isPast && status === 'booked' && 'bg-neutral-900 text-white',
                !isPast && status === 'blocked' && 'text-neutral-300 cursor-not-allowed',
                !isPast && !status && 'text-neutral-300 cursor-not-allowed',
              )}
            >
              {status === 'blocked' ? (
                <span className="line-through opacity-50">{date.getDate()}</span>
              ) : (
                date.getDate()
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AvailabilityCalendar({ propertyId }: AvailabilityCalendarProps) {
  const locale = useLocale();
  const DAYS = locale === 'ar' ? DAYS_AR : DAYS_EN;
  const MONTH_NAMES = locale === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN;

  const now = new Date();
  const [offset, setOffset] = useState(0);

  const m1Date = new Date(now.getFullYear(), now.getMonth() + offset);
  const m1Year = m1Date.getFullYear();
  const m1Month = m1Date.getMonth() + 1;

  const m2Date = new Date(now.getFullYear(), now.getMonth() + offset + 1);
  const m2Year = m2Date.getFullYear();
  const m2Month = m2Date.getMonth() + 1;

  const { data: days1 = [], isLoading: l1 } = useQuery({
    queryKey: ['availability', propertyId, m1Year, m1Month],
    queryFn: () => availabilityApi.getCalendar(propertyId, m1Year, m1Month),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: days2 = [], isLoading: l2 } = useQuery({
    queryKey: ['availability', propertyId, m2Year, m2Month],
    queryFn: () => availabilityApi.getCalendar(propertyId, m2Year, m2Month),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const statusMap: Record<string, 'available' | 'booked' | 'blocked'> = {};
  for (const d of [...days1, ...days2]) statusMap[d.date] = d.status as any;

  const isLoading = l1 || l2;

  return (
    <div>
      {/* Navigation bar — arrows on sides, month range centered */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 2))}
          disabled={offset === 0}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-default transition-colors"
          aria-label="Previous months"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <p className="text-sm font-medium text-neutral-600">
          {MONTH_NAMES[m1Month - 1]} – {MONTH_NAMES[m2Month - 1]} {m2Year}
        </p>

        <button
          onClick={() => setOffset((o) => o + 2)}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Next months"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-neutral-200 border-t-neutral-600 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-8">
          <MonthCalendar year={m1Year} month={m1Month} statusMap={statusMap} days={DAYS} monthNames={MONTH_NAMES} />
          <div className="hidden sm:block w-px bg-neutral-100 self-stretch" />
          <MonthCalendar year={m2Year} month={m2Month} statusMap={statusMap} days={DAYS} monthNames={MONTH_NAMES} />
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-neutral-500 border-t border-neutral-100 pt-4">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-neutral-900 inline-flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          Booked
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border border-neutral-300 bg-white inline-block" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-neutral-100 inline-block" />
          Unavailable
        </span>
      </div>
    </div>
  );
}
