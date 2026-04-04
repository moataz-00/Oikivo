'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CalendarClock, BadgeCheck, TrendingUp, ChevronDown,
  Link2, RefreshCw, Trash2, Plus, CheckCircle2, AlertCircle, Clock, Copy,
} from 'lucide-react';
import { propertiesApi, availabilityApi } from '@/lib/api';
import type { ICalSource } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { CalendarView } from '@/components/hosting/CalendarView';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

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
      toast.success(`Seasonal pricing applied to ${res.datesUpdated} dates`);
      setShowSeasonalForm(false);
      setSeasonalForm({ startDate: '', endDate: '', pricePerNight: '', label: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to apply seasonal pricing'),
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
      toast.success('Calendar connected and syncing…');
      setChannelForm({ label: '', url: '' });
      qc.invalidateQueries({ queryKey: ['ical-channels', listing?.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to connect calendar'),
  });

  const syncChannelMutation = useMutation({
    mutationFn: (sourceId: number) => availabilityApi.syncChannel(listing!.id, sourceId),
    onSuccess: () => {
      toast.success('Sync triggered');
      qc.invalidateQueries({ queryKey: ['ical-channels', listing?.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Sync failed'),
  });

  const removeChannelMutation = useMutation({
    mutationFn: (sourceId: number) => availabilityApi.removeChannel(listing!.id, sourceId),
    onSuccess: () => {
      toast.success('Calendar disconnected');
      qc.invalidateQueries({ queryKey: ['ical-channels', listing?.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove calendar'),
  });

  const handleSeasonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonalForm.startDate || !seasonalForm.endDate || !seasonalForm.pricePerNight) {
      toast.error('All fields are required');
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
      toast.error('Label and URL are required');
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
    <div className="relative overflow-hidden">
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
              Click dates to select them, then block or unblock in bulk.
            </p>
            <p className="rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-600">
              Set custom prices around peak demand windows to improve earnings.
            </p>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Calendar sync and availability controls are active
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
                Seasonal Pricing Rules
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
                      Apply a custom nightly price to all dates in a range (overrides default price, keeps availability unchanged).
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          required
                          value={seasonalForm.startDate}
                          onChange={(e) => setSeasonalForm((f) => ({ ...f, startDate: e.target.value }))}
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">End Date</label>
                        <input
                          type="date"
                          required
                          value={seasonalForm.endDate}
                          onChange={(e) => setSeasonalForm((f) => ({ ...f, endDate: e.target.value }))}
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Price per night (EGP)</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          placeholder="e.g. 650"
                          value={seasonalForm.pricePerNight}
                          onChange={(e) => setSeasonalForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Label (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Summer season"
                          value={seasonalForm.label}
                          onChange={(e) => setSeasonalForm((f) => ({ ...f, label: e.target.value }))}
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" isLoading={seasonalMutation.isPending}>
                      Apply Seasonal Pricing
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
                  Connected Calendars
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
                        Connect Airbnb, Booking.com, or any iCal (.ics) feed to automatically block dates that are reserved on other platforms and prevent double bookings.
                      </p>

                      {/* Export iCal URL */}
                      {listing && (
                        <div className="rounded-xl border border-sky-200 bg-white p-3">
                          <p className="text-xs font-medium text-neutral-600 mb-1.5">Your iCal export link (paste into Airbnb / Booking.com)</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 truncate rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 border border-neutral-200">
                              {availabilityApi.getIcalExportUrl(listing.id)}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(availabilityApi.getIcalExportUrl(listing.id));
                                toast.success('Copied to clipboard');
                              }}
                              className="flex items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
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
                                      Last synced: {new Date(ch.lastSyncedAt).toLocaleDateString()}
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
                                  onClick={() => {
                                    if (confirm(`Remove "${ch.label}"? Its blocked dates will be unblocked.`)) {
                                      removeChannelMutation.mutate(ch.id);
                                    }
                                  }}
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
                        <p className="text-center text-xs text-neutral-500 py-2">No calendars connected yet.</p>
                      )}

                      {/* Add new channel form */}
                      <form onSubmit={handleAddChannel} className="rounded-xl border border-sky-200 bg-white p-3 space-y-3">
                        <p className="text-xs font-semibold text-neutral-700">Add calendar feed</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <input
                              type="text"
                              placeholder="Label (e.g. Airbnb)"
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
                          Connect Calendar
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
                Availability planner
              </div>
              <CalendarView propertyId={listing!.id} />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
