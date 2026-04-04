'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageSquare, CalendarClock, Home, Compass, ShieldCheck } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { bookingsApi, experienceBookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { getImageUrl, formatPrice, formatDate } from '@/lib/utils';
import type { Booking, BookingStatus, ExperienceBooking, ExperienceBookingStatus } from '@/types';

const statusColors: Record<BookingStatus, 'success' | 'warning' | 'error' | 'default'> = {
  confirmed: 'success',
  in_progress: 'success',
  pending: 'warning',
  cancelled: 'error',
  declined: 'error',
  completed: 'default',
};

const expStatusColors: Record<ExperienceBookingStatus, 'success' | 'warning' | 'error' | 'default'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
  declined: 'error',
  completed: 'default',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

function DepositClaimButton({ bookingId, claimDeadline, amount }: { bookingId: number; claimDeadline?: string | null; amount?: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const deadline = claimDeadline ? new Date(claimDeadline) : null;
  const expired = deadline ? new Date() > deadline : false;
  if (expired) return null;

  const claim = useMutation({
    mutationFn: () => bookingsApi.claimDeposit(bookingId, reason),
    onSuccess: () => {
      toast.success('Deposit claim submitted');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['host-reservations'] });
    },
    onError: () => toast.error('Failed to claim deposit'),
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Claim deposit {amount ? `(${formatPrice(amount, 'EGP')})` : ''}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Claim security deposit</h3>
                {amount ? (
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Deposit amount: <strong className="text-neutral-800">{formatPrice(amount, 'EGP')}</strong>
                  </p>
                ) : null}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Describe the damage clearly. Your claim will be reviewed by our team before any funds are released.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe the damage or reason for claiming the deposit..."
              className="w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {!reason.trim() && reason.length > 0 && (
              <p className="text-xs text-red-500 mt-1">Please provide a reason for your claim.</p>
            )}
            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" isLoading={claim.isPending} onClick={() => claim.mutate()} disabled={!reason.trim()}>
                Submit claim
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReservationCard({
  booking,
  onConfirm,
  onDecline,
}: {
  booking: Booking;
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('hosting');
  const coverImage = booking.property.images?.find((i) => i.isCover)?.url ?? booking.property.images?.[0]?.url;

  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="relative h-32 sm:h-24 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
          {coverImage ? (
            <Image src={getImageUrl(coverImage)} alt={booking.property.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100 flex items-center justify-center text-2xl">🏠</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900 truncate">{booking.property.title}</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                📅 {formatDate(booking.checkIn, 'MMM d')} – {formatDate(booking.checkOut, 'MMM d, yyyy')}
                {' '}· {booking.nights} nights · 👥 {booking.guests} guest{booking.guests > 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant={statusColors[booking.status]} className="shrink-0">{booking.status}</Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Avatar src={booking.guest.avatar} firstName={booking.guest.firstName} lastName={booking.guest.lastName} size="sm" />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {booking.guest.firstName} {booking.guest.lastName}
              </p>
              {(booking.guest.isEmailVerified || booking.guest.isPhoneVerified || (booking.guest as any).isIdVerified) && (
                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                  {booking.guest.isEmailVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">✉️ Email</span>
                  )}
                  {booking.guest.isPhoneVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">📱 Phone</span>
                  )}
                  {(booking.guest as any).isIdVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">🪪 ID</span>
                  )}
                </div>
              )}
              <p className="text-xs text-neutral-500">💰 {formatPrice(booking.total)} total</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {booking.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onConfirm(booking.id)} className="gap-1.5">
                  <Check className="h-4 w-4" />
                  {t('confirmReservation')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDecline(booking.id)} className="gap-1.5">
                  <X className="h-4 w-4" />
                  {t('declineReservation')}
                </Button>
              </>
            )}
            <Link href={`/${locale}/hosting/inbox`}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <MessageSquare className="h-3.5 w-3.5" />
              💬 Message guest
            </Link>

            {/* Security deposit actions */}
            {booking.status === 'completed' && booking.depositStatus === 'held' && (
              <DepositClaimButton
                bookingId={booking.id}
                claimDeadline={booking.depositClaimDeadline}
                amount={booking.depositAmount}
              />
            )}
            {booking.depositStatus === 'claimed' && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="h-3 w-3" /> Deposit claim under review
              </span>
            )}
            {booking.depositStatus === 'released' && (booking.depositAmount ?? 0) > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="h-3 w-3" /> Deposit released to guest
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExperienceReservationCard({
  booking,
  onConfirm,
  onDecline,
}: {
  booking: ExperienceBooking;
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  const locale = useLocale();
  const coverPhoto = booking.experience.photos?.find((p) => p.isCover) ?? booking.experience.photos?.[0];

  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="relative h-32 sm:h-24 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhoto.url} alt={booking.experience.title} className="w-full h-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100 flex items-center justify-center text-2xl">🎭</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900 truncate">{booking.experience.title}</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                📅 {formatDate(booking.bookingDate, 'MMM d, yyyy')} · {booking.startTime}
                {' '}· 👥 {booking.guestsCount} guest{booking.guestsCount > 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant={expStatusColors[booking.status]} className="shrink-0 capitalize">{booking.status}</Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Avatar src={booking.guest.avatar} firstName={booking.guest.firstName} lastName={booking.guest.lastName} size="sm" />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {booking.guest.firstName} {booking.guest.lastName}
              </p>
              {(booking.guest.isEmailVerified || booking.guest.isPhoneVerified || (booking.guest as any).isIdVerified) && (
                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                  {booking.guest.isEmailVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">✉️ Email</span>
                  )}
                  {booking.guest.isPhoneVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">📱 Phone</span>
                  )}
                  {(booking.guest as any).isIdVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">🪪 ID</span>
                  )}
                </div>
              )}
              <p className="text-xs text-neutral-500">💰 ${booking.totalAmount} total</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {booking.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onConfirm(booking.id)} className="gap-1.5">
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDecline(booking.id)} className="gap-1.5">
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </>
            )}
            <Link href={`/${locale}/hosting/inbox`}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <MessageSquare className="h-3.5 w-3.5" />
              💬 Message guest
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReservationsPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const queryClient = useQueryClient();
  const [activeListingType, setActiveListingType] = useState<'properties' | 'experiences'>('properties');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const statuses = ['upcoming', 'pending', 'completed', 'cancelled'] as const;
  const expStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

  const upcomingQuery = useQuery({ queryKey: ['host-reservations', 'upcoming'], queryFn: () => bookingsApi.getHostReservations('upcoming'), enabled: isLoggedIn && isHost, staleTime: 2 * 60 * 1000 });
  const pendingQuery = useQuery({ queryKey: ['host-reservations', 'pending'], queryFn: () => bookingsApi.getHostReservations('pending'), enabled: isLoggedIn && isHost, staleTime: 2 * 60 * 1000 });
  const completedQuery = useQuery({ queryKey: ['host-reservations', 'completed'], queryFn: () => bookingsApi.getHostReservations('completed'), enabled: isLoggedIn && isHost, staleTime: 5 * 60 * 1000 });
  const cancelledQuery = useQuery({ queryKey: ['host-reservations', 'cancelled'], queryFn: () => bookingsApi.getHostReservations('cancelled'), enabled: isLoggedIn && isHost, staleTime: 5 * 60 * 1000 });

  const queryMap: Record<string, { data?: Booking[]; isLoading: boolean }> = {
    upcoming: upcomingQuery,
    pending: pendingQuery,
    completed: completedQuery,
    cancelled: cancelledQuery,
  };

  const expPendingQuery = useQuery({ queryKey: ['host-exp-reservations', 'pending'], queryFn: () => experienceBookingsApi.getHostReservations('pending'), enabled: isLoggedIn && isHost, staleTime: 2 * 60 * 1000 });
  const expConfirmedQuery = useQuery({ queryKey: ['host-exp-reservations', 'confirmed'], queryFn: () => experienceBookingsApi.getHostReservations('confirmed'), enabled: isLoggedIn && isHost, staleTime: 2 * 60 * 1000 });
  const expCompletedQuery = useQuery({ queryKey: ['host-exp-reservations', 'completed'], queryFn: () => experienceBookingsApi.getHostReservations('completed'), enabled: isLoggedIn && isHost, staleTime: 5 * 60 * 1000 });
  const expCancelledQuery = useQuery({ queryKey: ['host-exp-reservations', 'cancelled'], queryFn: () => experienceBookingsApi.getHostReservations('cancelled'), enabled: isLoggedIn && isHost, staleTime: 5 * 60 * 1000 });

  const expQueryMap: Record<string, { data?: ExperienceBooking[]; isLoading: boolean }> = {
    pending: expPendingQuery,
    confirmed: expConfirmedQuery,
    completed: expCompletedQuery,
    cancelled: expCancelledQuery,
  };

  const confirmMutation = useMutation({
    mutationFn: bookingsApi.confirmBooking,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-reservations'] }); toast.success('✅ Reservation confirmed!'); },
    onError: () => toast.error('Failed to confirm'),
  });

  const declineMutation = useMutation({
    mutationFn: bookingsApi.declineBooking,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-reservations'] }); toast.success('Reservation declined'); },
    onError: () => toast.error('Failed to decline'),
  });

  const confirmExpMutation = useMutation({
    mutationFn: experienceBookingsApi.confirm,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-exp-reservations'] }); toast.success('✅ Experience booking confirmed!'); },
    onError: () => toast.error('Failed to confirm'),
  });

  const declineExpMutation = useMutation({
    mutationFn: (id: number) => experienceBookingsApi.decline(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-exp-reservations'] }); toast.success('Experience booking declined'); },
    onError: () => toast.error('Failed to decline'),
  });

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  const tabConfig: Record<string, { label: string; emoji: string; emptyEmoji: string; emptyText: string }> = {
    upcoming: { label: 'Upcoming', emoji: '🗓️', emptyEmoji: '🌅', emptyText: 'No upcoming check-ins yet' },
    pending: { label: 'Pending', emoji: '⏳', emptyEmoji: '✨', emptyText: 'No pending requests — all clear!' },
    completed: { label: 'Completed', emoji: '✅', emptyEmoji: '🏆', emptyText: 'Completed stays will appear here' },
    cancelled: { label: 'Cancelled', emoji: '❌', emptyEmoji: '😌', emptyText: 'No cancellations — great!' },
  };

  const expTabConfig: Record<string, { label: string; emoji: string; emptyEmoji: string; emptyText: string }> = {
    pending: { label: 'Pending', emoji: '⏳', emptyEmoji: '✨', emptyText: 'No pending experience requests' },
    confirmed: { label: 'Confirmed', emoji: '✅', emptyEmoji: '🎭', emptyText: 'No confirmed bookings yet' },
    completed: { label: 'Completed', emoji: '🏆', emptyEmoji: '🏆', emptyText: 'Completed experiences appear here' },
    cancelled: { label: 'Cancelled', emoji: '❌', emptyEmoji: '😌', emptyText: 'No cancellations — great!' },
  };

  const listingTypeTabs = [
    { id: 'properties' as const, label: 'Homes', icon: Home },
    { id: 'experiences' as const, label: 'Experiences', icon: Compass },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.09),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.07),transparent_35%)]" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}
          className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <CalendarClock className="h-3.5 w-3.5" />
                🗓️ Reservation operations
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-900">{t('reservations')}</h1>
              <p className="mt-1 text-sm text-neutral-500">Review check-ins, reply fast, and keep occupancy stable.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/hosting/reservations-calendar`}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <CalendarClock className="h-4 w-4 text-indigo-500" />
                Calendar View
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                ⚡ Reply within 24h
              </div>
            </div>
          </div>
        </motion.div>

        {/* Outer listing type tabs */}
        <div className="mb-6 flex border-b border-neutral-200 bg-white rounded-t-2xl overflow-hidden">
          {listingTypeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeListingType === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveListingType(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeListingType === 'properties' ? (
          <Tabs.Root defaultValue="upcoming">
            <Tabs.List className="relative flex gap-0 border-b border-neutral-200 mb-8 overflow-x-auto">
              {statuses.map((status) => {
                const q = queryMap[status];
                const count = q?.data?.length ?? 0;
                const cfg = tabConfig[status];
                return (
                  <Tabs.Trigger key={status} value={status}
                    className="relative px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0">
                    <span>{cfg.emoji} {cfg.label}</span>
                    {count > 0 && (
                      <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-1">
                        {count}
                      </span>
                    )}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            {statuses.map((reservationStatus) => {
              const q = queryMap[reservationStatus];
              const bookings = q?.data ?? [];
              const cfg = tabConfig[reservationStatus];
              return (
                <Tabs.Content key={reservationStatus} value={reservationStatus}>
                  <AnimatePresence mode="wait">
                    {q?.isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex justify-center py-16">
                        <Spinner size="lg" />
                      </motion.div>
                    ) : bookings.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex flex-col items-center py-24 gap-3 text-center">
                        <motion.p className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                          {cfg.emptyEmoji}
                        </motion.p>
                        <p className="text-lg font-semibold text-neutral-700">{cfg.emptyText}</p>
                        <p className="text-sm text-neutral-400">{t('noReservations')}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                        {bookings.map((booking) => (
                          <ReservationCard key={booking.id} booking={booking}
                            onConfirm={(id) => confirmMutation.mutate(id)}
                            onDecline={(id) => declineMutation.mutate(id)} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tabs.Content>
              );
            })}
          </Tabs.Root>
        ) : (
          <Tabs.Root defaultValue="pending">
            <Tabs.List className="relative flex gap-0 border-b border-neutral-200 mb-8 overflow-x-auto">
              {expStatuses.map((status) => {
                const q = expQueryMap[status];
                const count = q?.data?.length ?? 0;
                const cfg = expTabConfig[status];
                return (
                  <Tabs.Trigger key={status} value={status}
                    className="relative px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0">
                    <span>{cfg.emoji} {cfg.label}</span>
                    {count > 0 && (
                      <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-1">
                        {count}
                      </span>
                    )}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            {expStatuses.map((expStatus) => {
              const q = expQueryMap[expStatus];
              const bookings = q?.data ?? [];
              const cfg = expTabConfig[expStatus];
              return (
                <Tabs.Content key={expStatus} value={expStatus}>
                  <AnimatePresence mode="wait">
                    {q?.isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex justify-center py-16">
                        <Spinner size="lg" />
                      </motion.div>
                    ) : bookings.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex flex-col items-center py-24 gap-3 text-center">
                        <motion.p className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                          {cfg.emptyEmoji}
                        </motion.p>
                        <p className="text-lg font-semibold text-neutral-700">{cfg.emptyText}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                        {bookings.map((booking) => (
                          <ExperienceReservationCard key={booking.id} booking={booking}
                            onConfirm={(id) => confirmExpMutation.mutate(id)}
                            onDecline={(id) => declineExpMutation.mutate(id)} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tabs.Content>
              );
            })}
          </Tabs.Root>
        )}
      </div>
    </div>
  );
}
