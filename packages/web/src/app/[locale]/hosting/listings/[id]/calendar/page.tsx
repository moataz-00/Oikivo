'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CalendarClock, BadgeCheck, TrendingUp, ChevronDown,
  Link2, RefreshCw, Trash2, Plus, CheckCircle2, AlertCircle, Clock, Copy, Calendar, X,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, parseISO, isBefore, isAfter,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { propertiesApi, availabilityApi } from '@/lib/api';
import type { ICalSource } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { CalendarView } from '@/components/hosting/CalendarView';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

function DatePickerModal({
  startDate,
  endDate,
  onChange,
  onClose,
}: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('hosting');
  const isRTL = locale === 'ar';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(
    startDate ? startOfMonth(parseISO(startDate)) : startOfMonth(today)
  );
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [step, setStep] = useState<'start' | 'end'>(startDate ? 'end' : 'start');
  const [hoverDate, setHoverDate] = useState('');

  const monthStart = startOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(viewDate) });
  const paddingDays = Array.from({ length: getDay(monthStart) });

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (step === 'start') {
      setLocalStart(dateStr);
      setLocalEnd('');
      setStep('end');
    } else {
      if (localStart && isBefore(date, parseISO(localStart))) {
        setLocalStart(dateStr);
        setLocalEnd('');
      } else {
        setLocalEnd(dateStr);
      }
    }
  };

  const getCellClass = (date: Date, dateStr: string) => {
    const isPast = isBefore(date, today);
    const isStartOrEnd = localStart === dateStr || localEnd === dateStr;
    const inRange =
      localStart && localEnd &&
      isAfter(date, parseISO(localStart)) &&
      isBefore(date, parseISO(localEnd));
    const inHoverRange =
      step === 'end' && localStart && hoverDate &&
      isAfter(date, parseISO(localStart)) &&
      isBefore(date, parseISO(hoverDate));
    if (isStartOrEnd) return 'bg-amber-500 text-white font-bold rounded-full';
    if (inRange) return 'bg-amber-100 text-amber-900';
    if (!localEnd && inHoverRange) return 'bg-amber-50 text-amber-700';
    if (isPast) return 'opacity-30 cursor-not-allowed';
    return 'hover:bg-neutral-100 text-neutral-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
      >
        {/* Step tabs */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('start')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                step === 'start' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {localStart || t('dpStartDate')}
            </button>
            <ChevronRight className={cn('h-3.5 w-3.5 text-neutral-400', isRTL && 'rotate-180')} />
            <button
              type="button"
              onClick={() => localStart && setStep('end')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                step === 'end' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {localEnd || t('dpEndDate')}
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Month navigation */}
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-neutral-800">{format(viewDate, 'MMMM yyyy')}</span>
          <button
            type="button"
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7">
          {[t('calWeekSun'), t('calWeekMon'), t('calWeekTue'), t('calWeekWed'), t('calWeekThu'), t('calWeekFri'), t('calWeekSat')].map((d, i) => (
            <div key={i} className="py-1 text-center text-xs font-medium text-neutral-400">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {paddingDays.map((_, i) => <div key={`p${i}`} />)}
          {days.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isPast = isBefore(date, today);
            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast}
                onClick={() => !isPast && handleDayClick(date)}
                onMouseEnter={() => !isPast && setHoverDate(dateStr)}
                onMouseLeave={() => setHoverDate('')}
                className={cn(
                  'flex h-8 w-full items-center justify-center text-sm transition-colors',
                  getCellClass(date, dateStr)
                )}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => { setLocalStart(''); setLocalEnd(''); setStep('start'); }}
            className="text-xs text-neutral-400 underline hover:text-neutral-600"
          >
            {t('clear')}
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>{t('cancel')}</Button>
            <Button
              size="sm"
              type="button"
              disabled={!localStart || !localEnd}
              onClick={() => { onChange(localStart, localEnd); onClose(); }}
            >
              {t('dpApplyBtn')}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ListingCalendarPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('hosting');
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const qc = useQueryClient();
  const uuid = params.id as string;

  const [showSeasonalForm, setShowSeasonalForm] = useState(false);
  const [seasonalForm, setSeasonalForm] = useState({ startDate: '', endDate: '', pricePerNight: '', label: '' });

  // iCal channel manager state
  const [showChannels, setShowChannels] = useState(false);
  const [channelForm, setChannelForm] = useState({ label: '', url: '' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<ICalSource | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', uuid],
    queryFn: () => propertiesApi.getPropertyByUuid(uuid),
    enabled: isLoggedIn && isHost && !!uuid,
  });

  const seasonalMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate: string; pricePerNight: number; label?: string }) =>
      availabilityApi.setSeasonalPricing(listing!.id, data),
    onSuccess: (res: any) => {
      toast.success(t('seasonalApplied', { count: res.datesUpdated }));
      setShowSeasonalForm(false);
      setSeasonalForm({ startDate: '', endDate: '', pricePerNight: '', label: '' });
      qc.invalidateQueries({ queryKey: ['calendar', listing?.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('failedApplySeasonal')),
  });

  // iCal queries / mutations
  const { data: channels = [], isLoading: channelsLoading } = useQuery<ICalSource[]>({
    queryKey: ['ical-channels', listing?.id],
    queryFn: () => availabilityApi.getChannels(listing!.id),
    enabled: !!listing?.id && showChannels,
  });

  const addChannelMutation = useMutation({
    mutationFn: () => availabilityApi.addChannel(listing!.id, channelForm.label, channelForm.url),
    onSuccess: () => {
      toast.success(t('calConnected'));
      setChannelForm({ label: '', url: '' });
      qc.invalidateQueries({ queryKey: ['ical-channels', listing?.id] });
      // Delay slightly to let the initial sync settle before refreshing the calendar grid
      setTimeout(() => qc.invalidateQueries({ queryKey: ['calendar', listing?.id] }), 2500);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('failedConnectCal')),
  });

  const syncChannelMutation = useMutation({
    mutationFn: (sourceId: number) => availabilityApi.syncChannel(listing!.id, sourceId),
    onSuccess: () => {
      toast.success(t('syncComplete'));
      qc.invalidateQueries({ queryKey: ['ical-channels', listing?.id] });
      qc.invalidateQueries({ queryKey: ['calendar', listing?.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('syncFailed')),
  });

  const removeChannelMutation = useMutation({
    mutationFn: (sourceId: number) => availabilityApi.removeChannel(listing!.id, sourceId),
    onSuccess: () => {
      toast.success(t('calDisconnected'));
      setChannelToDelete(null);
      qc.invalidateQueries({ queryKey: ['ical-channels', listing?.id] });
      qc.invalidateQueries({ queryKey: ['calendar', listing?.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('failedRemoveCal')),
  });

  const handleSeasonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonalForm.startDate || !seasonalForm.endDate || !seasonalForm.pricePerNight) {
      toast.error(t('allFieldsRequired'));
      return;
    }
    seasonalMutation.mutate({
      startDate: seasonalForm.startDate,
      endDate: seasonalForm.endDate,
      pricePerNight: Number(seasonalForm.pricePerNight),
      label: seasonalForm.label || undefined,
    });
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.label.trim() || !channelForm.url.trim()) {
      toast.error(t('labelUrlRequired'));
      return;
    }
    addChannelMutation.mutate();
  };

  const syncStatusIcon = (status: ICalSource['syncStatus']) => {
    if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === 'error') return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    if (status === 'syncing') return <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
    return <Clock className="h-3.5 w-3.5 text-neutral-400" />;
  };

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  return (
    <div className="relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(15,118,110,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.1),transparent_32%)]" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 rounded-3xl border border-neutral-200 bg-white p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/${locale}/hosting/listings`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">{t('calendar')}</h1>
              {listing && (
                <p className="text-sm text-neutral-500 mt-0.5">{listing.title}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-600">
              {t('calendarTip1')}
            </p>
            <p className="rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-600">
              {t('calendarTip2')}
            </p>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            {t('calendarSyncActive')}
          </p>
        </motion.div>

        {/* Seasonal Pricing Panel */}
        {!isLoading && listing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mb-4 rounded-3xl border border-amber-200 bg-amber-50/60 overflow-hidden"
          >
            <button
              onClick={() => setShowSeasonalForm((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <TrendingUp className="h-4 w-4" />
                {t('seasonalPricingRules')}
              </span>
              <ChevronDown className={`h-4 w-4 text-amber-600 transition-transform ${showSeasonalForm ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSeasonalForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSeasonalSubmit} className="px-6 pb-6 space-y-4">
                    <p className="text-xs text-amber-700">
                      {t('seasonalPricingHint')}
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">{t('dateRangeLabel')}</label>
                      <button
                        type="button"
                        onClick={() => setDatePickerOpen(true)}
                        className="w-full flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-left hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
                        {seasonalForm.startDate && seasonalForm.endDate ? (
                          <span className="text-neutral-900">
                            {seasonalForm.startDate} → {seasonalForm.endDate}
                          </span>
                        ) : seasonalForm.startDate ? (
                          <span className="text-neutral-900">{t('fromDatePartial', { date: seasonalForm.startDate })}</span>
                        ) : (
                          <span className="text-neutral-400">{t('selectDateRange')}</span>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">{t('pricePerNightEGP')}</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          placeholder={t('pricePlaceholder')}
                          value={seasonalForm.pricePerNight}
                          onChange={(e) => setSeasonalForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">{t('seasonLabelOptional')}</label>
                        <input
                          type="text"
                          placeholder={t('seasonLabelPlaceholder')}
                          value={seasonalForm.label}
                          onChange={(e) => setSeasonalForm((f) => ({ ...f, label: e.target.value }))}
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" isLoading={seasonalMutation.isPending}>
                      {t('applySeasonalPricing')}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* iCal / Channel Manager Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mb-4 rounded-3xl border border-sky-200 bg-sky-50/60 overflow-hidden"
            >
              <button
                onClick={() => setShowChannels((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                  <Link2 className="h-4 w-4" />
                  {t('connectedCalendars')}
                  {channels.length > 0 && (
                    <span className="ml-1 rounded-full bg-sky-200 px-2 py-0.5 text-xs font-semibold text-sky-800">
                      {channels.length}
                    </span>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 text-sky-600 transition-transform ${showChannels ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showChannels && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4">
                      <p className="text-xs text-sky-700">
                        {t('icalConnectHint')}
                      </p>

                      {/* Export iCal URL */}
                      {listing && (
                        <div className="rounded-xl border border-sky-200 bg-white p-3">
                          <p className="text-xs font-medium text-neutral-600 mb-1.5">{t('icalExportLabel')}</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 truncate rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 border border-neutral-200">
                              {availabilityApi.getIcalExportUrl(listing.id)}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(availabilityApi.getIcalExportUrl(listing.id));
                                toast.success(t('copiedClipboard'));
                              }}
                              className="flex items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                              {t('copyBtn')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Existing channels */}
                      {channelsLoading ? (
                        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                      ) : channels.length > 0 ? (
                        <div className="space-y-2">
                          {channels.map((ch) => (
                            <div
                              key={ch.id}
                              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {syncStatusIcon(ch.syncStatus)}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-neutral-800 truncate">{ch.label}</p>
                                  <p className="text-xs text-neutral-400 truncate max-w-[220px]">{ch.url}</p>
                                  {ch.syncStatus === 'error' && ch.errorMessage && (
                                    <p className="text-xs text-red-500 mt-0.5">{ch.errorMessage}</p>
                                  )}
                                  {ch.lastSyncedAt && (
                                    <p className="text-xs text-neutral-400">
                                      {t('lastSyncedLabel', { date: new Date(ch.lastSyncedAt).toLocaleDateString() })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <button
                                  onClick={() => syncChannelMutation.mutate(ch.id)}
                                  disabled={syncChannelMutation.isPending}
                                  title="Sync now"
                                  className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 transition-colors"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setChannelToDelete(ch)}
                                  title="Remove"
                                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-xs text-neutral-500 py-2">{t('noCalendarsYet')}</p>
                      )}

                      {/* Add new channel form */}
                      <form onSubmit={handleAddChannel} className="rounded-xl border border-sky-200 bg-white p-3 space-y-3">
                        <p className="text-xs font-semibold text-neutral-700">{t('addCalFeed')}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <input
                              type="text"
                              placeholder={t('calLabelPlaceholder')}
                              value={channelForm.label}
                              onChange={(e) => setChannelForm((f) => ({ ...f, label: e.target.value }))}
                              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="url"
                              placeholder="https://www.airbnb.com/calendar/ical/..."
                              value={channelForm.url}
                              onChange={(e) => setChannelForm((f) => ({ ...f, url: e.target.value }))}
                              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>
                        <Button type="submit" size="sm" isLoading={addChannelMutation.isPending} className="flex items-center gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          {t('connectCalendar')}
                        </Button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Availability planner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-700">
                <CalendarClock className="h-4 w-4 text-neutral-700" />
                {t('availabilityPlanner')}
              </div>
              <CalendarView propertyId={listing!.id} />
            </motion.div>
          </>
        )}
      </div>

      <AnimatePresence>
        {datePickerOpen && (
          <DatePickerModal
            startDate={seasonalForm.startDate}
            endDate={seasonalForm.endDate}
            onChange={(start, end) => setSeasonalForm((f) => ({ ...f, startDate: start, endDate: end }))}
            onClose={() => setDatePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete calendar confirmation modal */}
      <AnimatePresence>
        {channelToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => !removeChannelMutation.isPending && setChannelToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
            >
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>

              <h2 className="text-base font-semibold text-neutral-900">{t('disconnectCalTitle')}</h2>
              <p className="mt-1.5 text-sm text-neutral-500">
                {t('disconnectCalDesc', { label: channelToDelete.label })}
              </p>

              <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                {t('disconnectCalWarning')}
              </div>

              <div className="mt-5 flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setChannelToDelete(null)}
                  disabled={removeChannelMutation.isPending}
                >
                  {t('cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => removeChannelMutation.mutate(channelToDelete.id)}
                  isLoading={removeChannelMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {t('disconnectBtn')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
