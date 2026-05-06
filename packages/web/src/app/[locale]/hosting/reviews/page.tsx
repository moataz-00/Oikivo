'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Star, MessageCircle, UserCheck, Clock,
  PenLine, Home, CheckCircle2, Edit3, Trash2,
} from 'lucide-react';
import { propertiesApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { HostReviewCard } from '@/components/hosting/HostReviewCard';
import { WriteGuestReviewModal } from '@/components/hosting/WriteGuestReviewModal';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function HostReviewsPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const queryClient = useQueryClient();
  const [pendingBookingToReview, setPendingBookingToReview] = useState<any>(null);
  const [editingGuestReview, setEditingGuestReview] = useState<{ booking: any; review: any } | null>(null);

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: properties = [] } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => propertiesApi.getHostListings(),
    enabled: isLoggedIn,
  });

  const { data: allReviews = [], isLoading } = useQuery({
    queryKey: ['host-reviews', properties.map((p: any) => p.id)],
    queryFn: async () => {
      const results = await Promise.all(
        properties.map((p: any) =>
          reviewsApi.getPropertyReviews(p.id, 1, 100).then((res) =>
            res.items.map((r: any) => ({ ...r, property: { id: p.id, title: p.title } })),
          ),
        ),
      );
      return results.flat().sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    enabled: properties.length > 0,
  });

  const { data: pendingGuestReviews = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-guest-reviews'],
    queryFn: () => reviewsApi.getPendingGuestReviews(),
    enabled: isLoggedIn,
  });

  const { data: writtenGuestReviews = [] } = useQuery({
    queryKey: ['host-guest-reviews'],
    queryFn: () => reviewsApi.getHostGuestReviews(1, 50).then((r: any) => r.data ?? []),
    enabled: isLoggedIn,
  });

  const deleteGuestReviewMutation = useMutation({
    mutationFn: (reviewId: number) => reviewsApi.deleteReview(reviewId),
    onSuccess: () => {
      toast.success(t('reviewDeleted'));
      queryClient.invalidateQueries({ queryKey: ['host-guest-reviews'] });
    },
    onError: () => {
      toast.error(t('failedDeleteReview'));
    },
  });

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  const unreplied = allReviews.filter((r: any) => !r.hostReply);
  const replied   = allReviews.filter((r: any) => r.hostReply);

  const avgRating =
    allReviews.length > 0
      ? (
          allReviews.reduce(
            (s: number, r: any) => s + (r.overallRating ?? r.rating ?? 0),
            0,
          ) / allReviews.length
        ).toFixed(1)
      : null;

  const stats = [
    { icon: Star,          label: t('avgRating'),      value: avgRating ?? '—',   color: 'bg-amber-50 text-amber-500' },
    { icon: MessageCircle, label: t('needReply'),       value: unreplied.length,   color: 'bg-violet-50 text-violet-600' },
    { icon: UserCheck,     label: t('totalReviews'),   value: allReviews.length,  color: 'bg-indigo-50 text-indigo-600' },
    { icon: PenLine,       label: t('guestsReviewed'), value: (writtenGuestReviews as any[]).length, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative overflow-hidden">
        {/* Background radial gradient — matches other hosting pages */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.09),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.07),transparent_35%)]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">

          {/* ── Header card ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
            className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  ⭐ {t('reviewManagement')}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-neutral-900">
                  {t('guestReviews')}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {t('guestReviewsDesc')}
                </p>
              </div>
              {pendingGuestReviews.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  ✍️ {t('guestsToReview', { count: pendingGuestReviews.length })}
                </div>
              )}
            </div>

            {/* Stats row */}
            {allReviews.length > 0 && (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {stats.map((s) => (
                  <motion.div
                    key={s.label}
                    variants={fadeUp}
                    className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 flex items-center gap-3"
                  >
                    <div className={`rounded-xl p-2 ${s.color.split(' ')[0]}`}>
                      <s.icon className={`h-4 w-4 ${s.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-neutral-900 leading-none">{s.value}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── Tabs ── */}
          <Tabs.Root defaultValue="received">
            <Tabs.List className="flex border-b border-neutral-200 bg-white rounded-t-2xl overflow-hidden -mb-px">
              {[
                { value: 'received', label: t('receivedReviews'), emoji: '⭐', count: allReviews.length },
                { value: 'pending',  label: t('reviewGuests'),    emoji: '✍️', count: pendingGuestReviews.length },
              ].map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-600 hover:text-neutral-700 transition-colors"
                >
                  {tab.emoji} {tab.label}
                  {tab.count > 0 && (
                    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-100 px-1 text-xs font-semibold text-indigo-700">
                      {tab.count}
                    </span>
                  )}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* ── Received reviews tab ── */}
            <Tabs.Content value="received" className="pt-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
                    <Spinner size="lg" />
                  </motion.div>
                ) : allReviews.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-neutral-200 bg-white p-16 text-center"
                  >
                    <p className="text-5xl mb-4">⭐</p>
                    <h2 className="text-lg font-semibold text-neutral-900">{t('noReviewsYet')}</h2>
                    <p className="text-sm text-neutral-500 mt-1">{t('noReviewsYetDesc')}</p>
                  </motion.div>
                ) : (
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    {unreplied.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100">
                            <MessageCircle className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <h2 className="text-sm font-semibold text-neutral-700">
                            {t('awaitingReply')}
                          </h2>
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                            {unreplied.length}
                          </span>
                        </div>
                        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                          {unreplied.map((review: any) => (
                            <motion.div key={review.id} variants={fadeUp}>
                              <HostReviewCard review={review} />
                            </motion.div>
                          ))}
                        </motion.div>
                      </section>
                    )}

                    {replied.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <h2 className="text-sm font-semibold text-neutral-500">
                            {t('repliedReviews')}
                          </h2>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                            {replied.length}
                          </span>
                        </div>
                        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                          {replied.map((review: any) => (
                            <motion.div key={review.id} variants={fadeUp}>
                              <HostReviewCard review={review} />
                            </motion.div>
                          ))}
                        </motion.div>
                      </section>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs.Content>

            {/* ── Review guests tab ── */}
            <Tabs.Content value="pending" className="pt-6 space-y-8">
              <AnimatePresence mode="wait">
                {pendingLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
                    <Spinner size="lg" />
                  </motion.div>
                ) : (
                  <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

                    {/* ── Written reviews section ── */}
                    {(writtenGuestReviews as any[]).length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <h2 className="text-sm font-semibold text-neutral-700">{t('writtenGuestReviews')}</h2>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            {(writtenGuestReviews as any[]).length}
                          </span>
                        </div>
                        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
                          {(writtenGuestReviews as any[]).map((review: any) => {
                            const guestAvatarSrc = review.reviewedUser?.avatarUrl ?? review.reviewedUser?.avatar;
                            return (
                              <motion.div
                                key={review.id}
                                variants={fadeUp}
                                className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
                              >
                                <Avatar
                                  src={guestAvatarSrc}
                                  firstName={review.reviewedUser?.firstName}
                                  lastName={review.reviewedUser?.lastName}
                                  size="lg"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-neutral-900 truncate">
                                    {review.reviewedUser?.firstName} {review.reviewedUser?.lastName}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                                    <Home className="h-3 w-3" />
                                    <span className="truncate">{review.property?.title}</span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < review.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditingGuestReview({ booking: { id: review.bookingId, checkIn: '', checkOut: '', guest: review.reviewedUser, property: review.property }, review })}
                                    className="flex items-center gap-1 rounded-xl border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    {t('edit')}
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      if (window.confirm(t('confirmDeleteGuestReview'))) {
                                        deleteGuestReviewMutation.mutate(review.id);
                                      }
                                    }}
                                    disabled={deleteGuestReviewMutation.isPending}
                                    className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </section>
                    )}

                    {/* ── Pending bookings section ── */}
                    {pendingGuestReviews.length === 0 && (writtenGuestReviews as any[]).length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl border border-neutral-200 bg-white p-16 text-center"
                      >
                        <p className="text-5xl mb-4">🏆</p>
                        <h2 className="text-lg font-semibold text-neutral-900">{t('allCaughtUp')}</h2>
                        <p className="text-sm text-neutral-500 mt-1">{t('noPendingReviewsDesc')}</p>
                      </motion.div>
                    ) : pendingGuestReviews.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100">
                            <PenLine className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <h2 className="text-sm font-semibold text-neutral-700">{t('awaitingYourReview')}</h2>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {pendingGuestReviews.length}
                          </span>
                        </div>
                        <motion.div
                          variants={stagger}
                          initial="hidden"
                          animate="show"
                          className="grid gap-4 sm:grid-cols-2"
                        >
                          {pendingGuestReviews.map((booking: any) => {
                            const guestAvatarSrc = booking.guest?.avatarUrl ?? booking.guest?.avatar;
                            return (
                              <motion.div
                                key={booking.id}
                                variants={fadeUp}
                                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                                className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow"
                              >
                                <Avatar
                                  src={guestAvatarSrc}
                                  firstName={booking.guest?.firstName}
                                  lastName={booking.guest?.lastName}
                                  size="lg"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-neutral-900 truncate">
                                    {booking.guest?.firstName} {booking.guest?.lastName}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400">
                                    <Home className="h-3 w-3" />
                                    <span className="truncate">{booking.property?.title}</span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                                    <Clock className="h-3 w-3" />
                                    {t('stayedUntil', { date: formatDate(booking.checkOut, 'MMM d, yyyy') })}
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => setPendingBookingToReview(booking)}
                                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                                >
                                  <PenLine className="h-3.5 w-3.5" />
                                  {t('writeReview')}
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </section>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {pendingBookingToReview && (
        <WriteGuestReviewModal
          booking={pendingBookingToReview}
          onClose={() => setPendingBookingToReview(null)}
          onSuccess={() => setPendingBookingToReview(null)}
        />
      )}

      {editingGuestReview && (
        <WriteGuestReviewModal
          booking={editingGuestReview.booking}
          existingReview={editingGuestReview.review}
          onClose={() => setEditingGuestReview(null)}
          onSuccess={() => setEditingGuestReview(null)}
        />
      )}
    </div>
  );
}


