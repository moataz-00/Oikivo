'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { availabilityApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatPrice } from '@/lib/utils';
import type { CalendarDay, DayStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/Toast';

interface CalendarViewProps {
  propertyId: number;
}

const STATUS_COLORS: Record<DayStatus, string> = {
  available: 'bg-white hover:bg-indigo-50/40',
  booked: 'bg-red-50 text-red-700 cursor-not-allowed',
  blocked: 'bg-neutral-100 text-neutral-400',
};

const STATUS_DOT: Record<DayStatus, string> = {
  available: '',
  booked: 'bg-red-400',
  blocked: 'bg-neutral-400',
};

export function CalendarView({ propertyId }: CalendarViewProps) {
  const t = useTranslations('hosting');
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [priceOverride, setPriceOverride] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', propertyId, year, month],
    queryFn: () => availabilityApi.getCalendar(propertyId, year, month),
    staleTime: 2 * 60 * 1000,
  });

  const blockMutation = useMutation({
    mutationFn: (dates: string[]) =>
      availabilityApi.blockDates({ propertyId, dates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', propertyId] });
      setSelectedDates([]);
      toast.success('Dates blocked');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (dates: string[]) =>
      availabilityApi.unblockDates(propertyId, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', propertyId] });
      setSelectedDates([]);
      toast.success('Dates unblocked');
    },
  });

  const setPriceMutation = useMutation({
    mutationFn: ({ dates, price }: { dates: string[]; price: number }) =>
      availabilityApi.setPriceDates(propertyId, dates, price),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', propertyId] });
      setSelectedDates([]);
      setPriceOverride('');
      toast.success(`Custom price set for ${vars.dates.length} date${vars.dates.length !== 1 ? 's' : ''}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to set price'),
  });

  const resetPriceMutation = useMutation({
    mutationFn: (dates: string[]) =>
      availabilityApi.resetPriceDates(propertyId, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', propertyId] });
      setSelectedDates([]);
      setPriceOverride('');
      toast.success('Prices reset to default');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to reset prices'),
  });

  const calendarMap = new Map<string, CalendarDay>(
    calendarData?.map((d) => [d.date, d]) ?? []
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month (Sunday = 0)
  const startDow = getDay(monthStart);
  const paddingDays = Array.from({ length: startDow });

  // Check if any selected date is iCal-managed
  const hasIcalSelected = selectedDates.some((d) => {
    const dayData = calendarMap.get(format(d, 'yyyy-MM-dd'));
    return dayData?.source === 'ical';
  });

  const toggleDate = (date: Date, status: DayStatus) => {
    if (status === 'booked') return;
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDates((prev) =>
      prev.some((d) => format(d, 'yyyy-MM-dd') === dateStr)
        ? prev.filter((d) => format(d, 'yyyy-MM-dd') !== dateStr)
        : [...prev, date]
    );
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = calendarMap.get(dateStr);
    if (dayData) {
      setSelectedDay(dayData);
      setDayModalOpen(true);
    }
    toggleDate(date, dayData?.status ?? 'available');
  };

  const handleBlock = () => {
    const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    blockMutation.mutate(dates);
  };

  const handleUnblock = () => {
    const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    unblockMutation.mutate(dates);
  };

  const handleSetPrice = () => {
    if (!priceOverride || Number(priceOverride) <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    setPriceMutation.mutate({ dates, price: Number(priceOverride) });
  };

  const handleResetPrice = () => {
    const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    resetPriceMutation.mutate(dates);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-semibold text-indigo-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-indigo-50 bg-indigo-50/30">
        {(['available', 'booked', 'blocked'] as DayStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                status === 'available' ? 'bg-indigo-100 border border-indigo-300' : STATUS_DOT[status]
              )}
            />
            <span className="text-xs text-neutral-600 capitalize">{t(status)}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-neutral-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding cells */}
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {/* Day cells */}
            {days.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayData = calendarMap.get(dateStr);
              const status: DayStatus = dayData?.status ?? 'available';
              const isSelected = selectedDates.some(
                (d) => format(d, 'yyyy-MM-dd') === dateStr
              );
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={dateStr}
                  onClick={() => !isPast && handleDayClick(date)}
                  disabled={isPast}
                  className={cn(
                    'relative flex flex-col items-center justify-start rounded-xl p-1.5 min-h-[64px] border transition-all text-left',
                    isPast && 'opacity-30 cursor-not-allowed',
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50'
                      : 'border-transparent',
                    STATUS_COLORS[status]
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium self-start',
                    status === 'booked' ? 'text-red-700' : 'text-neutral-900'
                  )}>
                    {format(date, 'd')}
                  </span>

                  {/* Custom price override — show in amber on any status */}
                  {dayData?.priceOverride != null ? (
                    <span className="text-xs mt-0.5 font-medium text-amber-600">
                      {formatPrice(dayData.price!)}
                    </span>
                  ) : dayData?.price && status === 'available' ? (
                    <span className="text-xs mt-0.5 text-neutral-400">
                      {formatPrice(dayData.price)}
                    </span>
                  ) : null}

                  {status === 'booked' && dayData?.booking && (
                    <span className="text-xs text-red-600 mt-0.5 truncate w-full leading-tight">
                      Booked
                    </span>
                  )}

                  {status !== 'available' && (
                    <div
                      className={cn(
                        'absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full',
                        STATUS_DOT[status]
                      )}
                    />
                  )}

                  {/* iCal lock indicator */}
                  {dayData?.source === 'ical' && (
                    <Lock className="absolute bottom-1 right-1.5 h-2.5 w-2.5 text-neutral-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk actions when dates selected */}
      {selectedDates.length > 0 && (
        <div className="border-t border-indigo-100 px-6 py-4 space-y-4 bg-indigo-50/60">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700">
              {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setSelectedDates([])}
              className="text-sm text-neutral-500 underline"
            >
              Clear
            </button>
          </div>

          {/* Custom price section */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700">Custom Price</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Price per night (EGP)"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <Button
                size="sm"
                onClick={handleSetPrice}
                isLoading={setPriceMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              >
                Set price
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetPrice}
                isLoading={resetPriceMutation.isPending}
                className="shrink-0"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Availability section */}
          <div className="rounded-xl border border-indigo-200 bg-white p-3 space-y-2">
            <p className="text-xs font-semibold text-indigo-700">Availability</p>
            {hasIcalSelected && (
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Some dates are synced from an external calendar and cannot be unblocked manually.
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUnblock}
                isLoading={unblockMutation.isPending}
                disabled={hasIcalSelected}
                title={hasIcalSelected ? 'Cannot unblock iCal-synced dates' : undefined}
              >
                {t('unblockDates')}
              </Button>
              <Button
                size="sm"
                onClick={handleBlock}
                isLoading={blockMutation.isPending}
              >
                {t('blockDates')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
