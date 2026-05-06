'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DayPicker, DateRange } from 'react-day-picker';
import { parseISO, addMonths, addDays, eachDayOfInterval, differenceInDays, format } from 'date-fns';
import { X, CalendarDays } from 'lucide-react';
import { availabilityApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  propertyId: number;
  checkIn?: Date;
  checkOut?: Date;
  onSelect: (range: { from?: Date; to?: Date }) => void;
  minNights?: number;
  maxNights?: number;
  /** How many months to show side-by-side. Default: 2 */
  numberOfMonths?: number;
  /** Earliest selectable date. Defaults to today. Pass addDays(new Date(), 3) for request-to-book. */
  minDate?: Date;
}

// Scoped CSS — renders the selection band via ::before on the <td> cell.
// Uses marker class names (range-start / range-end / range-middle) that are
// added alongside the Tailwind classNames so they can be targeted by CSS.
const RANGE_CSS = `
.dp-range .rdp { margin: 0; }
.dp-range .rdp-months { gap: 2rem; }
.dp-range .rdp-button { border: none; background: none; padding: 0; position: relative; z-index: 1; }
.dp-range .rdp-button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
  border-radius: 9999px;
  box-shadow: none;
}
/* Middle days — full-width light band behind the button */
.dp-range td:has(.range-middle)::before {
  content: '';
  position: absolute;
  inset-block: 4px;
  left: 0; right: 0;
  background: #f5f5f5;
  z-index: 0;
}
/* Start day — right-half band extending toward next cell */
.dp-range td:has(.range-start:not(.range-end))::before {
  content: '';
  position: absolute;
  inset-block: 4px;
  left: 50%; right: 0;
  background: #f5f5f5;
  z-index: 0;
}
/* End day — left-half band extending toward previous cell */
.dp-range td:has(.range-end:not(.range-start))::before {
  content: '';
  position: absolute;
  inset-block: 4px;
  left: 0; right: 50%;
  background: #f5f5f5;
  z-index: 0;
}
`;

export function DateRangePicker({
  propertyId,
  checkIn,
  checkOut,
  onSelect,
  minNights = 1,
  maxNights,
  numberOfMonths = 2,
  minDate,
}: DateRangePickerProps) {
  const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date());

  const m1 = displayMonth;
  const m2 = addMonths(displayMonth, 1);

  const { data: data1, isLoading: l1 } = useQuery({
    queryKey: ['calendar', propertyId, m1.getFullYear(), m1.getMonth() + 1],
    queryFn: () => availabilityApi.getCalendar(propertyId, m1.getFullYear(), m1.getMonth() + 1),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

  const { data: data2, isLoading: l2 } = useQuery({
    queryKey: ['calendar', propertyId, m2.getFullYear(), m2.getMonth() + 1],
    queryFn: () => availabilityApi.getCalendar(propertyId, m2.getFullYear(), m2.getMonth() + 1),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

  const isLoading = l1 || l2;

  const blockedDates: Date[] = [...(data1 ?? []), ...(data2 ?? [])]
    .filter((d) => d.status === 'booked' || d.status === 'blocked')
    .map((d) => parseISO(d.date));

  const blockedSet = new Set(blockedDates.map((d) => d.toDateString()));

  const disabledDays: any[] = [{ before: minDate ?? new Date() }, ...blockedDates];

  if (checkIn && !checkOut && minNights > 1) {
    for (let i = 1; i < minNights; i++) disabledDays.push(addDays(checkIn, i));
  }
  if (checkIn && !checkOut && maxNights) {
    disabledDays.push({ after: addDays(checkIn, maxNights) });
  }

  const selected: DateRange = { from: checkIn, to: checkOut };
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) { onSelect({}); return; }
    const { from, to } = range;
    if (from && to) {
      const days = eachDayOfInterval({ start: from, end: to });
      if (days.some((d) => blockedSet.has(d.toDateString()))) {
        onSelect({ from: to, to: undefined });
        return;
      }
      // Enforce minimum nights — catches reverse-selection (checkout clicked first, then check-in)
      if (differenceInDays(to, from) < minNights) {
        onSelect({ from, to: undefined });
        return;
      }
    }
    onSelect({ from, to });
  };

  // Contextual guide text
  const prompt = !checkIn
    ? 'Select your check-in date'
    : !checkOut
    ? `Now choose a check-out date — minimum ${minNights} night${minNights > 1 ? 's' : ''}`
    : null;

  return (
    <div className="w-full">
      <style>{RANGE_CSS}</style>

      {/* Status / night count bar */}
      <div className="flex items-center justify-between mb-3 min-h-[1.75rem]">
        {prompt ? (
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {prompt}
          </span>
        ) : checkIn && checkOut ? (
          <span className="text-sm font-semibold text-neutral-800">
            {nights} night{nights !== 1 ? 's' : ''} —{' '}
            <span className="font-normal text-neutral-500">
              {format(checkIn, 'MMM d')} → {format(checkOut, 'MMM d')}
            </span>
          </span>
        ) : null}

        {(checkIn || checkOut) && (
          <button
            onClick={() => onSelect({})}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-10 rounded bg-neutral-100" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} className="flex gap-1 justify-center">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-9 w-10 rounded-full bg-neutral-100" />
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="dp-range w-full">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            numberOfMonths={numberOfMonths}
            disabled={disabledDays}
            modifiers={{ booked: blockedDates }}
            modifiersClassNames={{
              booked: 'line-through opacity-30 cursor-not-allowed',
            }}
            classNames={{
              months: cn(
                'flex gap-8',
                numberOfMonths === 1 ? 'flex-col' : 'flex-col sm:flex-row'
              ),
              month: 'space-y-2',
              caption: 'flex justify-center items-center pb-2 pt-0 relative px-10',
              caption_label: 'text-sm font-semibold text-neutral-900 tracking-tight',
              nav: 'flex items-center',
              nav_button: [
                'absolute top-0 h-8 w-8 flex items-center justify-center',
                'rounded-full transition-colors hover:bg-neutral-100 active:bg-neutral-200',
                'text-neutral-600 hover:text-neutral-900',
              ].join(' '),
              nav_button_previous: 'left-0',
              nav_button_next: 'right-0',
              table: 'w-full border-collapse',
              head_row: 'flex',
              head_cell: 'text-neutral-400 flex-1 font-medium text-[11px] text-center py-2 uppercase tracking-wider',
              row: 'flex w-full mt-1',
              cell: 'h-10 flex-1 text-center text-sm p-0 relative',
              day: cn(
                'h-10 w-10 mx-auto flex items-center justify-center rounded-full',
                'text-sm text-neutral-800 font-normal',
                'hover:bg-neutral-100 transition-colors duration-100 cursor-pointer',
                'focus:outline-none'
              ),
              day_selected:
                'font-semibold',
              day_range_start:
                'range-start !bg-neutral-900 !text-white hover:!bg-neutral-800 font-semibold',
              day_range_end:
                'range-end !bg-neutral-900 !text-white hover:!bg-neutral-800 font-semibold',
              day_range_middle:
                'range-middle !rounded-none !w-full !bg-neutral-100 !text-neutral-900 hover:!bg-neutral-200',
              day_today:
                'font-bold underline decoration-2 decoration-indigo-500 underline-offset-2',
              day_disabled:
                '!text-neutral-300 hover:!bg-transparent !cursor-not-allowed',
              day_outside: '!text-neutral-300 !opacity-40',
            }}
          />
        </div>
      )}
    </div>
  );
}
