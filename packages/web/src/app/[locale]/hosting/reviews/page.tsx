'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Star, MessageCircle, UserCheck, Clock,
  PenLine, Home, CheckCircle2,
} from 'lucide-react';
import { propertiesApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { HostReviewCard } from '@/components/hosting/HostReviewCard';
import { WriteGuestReviewModal } from '@/components/hosting/WriteGuestReviewModal';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';

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
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const [pendingBookingToReview, setPendingBookingToReview] = useState<any>(null);

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: properties = [] } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => propertiesApi.getMyProperties(),
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
    { icon: Star,          label: 'Avg Rating',      value: avgRating ?? '—',   color: 'bg-amber-50 text-amber-500' },
    { icon: MessageCircle, label: 'Need Reply',       value: unreplied.length,   color: 'bg-violet-50 text-violet-600' },
    { icon: UserCheck,     label: 'Total Reviews',    value: allReviews.length,  color: 'bg-indigo-50 text-indigo-600' },
    { icon: PenLine,       label: 'Guest Reviews Due', value: pendingGuestReviews.length, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <>
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
                  ⭐ Review management
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-neutral-900">
                  {t('guestReviews') ?? 'Guest Reviews'}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {t('guestReviewsDesc') ?? 'Read and reply to guest reviews, and review guests after their stay.'}
                </p>
              </div>
              {pendingGuestReviews.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  ✍️ {pendingGuestReviews.length} guest{pendingGuestReviews.length > 1 ? 's' : ''} to review
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
                { value: 'received', label: 'Received Reviews', emoji: '⭐', count: allReviews.length },
                { value: 'pending',  label: 'Review Guests',    emoji: '✍️', count: pendingGuestReviews.length },
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
                    <h2 className="text-lg font-semibold text-neutral-900">{t('noReviewsYet') ?? 'No reviews yet'}</h2>
                    <p className="text-sm text-neutral-500 mt-1">{t('noReviewsYetDesc') ?? 'Reviews from your guests will appear here.'}</p>
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
                            {t('awaitingReply') ?? 'Awaiting your reply'}
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
                            {t('repliedReviews') ?? 'Replied'}
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
            <Tabs.Content value="pending" className="pt-6">
              <AnimatePresence mode="wait">
                {pendingLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
                    <Spinner size="lg" />
                  </motion.div>
                ) : pendingGuestReviews.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-neutral-200 bg-white p-16 text-center"
                  >
                    <p className="text-5xl mb-4">🏆</p>
                    <h2 className="text-lg font-semibold text-neutral-900">All caught up!</h2>
                    <p className="text-sm text-neutral-500 mt-1">No pending guest reviews — completed stays will appear here.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pending-list"
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
                              Stayed until {formatDate(booking.checkOut, 'MMM d, yyyy')}
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setPendingBookingToReview(booking)}
                            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            Review
                          </motion.button>
                        </motion.div>
                      );
                    })}
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
    </>
  );
}


