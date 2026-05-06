'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, CreditCard, AlertTriangle, Scale, Home, Compass, Star, MessageSquareWarning, Printer, QrCode, Download, RefreshCw, CheckCircle, ImagePlus, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Check, Pencil, Trash2, X } from 'lucide-react';
import { PaymentMethodModal } from '@/components/payment/PaymentMethodModal';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { bookingsApi, disputesApi, experienceBookingsApi, experienceReviewsApi, reviewsApi, paymentsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { getImageUrl, formatDate } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { Booking, BookingStatus, ExperienceBooking, ExperienceBookingStatus } from '@/types';
import { cn } from '@/lib/utils';

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

// ─── Emoji reactions (replaces star ratings) ─────────────────────────────────
const EMOJI_REACTIONS = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Poor' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

function EmojiRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const selectedReaction = EMOJI_REACTIONS.find(r => r.value === value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 items-end">
        {EMOJI_REACTIONS.map(({ value: v, emoji, label }) => {
          const isSelected = value === v;
          const isHovered = hovered === v;
          const isDimmed = hovered !== null
            ? (!isHovered && !isSelected)
            : (value > 0 && !isSelected);
          return (
            <div key={v} className="relative flex flex-col items-center">
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && !isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.8 }}
                    transition={{ duration: 0.12 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-medium rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none z-10 shadow-lg"
                  >
                    {label}
                    <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-900" />
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Selected glow ring */}
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -inset-1.5 rounded-full bg-indigo-100 ring-2 ring-indigo-400 pointer-events-none z-0"
                  />
                )}
              </AnimatePresence>
              <motion.button
                type="button"
                onClick={() => onChange(v)}
                onHoverStart={() => setHovered(v)}
                onHoverEnd={() => setHovered(null)}
                animate={
                  isHovered
                    ? { scale: 1.55, y: -10 }
                    : isSelected
                      ? { scale: 1.4, y: -6 }
                      : { scale: 1, y: 0 }
                }
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="relative text-2xl focus:outline-none select-none leading-none z-10"
                style={{ opacity: isDimmed ? 0.28 : 1 }}
            >
              {emoji}
            </motion.button>
          </div>
        );
      })}
      </div>
      {/* Persistent label for selected emoji */}
      <div className="h-4">
        <AnimatePresence mode="wait">
          {selectedReaction && (
            <motion.p
              key={selectedReaction.value}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs font-semibold text-indigo-600 text-center leading-none"
            >
              {selectedReaction.label}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ExperienceBookingCard({
  booking,
  onCancel,
  onPay,
  onReviewSubmitted,
}: {
  booking: ExperienceBooking;
  onCancel: (id: number) => void;
  onPay: (booking: ExperienceBooking) => void;
  onReviewSubmitted: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('trips');
  const tCommon = useTranslations('common');
  const { formatPrice } = useCurrency();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [overallRating, setOverallRating] = useState(5);
  const [hostRating, setHostRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const coverPhoto = booking.experience.photos?.find((p: any) => p.isCover) ?? booking.experience.photos?.[0];
  const needsPayment =
    booking.status === 'confirmed' && (!booking.paymentStatus || booking.paymentStatus === 'pending');
  // Hide cancel button if the experience date has already started
  const canCancel =
    (booking.status === 'confirmed' || booking.status === 'pending') &&
    new Date(booking.bookingDate) > new Date(new Date().toDateString());
  const canReview = booking.status === 'completed' && !booking.review;

  const handleSubmitReview = async () => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      await experienceReviewsApi.create({
        bookingId: booking.id,
        overallRating,
        hostRating,
        valueRating,
        comment: comment || undefined,
      });
      toast.success(t('reviewSubmitted'));
      setReviewOpen(false);
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('failedSubmitReview'));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
    <div className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-neutral-100 p-4 hover:shadow-md transition-shadow bg-white">
      {/* Image */}
      <div className="relative h-40 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-neutral-200">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={booking.experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="h-full w-full bg-neutral-200 flex items-center justify-center text-3xl">🎭</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-neutral-900 truncate">{booking.experience.title}</h3>
            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {booking.experience.city}, {booking.experience.country}
            </p>
          </div>
          <Badge variant={expStatusColors[booking.status]} className="shrink-0 capitalize">
            {t(booking.status as any)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-neutral-600">
          <span>
            📅 <strong>{formatDate(booking.bookingDate, 'MMM d, yyyy')}</strong> at {booking.startTime}
          </span>
          <span>
            👥 <strong>{t('guestCount', { count: booking.guestsCount })}</strong>
          </span>
          <span>
            {t('totalAmount')}: <strong>{formatPrice(Number(booking.totalAmount), 'EGP')}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {/* — Navigation link — */}
          <Link
            href={`/${locale}/experiences/${booking.experience.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            {t('viewExperience')}
          </Link>

          {/* — Primary CTA: Pay Now — */}
          {needsPayment && (
            <button
              onClick={() => onPay(booking)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:brightness-110 transition-all shadow-sm shadow-indigo-500/25"
            >
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              {booking.paymentStatus === 'declined' ? t('retryPayment') : t('payNow')}
            </button>
          )}

          {/* — Status chips — */}
          {booking.paymentStatus === 'submitted' && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {t('paymentUnderReview')}
            </span>
          )}
          {booking.paymentStatus === 'declined' && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {t('paymentNotVerified')}
            </span>
          )}
          {(booking.status === 'pending') && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <RefreshCw className="h-3 w-3 shrink-0" />
              {t('awaitingConfirmation')}
            </span>
          )}

          {/* — Review — */}
          {canReview && (
            <button
              onClick={() => setReviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Star className="h-3.5 w-3.5 shrink-0" />
              {t('leaveReview')}
            </button>
          )}
          {booking.review && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
              {t('reviewedRating', { rating: booking.review.overallRating })}
            </span>
          )}

          {/* — Destructive: Cancel — */}
          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              {t('cancelBooking')}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Review Modal */}
    <Modal open={reviewOpen} onOpenChange={setReviewOpen}>
      <div className="p-6 space-y-5 max-w-md">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
            <Star className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{t('reviewYourExperience')}</h3>
            <p className="text-sm text-indigo-500 font-medium">{booking.experience.title}</p>
          </div>
        </div>

        <div className="space-y-2">
          {([
            { label: t('overall'), value: overallRating, set: setOverallRating },
            { label: t('host'), value: hostRating, set: setHostRating },
            { label: t('value'), value: valueRating, set: setValueRating },
          ] as const).map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between bg-indigo-50/40 rounded-xl px-4 py-3">
              <label className="text-sm font-semibold text-indigo-800 w-20 shrink-0">{label}</label>
              <EmojiRating value={value} onChange={(v) => set(v)} />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('commentLabel')} <span className="font-normal text-neutral-400">({t('optional')})</span></label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
            placeholder={t('sharePlaceholderExp')}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setReviewOpen(false)}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition shadow-sm"
          >
            {submittingReview ? t('submittingReview') : t('submitReview')}
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
}

/**
 * Returns which refund tier the guest is currently in based on policy + days until check-in.
 * Returns null if check-in has passed or the status doesn't need a badge.
 */
function getCancellationTierInfo(policy: string | null | undefined, checkIn: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(checkIn + 'T00:00:00'); // parse as local midnight
  const daysUntil = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 0) return null;

  switch (policy) {
    case 'flexible':
      // full refund if ≥1 day (24 h) before check-in
      return { tier: 'full', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: '🟢', textKey: 'cancellationFree' as const };
    case 'moderate':
      if (daysUntil >= 5)
        return { tier: 'full', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: '\uD83D\uDFE2', textKey: 'cancellationFree' as const };
      return { tier: 'partial', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: '\uD83D\uDFE1', textKey: 'cancellationPartial' as const };
    case 'strict':
      if (daysUntil >= 14)
        return { tier: 'full', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: '\uD83D\uDFE2', textKey: 'cancellationFree' as const };
      if (daysUntil >= 7)
        return { tier: 'partial', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: '\uD83D\uDFE1', textKey: 'cancellationPartial' as const };
      return { tier: 'none', color: 'text-red-700 bg-red-50 border-red-200', dot: '\uD83D\uDD34', textKey: 'cancellationNone' as const };
    default:
      return { tier: 'full', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: '\uD83D\uDFE2', textKey: 'cancellationFree' as const };
  }
}

function BookingCard({
  booking,
  onCancel,
  onPay,
  onReviewSubmitted,
  existingDisputeId,
}: {
  booking: Booking;
  onCancel: (id: number) => void;
  onPay: (booking: Booking) => void;
  onReviewSubmitted: () => void;
  existingDisputeId?: string | number;
}) {
  const locale = useLocale();
  const t = useTranslations('trips');
  const tCommon = useTranslations('common');
  const { formatPrice } = useCurrency();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [overallRating, setOverallRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [locationRating, setLocationRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [checkinRating, setCheckinRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const queryClient = useQueryClient();
  const [reviewPhotoFiles, setReviewPhotoFiles] = useState<File[]>([]);
  // G9: human-readable short code
  const shortCode = `STAY-${booking.id.toString(36).toUpperCase().padStart(4, '0')}`;
  const coverImage =
    booking.property.images?.find((i) => i.isCover)?.url ?? booking.property.images?.[0]?.url;

  // Show Pay Now when host confirmed but guest hasn't paid yet (also allow retry after decline)
  const needsPayment = booking.status === 'confirmed' && (!booking.paymentStatus || booking.paymentStatus === 'pending' || booking.paymentStatus === 'declined');
  // Cancel visibility is policy-aware:
  //  flexible  (partialWindow=0): allow same-day cancellation if before check-in time
  //  moderate  (partialWindow=1): must be at least 1 day before check-in
  //  strict    (partialWindow=7): must be at least 7 days before check-in
  const todayDateStr = new Date().toLocaleDateString('sv'); // 'sv' locale → YYYY-MM-DD in local tz
  const todayLocal = new Date(todayDateStr + 'T00:00:00');
  const checkInLocal = new Date(booking.checkIn + 'T00:00:00');
  const daysUntilCheckIn = Math.round((checkInLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24));
  const policyPartialWindow: Record<string, number> = { flexible: 0, moderate: 1, strict: 7 };
  const partialWindow = policyPartialWindow[booking.cancellationPolicy ?? 'flexible'] ?? 0;
  const checkInAfterStr: string =
    ((booking.property as any).checkInAfter as string | undefined) ||
    booking.property.checkInTime ||
    '15:00';
  const [ciH, ciM] = checkInAfterStr.split(':').map(Number);
  const checkInMinutesOfDay = ciH * 60 + ciM;
  const now = new Date();
  const nowMinutesOfDay = now.getHours() * 60 + now.getMinutes();
  // For flexible (partialWindow=0): allow cancel on check-in day if before check-in time
  // For other policies: require daysUntilCheckIn > partialWindow (strictly past the no-refund zone)
  const withinCancellableWindow =
    daysUntilCheckIn > partialWindow ||
    (partialWindow === 0 && daysUntilCheckIn === 0 && nowMinutesOfDay < checkInMinutesOfDay);
  const canCancelStay =
    (booking.status === 'confirmed' || booking.status === 'pending') &&
    withinCancellableWindow;
  const cancelTierInfo = canCancelStay ? getCancellationTierInfo(booking.cancellationPolicy, booking.checkIn) : null;

  const openEditReview = () => {
    const r = (booking as any).review;
    if (!r) return;
    setOverallRating(r.overallRating ?? r.rating ?? 5);
    setCleanlinessRating(r.cleanlinessRating ?? 5);
    setCommunicationRating(r.communicationRating ?? 5);
    setLocationRating(r.locationRating ?? 5);
    setValueRating(r.valueRating ?? 5);
    setCheckinRating(r.checkinRating ?? 5);
    setComment(r.comment ?? '');
    setReviewPhotoFiles([]);
    setIsEditMode(true);
    setReviewOpen(true);
  };

  const handleDeleteReview = async () => {
    const r = (booking as any).review;
    if (!r || deletingReview) return;
    setDeleteConfirmOpen(false);
    setDeletingReview(true);
    try {
      await reviewsApi.deleteReview(r.id);
      toast.success(t('reviewDeleted'));
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('failedDeleteReview'));
    } finally {
      setDeletingReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      const basePayload = {
        overallRating,
        cleanlinessRating,
        communicationRating,
        locationRating,
        valueRating,
        checkinRating,
        comment: comment || undefined,
      };
      let reviewId: number;
      if (isEditMode && (booking as any).review) {
        const updated = await reviewsApi.updateReview((booking as any).review.id, basePayload);
        reviewId = updated.id;
      } else {
        const created = await reviewsApi.createReview({ bookingId: booking.id, ...basePayload });
        reviewId = created.id;
      }
      if (reviewPhotoFiles.length > 0) {
        await reviewsApi.uploadReviewPhotos(reviewId, reviewPhotoFiles);
      }
      toast.success(isEditMode ? t('reviewUpdated') : t('reviewSubmitted'));
      setReviewOpen(false);
      setIsEditMode(false);
      setReviewPhotoFiles([]);
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('failedSubmitReview'));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
    <div className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-neutral-100 p-4 hover:shadow-md transition-shadow bg-white">
      {/* Image */}
      <div className="relative h-40 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-neutral-200">
        {coverImage ? (
          <Image
            src={getImageUrl(coverImage)}
            alt={booking.property.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-neutral-200" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-neutral-900 truncate">{booking.property.title}</h3>
            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {booking.property.city}, {booking.property.country}
            </p>
            {/* G9: Short code */}
            <p className="text-xs text-neutral-400 font-mono mt-0.5">{shortCode}</p>
          </div>
          <Badge variant={statusColors[booking.status]} className="shrink-0">
            {t(booking.status as any)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-neutral-600">
          <span>
            {t('checkIn')}: <strong>{formatDate(booking.checkIn, 'MMM d, yyyy')}</strong>
            {((booking.property as any).checkInAfter || booking.property.checkInTime) && (
              <span className="ms-1 text-neutral-400 font-normal">
                {t('checkInFrom', { time: ((booking.property as any).checkInAfter || booking.property.checkInTime)?.slice(0, 5) ?? '' })}
              </span>
            )}
          </span>
          <span>
            {t('checkOut')}: <strong>{formatDate(booking.checkOut, 'MMM d, yyyy')}</strong>
            {((booking.property as any).checkOutBefore || booking.property.checkOutTime) && (
              <span className="ms-1 text-neutral-400 font-normal">
                {t('checkOutBy', { time: ((booking.property as any).checkOutBefore || booking.property.checkOutTime)?.slice(0, 5) ?? '' })}
              </span>
            )}
          </span>
          <span>
            {t('totalAmount')}: <strong>{formatPrice(Number(booking.total), booking.currency ?? 'EGP')}</strong>
          </span>
        </div>

        {/* Cancellation policy tier badge — only for upcoming confirmed/pending */}
        {cancelTierInfo && (
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cancelTierInfo.color}`}>
              <span aria-hidden>{cancelTierInfo.dot}</span>
              {t(cancelTierInfo.textKey)}
              {booking.cancellationPolicy && (
                <span className="opacity-60 font-normal capitalize">· {booking.cancellationPolicy}</span>
              )}
            </span>
          </div>
        )}

        {/* Refund / cancellation fee for cancelled bookings */}
        {booking.status === 'cancelled' && (booking.refundAmount !== undefined || booking.cancellationFee !== undefined) && (
          <div className="mt-3 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700 space-y-0.5">
            {Number(booking.refundAmount) > 0 && booking.paymentStatus === 'refunded' && (
              <p>✅ {t('refundProcessed', { amount: formatPrice(Number(booking.refundAmount!), booking.currency ?? 'EGP') })}</p>
            )}
            {Number(booking.refundAmount) > 0 && booking.paymentStatus !== 'refunded' && booking.paymentMethod === 'instapay' && (
              <>
                <p>⏳ {t('manualRefundPending', { amount: formatPrice(Number(booking.refundAmount!), booking.currency ?? 'EGP') })}</p>
                <p className="text-xs text-neutral-500 mt-0.5">⏱ {t('refundProcessingNote')}</p>
              </>
            )}
            {Number(booking.refundAmount) > 0 && booking.paymentStatus !== 'refunded' && booking.paymentMethod === 'opay-card' && (
              <p>⚠️ {t('refundAutoFailed', { amount: formatPrice(Number(booking.refundAmount!), booking.currency ?? 'EGP') })}</p>
            )}
            {Number(booking.cancellationFee) > 0 && (
              <p>⚠️ <span className="font-medium">{t('cancellationFee')}:</span> {formatPrice(Number(booking.cancellationFee!), booking.currency ?? 'EGP')}</p>
            )}
            {Number(booking.refundAmount) === 0 && Number(booking.cancellationFee) === 0 && (
              <p className="text-neutral-500">{t('noFinancialAction')}</p>
            )}
            {booking.cancellationPolicy && (
              <p className="text-neutral-500 capitalize">{t('policy')}: {booking.cancellationPolicy}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-5">
          {/* — Navigation links — */}
          <Link
            href={`/${locale}/rooms/${booking.property.uuid || booking.property.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            {t('viewProperty')}
          </Link>
          <Link
            href={`/${locale}/trips/${booking.bookingUuid ?? booking.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            {t('viewDetails')}
          </Link>

          {/* G8: Export / Print */}
          <Link
            href={`/${locale}/trips/${booking.bookingUuid ?? booking.id}/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 shrink-0" />
            {t('exportPrint')}
          </Link>

          {/* — Primary CTA: Pay Now — */}
          {needsPayment && (
            <button
              onClick={() => onPay(booking)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:brightness-110 transition-all shadow-sm shadow-indigo-500/25"
            >
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              {booking.paymentStatus === 'declined' ? t('retryPayment') : t('payNow')}
            </button>
          )}

          {/* — Status chips — */}
          {booking.paymentStatus === 'submitted' && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {t('paymentUnderReview')}
            </span>
          )}
          {booking.paymentStatus === 'declined' && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {t('paymentNotVerified')}
            </span>
          )}
          {booking.status === 'pending' && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <RefreshCw className="h-3 w-3 shrink-0" />
              {t('awaitingConfirmation')}
            </span>
          )}

          {/* — Review — */}
          {(booking.status === 'completed' ||
            (booking.status === 'confirmed' && new Date(booking.checkOut) < new Date())) &&
            !(booking as any).review && (
            <button
              onClick={() => { setIsEditMode(false); setReviewOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Star className="h-3.5 w-3.5 shrink-0" />
              {t('reviewTrip')}
            </button>
          )}
          {(booking as any).review && (
            <button
              onClick={openEditReview}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Star className="h-3.5 w-3.5 fill-indigo-500 text-indigo-500 shrink-0" />
              {t('yourReview')}
              <span className="ms-0.5 text-xs font-bold text-amber-500">★ {(booking as any).review.overallRating ?? (booking as any).review.rating}</span>
            </button>
          )}

          {/* — Dispute / Report — */}
          {existingDisputeId ? (
            <Link
              href={`/${locale}/trips/disputes/${existingDisputeId}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Scale className="h-3.5 w-3.5 shrink-0" />
              {t('viewDispute')}
            </Link>
          ) : (
            <>
              {(booking.status === 'completed' || booking.status === 'cancelled') && (
                <Link
                  href={`/${locale}/trips/dispute/${booking.bookingUuid ?? booking.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  <Scale className="h-3.5 w-3.5 shrink-0" />
                  {t('openDispute')}
                </Link>
              )}
              {booking.status === 'confirmed' && new Date(booking.checkIn) <= new Date() && (
                <Link
                  href={`/${locale}/trips/dispute/${booking.bookingUuid ?? booking.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {t('reportProblem')}
                </Link>
              )}
              {booking.status === 'in_progress' && (
                <Link
                  href={`/${locale}/trips/dispute/${booking.bookingUuid ?? booking.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {t('reportProblemDuringStay')}
                </Link>
              )}
            </>
          )}

          {/* W17: Invoice download */}
          {(booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') && (
            <button
              onClick={async () => {
                try {
                  const blob = await bookingsApi.downloadInvoice(booking.id);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `invoice-${booking.bookingRef ?? booking.bookingUuid ?? booking.id}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch {
                  toast.error(t('invoiceDownloadFailed') ?? 'Failed to download invoice');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              {t('downloadInvoice') ?? 'Invoice'}
            </button>
          )}

          {/* W2: Refund request */}
          {booking.status === 'cancelled' && booking.paymentStatus === 'paid' && (
            <button
              onClick={async () => {
                try {
                  await paymentsApi.refund(booking.id);
                  toast.success(t('refundRequested') ?? 'Refund requested successfully');
                  queryClient.invalidateQueries({ queryKey: ['trips'] });
                } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? t('refundRequestFailed') ?? 'Refund request failed');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              {t('requestRefund') ?? 'Request Refund'}
            </button>
          )}

          {/* — Destructive: Cancel — */}
          {canCancelStay && (
            <button
              onClick={() => onCancel(booking.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              {t('cancelTrip')}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Review Modal */}
    <Modal open={reviewOpen} onOpenChange={(open) => { setReviewOpen(open); if (!open) setIsEditMode(false); }}>
      <div className="p-6 space-y-4 max-w-md">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
            <Star className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{isEditMode ? t('editYourReview') : t('reviewYourStay')}</h3>
            <p className="text-sm text-indigo-500 font-medium">{booking.property.title}</p>
          </div>
        </div>

        <div className="space-y-2">
          {([
            { label: t('overall'), value: overallRating, set: setOverallRating },
            { label: t('cleanliness'), value: cleanlinessRating, set: setCleanlinessRating },
            { label: t('communication'), value: communicationRating, set: setCommunicationRating },
            { label: t('location'), value: locationRating, set: setLocationRating },
            { label: t('value'), value: valueRating, set: setValueRating },
            { label: t('checkInRating'), value: checkinRating, set: setCheckinRating },
          ] as const).map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between bg-indigo-50/40 rounded-xl px-3 py-2.5">
              <label className="text-xs font-semibold text-indigo-800 w-24 shrink-0">{label}</label>
              <EmojiRating value={value} onChange={(v) => set(v)} />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('commentLabel')} <span className="font-normal text-neutral-400">({t('optional')})</span></label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
            placeholder={t('sharePlaceholderStay')}
          />
        </div>

        {/* M-05: Review photo upload — file picker replaces raw URL input */}
        <div>
          {/* Show existing saved photos when editing */}
          {isEditMode && (() => {
            const existingPhotos: string[] = (booking as any).review?.photos ?? [];
            if (existingPhotos.length === 0) return null;
            const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
            const resolved = existingPhotos.map((url) => url.startsWith('http') ? url : `${backendUrl}${url}`);
            return (
              <div className="mb-3">
                <p className="text-xs font-medium text-neutral-500 mb-2">Current photos</p>
                <div className="flex flex-wrap gap-2">
                  {resolved.map((src, i) => (
                    <button key={i} type="button" onClick={() => { setLightboxPhotos(resolved); setLightboxIndex(i); }}
                      className="rounded-xl overflow-hidden border border-indigo-100 hover:scale-105 transition-transform focus:outline-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Review photo ${i + 1}`} className="h-16 w-16 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('reviewPhotosLabel')} <span className="font-normal text-neutral-400">({t('optional')})</span></label>
          <label className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-xl border-2 border-dashed border-indigo-200 px-3 py-4 text-sm text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/40 transition">
            <ImagePlus className="h-4 w-4" />
            {reviewPhotoFiles.length === 0
              ? t('uploadPhotos')
              : t('photosSelected', { count: reviewPhotoFiles.length })}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => setReviewPhotoFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            />
          </label>
          {reviewPhotoFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {reviewPhotoFiles.map((file, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="h-14 w-14 rounded-lg object-cover border border-indigo-100" />
                  <button type="button" onClick={() => setReviewPhotoFiles(p => p.filter((_, j) => j !== i))}
                    className="absolute -top-1 end-[-4px] bg-white border border-neutral-200 rounded-full h-4 w-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-red-500">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEditMode && (
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={deletingReview}
            className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deletingReview ? t('deletingReview') : t('deleteReview')}
          </button>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => { setReviewOpen(false); setIsEditMode(false); }}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition shadow-sm"
          >
            {submittingReview ? t('submittingReview') : isEditMode ? t('saveChangesReview') : t('submitReview')}
          </button>
        </div>
      </div>
    </Modal>

    {/* Delete review confirm modal */}
    <Modal open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <div className="flex flex-col gap-4 p-1">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">{t('deleteReviewTitle')}</h3>
          <p className="text-sm text-neutral-500">{t('deleteReviewDesc')}</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setDeleteConfirmOpen(false)}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleDeleteReview}
            disabled={deletingReview}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {deletingReview ? t('deletingReview') : t('yesDelete')}
          </button>
        </div>
      </div>
    </Modal>

    {/* Photo lightbox */}
    <AnimatePresence>
      {lightboxPhotos.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxPhotos([])}
          >
            <button
              className="absolute top-4 end-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
              onClick={() => setLightboxPhotos([])}
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length); }}
                  className="absolute start-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
                >
                  <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % lightboxPhotos.length); }}
                  className="absolute end-14 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
                >
                  <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                </button>
              </>
            )}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              src={lightboxPhotos[lightboxIndex]}
              alt="Review photo"
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxPhotos.length > 1 && (
              <div className="absolute bottom-4 flex gap-1.5">
                {lightboxPhotos.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === lightboxIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>

    </>
  );
}

export default function TripsPage() {
  const t = useTranslations('trips');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, hasHydrated } = useAuth();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const [listingType, setListingType] = useState<'stays' | 'experiences'>('stays');
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [payingExpBooking, setPayingExpBooking] = useState<ExperienceBooking | null>(null);
  const [cancelPreviewId, setCancelPreviewId] = useState<number | null>(null);
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null);
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonOpen, setCancelReasonOpen] = useState(false);
  const cancelReasonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cancelReasonOpen) return;
    const handler = (e: MouseEvent) => {
      if (cancelReasonRef.current && !cancelReasonRef.current.contains(e.target as Node)) {
        setCancelReasonOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cancelReasonOpen]);
  const [paymentSuccessDismissed, setPaymentSuccessDismissed] = useState(false);
  // M-01: track which booking card to highlight after payment redirect
  const [highlightBookingId, setHighlightBookingId] = useState<number | null>(null);

  // W10: Detect payment return from OPay / 3DS redirect
  const paymentSuccess = searchParams.get('payment') === 'success';
  const paymentBookingId = searchParams.get('bookingId');

  const CANCEL_REASONS = [
    { value: 'plans_changed', label: t('reasonPlansChanged') },
    { value: 'found_alternative', label: t('reasonFoundAlternative') },
    { value: 'host_unresponsive', label: t('reasonHostUnresponsive') },
    { value: 'pricing_issue', label: t('reasonPricingIssue') },
    { value: 'personal_emergency', label: t('reasonPersonalEmergency') },
    { value: 'travel_restrictions', label: t('reasonTravelRestrictions') },
    { value: 'property_concerns', label: t('reasonPropertyConcerns') },
    { value: 'other', label: t('reasonOther') },
  ];

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: allTrips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: () => bookingsApi.getMyTrips(),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // M-01: scroll to and briefly highlight the booking returned from OPay redirect
  useEffect(() => {
    if (!paymentBookingId || loadingTrips) return;
    const id = Number(paymentBookingId);
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-booking-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightBookingId(id);
        setTimeout(() => setHighlightBookingId(null), 3000);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [paymentBookingId, loadingTrips]);

  const { data: myDisputes = [] } = useQuery({
    queryKey: ['my-disputes'],
    queryFn: () => disputesApi.getMyDisputes(),
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  // Map bookingId -> dispute uuid for fast lookup
  const disputeByBookingId = Object.fromEntries(
    (myDisputes as any[]).map((d: any) => [d.bookingId, d.uuid ?? d.id]),
  );

  const { data: allExpTrips = [], isLoading: loadingExpTrips } = useQuery({
    queryKey: ['exp-trips'],
    queryFn: () => experienceBookingsApi.getMyTrips(),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cancelCurrency = allTrips.find((b) => b.id === cancelPreviewId)?.currency ?? 'EGP';

  const cancelled = allTrips.filter((booking) =>
    booking.status === 'cancelled' || booking.status === 'declined'
  );

  // Only show in_progress bookings whose checkout date hasn't fully passed yet.
  // Once checkOut < today the scheduler will complete them; in the meantime
  // they must not appear in Active — they'll already be in Past.
  const active = allTrips.filter((booking) => {
    if (booking.status !== 'in_progress') return false;
    const checkOut = new Date(booking.checkOut);
    return checkOut >= today;
  });

  const upcoming = allTrips.filter((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'declined') return false;
    if (booking.status === 'completed') return false;
    if (booking.status === 'in_progress') return false;
    const checkOut = new Date(booking.checkOut);
    return checkOut >= today;
  });

  // H-03: bookings confirmed by host but not yet paid by guest
  const pendingPaymentBookings = upcoming.filter(
    (b) => b.status === 'confirmed' && (!b.paymentStatus || b.paymentStatus === 'pending' || b.paymentStatus === 'declined'),
  );

  const past = allTrips.filter((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'declined') return false;
    if (booking.status === 'completed') return true;
    // in_progress bookings whose checkout has already passed (scheduler hasn't fired yet)
    if (booking.status === 'in_progress') {
      const checkOut = new Date(booking.checkOut);
      return checkOut < today;
    }
    const checkOut = new Date(booking.checkOut);
    return checkOut < today;
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => bookingsApi.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success(t('bookingCancelled'));
      setCancelPreviewId(null);
      setCancelPreviewData(null);
      setCancelReason('');
    },
    onError: () => toast.error(t('couldNotCancel')),
  });

  const cancelExpMutation = useMutation({
    mutationFn: (id: number) => experienceBookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exp-trips'] });
      toast.success(t('expBookingCancelled'));
    },
    onError: () => toast.error(t('couldNotCancel')),
  });

  const handleCancelClick = async (id: number) => {
    setCancelPreviewId(id);
    setCancelPreviewLoading(true);
    setCancelPreviewData(null);
    try {
      const preview = await bookingsApi.getCancellationPreview(id);
      setCancelPreviewData(preview);
    } catch {
      // preview failed — allow cancel anyway
    } finally {
      setCancelPreviewLoading(false);
    }
  };

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  // — Stays buckets —
  const tabs = [
    { value: 'active', label: t('active'), data: active, loading: loadingTrips, empty: t('noActiveTrips') },
    { value: 'upcoming', label: t('upcoming'), data: upcoming, loading: loadingTrips, empty: t('noUpcomingTrips') },
    { value: 'past', label: t('past'), data: past, loading: loadingTrips, empty: t('noPastTrips') },
    { value: 'cancelled', label: t('cancelled'), data: cancelled, loading: loadingTrips, empty: t('noCancelledTrips') },
  ];

  // — Experience trips buckets —
  const expUpcoming = allExpTrips.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'declined' && b.status !== 'completed',
  );
  const expPast = allExpTrips.filter(
    (b) => b.status === 'completed',
  );
  const expCancelled = allExpTrips.filter(
    (b) => b.status === 'cancelled' || b.status === 'declined',
  );
  const expTabs = [
    { value: 'upcoming', label: t('upcoming'), data: expUpcoming, loading: loadingExpTrips, empty: t('noUpcomingExp') },
    { value: 'past', label: t('past'), data: expPast, loading: loadingExpTrips, empty: t('noCompletedExp') },
    { value: 'cancelled', label: t('cancelled'), data: expCancelled, loading: loadingExpTrips, empty: t('noCancelledExp') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-start justify-between mb-8 gap-4">
        <motion.h1
          className="text-3xl font-semibold text-neutral-900"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {t('tripsPageTitle')}
        </motion.h1>
        {(myDisputes as any[]).length > 0 && (
          <Link
            href={`/${locale}/trips/disputes`}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <MessageSquareWarning className="h-4 w-4" />
            {t('myDisputesCount', { count: (myDisputes as any[]).length })}
          </Link>
        )}
        {(myDisputes as any[]).length === 0 && (
          <Link
            href={`/${locale}/trips/disputes`}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <MessageSquareWarning className="h-4 w-4" />
            {t('myDisputes')}
          </Link>
        )}
      </div>

      {/* W10: Payment success banner after redirect */}
      {paymentSuccess && !paymentSuccessDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4"
        >
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">{t('paymentConfirmed')}</p>
            <p className="text-xs text-green-700 mt-0.5">
              {t('paymentConfirmedDesc')}
            </p>
          </div>
          <button onClick={() => setPaymentSuccessDismissed(true)} className="text-green-500 hover:text-green-700 text-sm font-medium">
            ✕
          </button>
        </motion.div>
      )}

      {/* H-03: Remind guest of confirmed-but-unpaid bookings */}
      {listingType === 'stays' && pendingPaymentBookings.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {pendingPaymentBookings.length === 1
                ? t('oneBookingAwaitingPayment')
                : t('multipleBookingsAwaitingPayment')}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t('goToUpcomingToPay')}
            </p>
          </div>
        </div>
      )}

      {/* Top-level listing type switcher */}
      <div className="flex border-b border-neutral-200 mb-0">
        {([
          { id: 'stays' as const, label: t('stays'), icon: Home },
          { id: 'experiences' as const, label: t('experiencesTab'), icon: Compass },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setListingType(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              listingType === id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Stays */}
      {listingType === 'stays' && (
        <Tabs.Root defaultValue={active.length > 0 ? 'active' : 'upcoming'} className="mt-0" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <Tabs.List className="flex gap-0 border-b border-neutral-200 mb-8">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="relative px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-neutral-900 hover:text-neutral-700 transition-colors"
              >
                {tab.label}
                {tab.value === 'active' && tab.data.length > 0 && (
                  <span className="ms-1.5 inline-flex items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold w-4 h-4">
                    {tab.data.length}
                  </span>
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {tabs.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value}>
              {tab.value === 'active' && tab.data.length > 0 && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">{t('checkedIn')}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{t('checkedInDesc')}</p>
                  </div>
                </div>
              )}
              {tab.loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : tab.data.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center py-20 gap-4 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {tab.value === 'active' ? (
                    <>
                      <div className="text-6xl">🛏️</div>
                      <h2 className="text-xl font-semibold text-neutral-900">{t('noActiveTrips')}</h2>
                      <p className="text-neutral-500 max-w-xs">{t('noActiveTripsDesc')}</p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        className="text-6xl"
                        animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      >
                        🌍
                      </motion.div>
                      <h2 className="text-xl font-semibold text-neutral-900">{tab.value === 'cancelled' ? tab.empty : t('startPlanningTitle')}</h2>
                      {tab.value !== 'cancelled' && <p className="text-neutral-500 max-w-xs">{t('startPlanningSubtitle')}</p>}
                      {tab.value !== 'cancelled' && tab.value !== 'past' && (
                        <Link href={`/${locale}/s`} className="mt-2 btn-brand rounded-xl px-6 py-3 text-sm">
                          {t('startSearching')}
                        </Link>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-4"
                  initial="hidden" animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                >
                  {tab.data.map((booking) => (
                    <motion.div
                      key={booking.id}
                      data-booking-id={booking.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }}
                      className={cn(highlightBookingId === booking.id && 'ring-2 ring-indigo-400 ring-offset-2 rounded-2xl')}
                    >
                      <BookingCard
                        booking={booking}
                        onCancel={(id) => handleCancelClick(id)}
                        onPay={(b) => setPayingBooking(b)}
                        onReviewSubmitted={() => queryClient.invalidateQueries({ queryKey: ['trips'] })}
                        existingDisputeId={disputeByBookingId[booking.id]}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}

      {/* Experiences */}
      {listingType === 'experiences' && (
        <Tabs.Root defaultValue="upcoming" className="mt-0" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <Tabs.List className="flex gap-0 border-b border-neutral-200 mb-8">
            {expTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-neutral-900 hover:text-neutral-700 transition-colors"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {expTabs.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value}>
              {tab.loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
              ) : tab.data.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center py-20 gap-4 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div className="text-6xl" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
                    🎭
                  </motion.div>
                  <h2 className="text-xl font-semibold text-neutral-900">{t('discoverExperiences')}</h2>
                  <p className="text-neutral-500 max-w-xs">{tab.empty}</p>
                  <Link href={`/${locale}/experiences`} className="mt-2 btn-brand rounded-xl px-6 py-3 text-sm">
                    {t('browseExperiences')}
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-4"
                  initial="hidden" animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                >
                  {tab.data.map((booking) => (
                    <motion.div
                      key={booking.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }}
                    >
                      <ExperienceBookingCard
                        booking={booking}
                        onCancel={(id) => cancelExpMutation.mutate(id)}
                        onPay={(b) => setPayingExpBooking(b)}
                        onReviewSubmitted={() => queryClient.invalidateQueries({ queryKey: ['exp-trips'] })}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}

      {payingBooking && (
        <PaymentMethodModal
          bookingId={payingBooking.id}
          totalAmount={payingBooking.total ?? payingBooking.totalAmount ?? 0}
          onSuccess={(method) => {
            queryClient.setQueryData(['trips'], (old: any) =>
              Array.isArray(old)
                ? old.map((b) => b.id === payingBooking!.id ? { ...b, paymentStatus: method === 'opay-card' ? 'paid' : 'submitted' } : b)
                : old,
            );
            setPayingBooking(null);
            toast.success(
              method === 'opay-card'
                ? t('paymentSuccessful')
                : t('paymentSubmitted'),
            );
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['trips'] }), method === 'opay-card' ? 3000 : 6000);
          }}
          onClose={() => setPayingBooking(null)}
        />
      )}

      {payingExpBooking && (
        <PaymentMethodModal
          bookingId={payingExpBooking.id}
          totalAmount={payingExpBooking.totalAmount ?? 0}
          onSuccess={(method) => {
            queryClient.setQueryData(['exp-trips'], (old: any) =>
              Array.isArray(old)
                ? old.map((b) => b.id === payingExpBooking!.id ? { ...b, paymentStatus: method === 'opay-card' ? 'paid' : 'submitted' } : b)
                : old,
            );
            setPayingExpBooking(null);
            toast.success(
              method === 'opay-card'
                ? t('paymentSuccessful')
                : t('paymentSubmitted'),
            );
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['exp-trips'] }), method === 'opay-card' ? 3000 : 6000);
          }}
          onClose={() => setPayingExpBooking(null)}
        />
      )}

      {/* Cancellation Preview Modal */}
      <AnimatePresence>
        {cancelPreviewId !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setCancelPreviewId(null); setCancelPreviewData(null); setCancelReason(''); setCancelReasonOpen(false); }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <h3 className="text-base font-semibold text-neutral-900">{t('cancelReservationTitle')}</h3>
              </div>

              {cancelPreviewLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="h-6 w-6 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
                </div>
              ) : cancelPreviewData ? (
                <div className="space-y-3 mb-5">
                  <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-sm space-y-2">
                    <p className="capitalize text-neutral-700">
                      <span className="font-medium">{t('policy')}:</span> {cancelPreviewData.cancellationPolicy}
                    </p>
                    <p className="text-neutral-700">
                      <span className="font-medium">{t('daysUntilCheckin')}:</span> {cancelPreviewData.daysUntilCheckIn}
                    </p>
                    <div className="border-t border-neutral-200 pt-2 space-y-1">
                      <p className="text-neutral-700">
                        <span className="font-medium">{t('totalPaid')}:</span> {formatPrice(cancelPreviewData.breakdown.totalPaid, cancelCurrency)}
                      </p>
                      <p className={cancelPreviewData.breakdown.refundAmount > 0 ? 'text-green-700 font-medium' : 'text-neutral-700'}>
                        <span className="font-medium">{t('yourRefund')}:</span> {formatPrice(cancelPreviewData.breakdown.refundAmount, cancelCurrency)}
                      </p>
                      {cancelPreviewData.breakdown.cancellationFee > 0 && (
                        <p className="text-red-600">
                          <span className="font-medium">{t('cancellationFee')}:</span> {formatPrice(cancelPreviewData.breakdown.cancellationFee, cancelCurrency)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">{cancelPreviewData.message}</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-600 mb-5">
                  {t('cancelConfirmMsg')}
                </p>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('cancellationReason')}
                </label>
                <div className="relative" ref={cancelReasonRef}>
                  <button
                    type="button"
                    onClick={() => setCancelReasonOpen((o) => !o)}
                    className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                      cancelReasonOpen
                        ? 'border-neutral-400 bg-white ring-1 ring-neutral-300'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    } ${cancelReason ? 'text-neutral-900' : 'text-neutral-400'}`}
                  >
                    <span>{cancelReason ? CANCEL_REASONS.find((r) => r.value === cancelReason)?.label : t('selectReason')}</span>
                    <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${cancelReasonOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {cancelReasonOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden max-h-52 overflow-y-auto"
                      >
                        {CANCEL_REASONS.map((r) => (
                          <li key={r.value}>
                            <button
                              type="button"
                              onClick={() => { setCancelReason(r.value); setCancelReasonOpen(false); }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                                cancelReason === r.value
                                  ? 'bg-neutral-900 text-white'
                                  : 'text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              <span>{r.label}</span>
                              {cancelReason === r.value && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelPreviewId(null); setCancelPreviewData(null); setCancelReason(''); setCancelReasonOpen(false); }}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {t('keepReservation')}
                </button>
                <button
                  onClick={() => cancelPreviewId && cancelMutation.mutate({ id: cancelPreviewId, reason: cancelReason || undefined })}
                  disabled={cancelMutation.isPending}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {cancelMutation.isPending ? t('cancelling') : t('confirmCancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
