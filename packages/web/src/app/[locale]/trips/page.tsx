'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, CreditCard, AlertTriangle, Scale, Home, Compass, Star, MessageSquareWarning, Printer, QrCode } from 'lucide-react';
import { PaymentMethodModal } from '@/components/payment/PaymentMethodModal';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { bookingsApi, disputesApi, experienceBookingsApi, experienceReviewsApi, reviewsApi } from '@/lib/api';
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

        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href={`/${locale}/experiences/${booking.experience.id}`}
            className="text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
          >
            {t('viewExperience')}
          </Link>
          {needsPayment && (
            <button
              onClick={() => onPay(booking)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {booking.paymentStatus === 'declined' ? t('retryPayment') : t('payNow')}
            </button>
          )}
          {booking.paymentStatus === 'submitted' && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium flex items-center gap-1">
              🔍 {t('paymentUnderReview')}
            </span>
          )}
          {booking.paymentStatus === 'declined' && (
            <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 font-medium">
              ❌ {t('paymentNotVerified')}
            </span>
          )}
          {(booking.status === 'pending' && (
            <span className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 font-medium">
              ⏳ {t('awaitingConfirmation')}
            </span>
          ))}
          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="text-sm font-medium text-red-600 underline hover:text-red-800"
            >
              {t('cancelBooking')}
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
            >
              <Star className="h-3.5 w-3.5" />
              {t('leaveReview')}
            </button>
          )}
          {booking.review && (
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Star className="h-3 w-3 fill-neutral-400" />
              {t('reviewedRating', { rating: booking.review.overallRating })}
            </span>
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

        {([
          { label: t('overall'), value: overallRating, set: setOverallRating },
          { label: t('host'), value: hostRating, set: setHostRating },
          { label: t('value'), value: valueRating, set: setValueRating },
        ] as const).map(({ label, value, set }) => (
          <div key={label} className="bg-indigo-50/40 rounded-xl px-4 py-3">
            <label className="block text-sm font-semibold text-indigo-800 mb-2">{label}</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => set(n)}
                  className="rounded-lg p-0.5 transition-transform hover:scale-110 active:scale-95">
                  <Star className={cn('h-7 w-7 transition-colors', n <= value ? 'fill-violet-500 text-violet-500' : 'text-neutral-300 hover:text-violet-300')} />
                </button>
              ))}
            </div>
          </div>
        ))}

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
  existingDisputeId?: number;
}) {
  const locale = useLocale();
  const t = useTranslations('trips');
  const tCommon = useTranslations('common');
  const { formatPrice } = useCurrency();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [overallRating, setOverallRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [locationRating, setLocationRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [checkinRating, setCheckinRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const queryClient = useQueryClient();
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifyCheckIn, setModifyCheckIn] = useState('');
  const [modifyCheckOut, setModifyCheckOut] = useState('');
  const [modifyPending, setModifyPending] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  // G9: human-readable short code
  const shortCode = `STAY-${booking.id.toString(36).toUpperCase().padStart(4, '0')}`;
  const coverImage =
    booking.property.images?.find((i) => i.isCover)?.url ?? booking.property.images?.[0]?.url;

  // Show Pay Now when host confirmed but guest hasn't paid yet (also allow retry after decline)
  const needsPayment = booking.status === 'confirmed' && (!booking.paymentStatus || booking.paymentStatus === 'pending' || booking.paymentStatus === 'declined');
  // Allow cancel for in_progress stays (prorated refund) or upcoming confirmed/pending stays
  const canCancelStay =
    booking.status === 'in_progress' ||
    ((booking.status === 'confirmed' || booking.status === 'pending') &&
      new Date(booking.checkIn) > new Date(new Date().toDateString()));

  const handleSubmitReview = async () => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.createReview({
        bookingId: booking.id,
        overallRating,
        cleanlinessRating,
        communicationRating,
        locationRating,
        valueRating,
        checkinRating,
        comment: comment || undefined,
        photos: reviewPhotos.length > 0 ? reviewPhotos : undefined,
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

  const handleModifyDates = async () => {
    if (modifyPending || !modifyCheckIn || !modifyCheckOut) return;
    setModifyPending(true);
    try {
      await bookingsApi.modifyBooking(booking.id, { checkIn: modifyCheckIn, checkOut: modifyCheckOut });
      toast.success(t('datesUpdated'));
      setModifyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('modifyFailed'));
    } finally {
      setModifyPending(false);
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
          </span>
          <span>
            {t('checkOut')}: <strong>{formatDate(booking.checkOut, 'MMM d, yyyy')}</strong>
          </span>
          <span>
            {t('total')}: <strong>{formatPrice(Number(booking.total), booking.currency ?? 'EGP')}</strong>
          </span>
        </div>

        {/* Refund / cancellation fee for cancelled bookings */}
        {booking.status === 'cancelled' && (booking.refundAmount !== undefined || booking.cancellationFee !== undefined) && (
          <div className="mt-3 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700 space-y-0.5">
            {Number(booking.refundAmount) > 0 && booking.paymentStatus === 'refunded' && (
              <p>✅ {t('refundProcessed', { amount: formatPrice(Number(booking.refundAmount!), booking.currency ?? 'EGP') })}</p>
            )}
            {Number(booking.refundAmount) > 0 && booking.paymentStatus !== 'refunded' && booking.paymentMethod === 'instapay' && (
              <>
                <p>⏳ {t('manualRefundPending', { amount: formatPrice(Number(booking.refundAmount!), booking.currency ?? 'EGP') })}</p>
                <p className="text-xs text-neutral-500 mt-0.5">⏱ Refunds are typically processed within 5–7 business days.</p>
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

        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href={`/${locale}/rooms/${booking.property.uuid || booking.property.id}`}
            className="text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
          >
            {t('viewProperty')}
          </Link>
          <Link
            href={`/${locale}/trips/${booking.bookingUuid ?? booking.id}`}
            className="text-sm font-medium text-brand underline hover:text-brand/80"
          >
            {t('viewDetails')}
          </Link>
          {/* G8: Export / Print */}
          <Link
            href={`/${locale}/trips/${booking.bookingUuid ?? booking.id}/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            {t('exportPrint')}
          </Link>
          {needsPayment && (
            <button
              onClick={() => onPay(booking)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {booking.paymentStatus === 'declined' ? t('retryPayment') : t('payNow')}
            </button>
          )}
          {booking.paymentStatus === 'submitted' && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium flex items-center gap-1">
              🔍 {t('paymentUnderReview')}
            </span>
          )}
          {booking.paymentStatus === 'declined' && (
            <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 font-medium">
              ❌ {t('paymentNotVerified')}
            </span>
          )}
          {booking.status === 'pending' && (
            <span className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 font-medium">
              ⏳ {t('awaitingConfirmation')}
            </span>
          )}
          {canCancelStay ? (
            <button
              onClick={() => onCancel(booking.id)}
              className="text-sm font-medium text-red-600 underline hover:text-red-800"
            >
              {t('cancelTrip')}
            </button>
          ) : null}
          {booking.status === 'confirmed' && new Date(booking.checkIn) > new Date() && (
            <button
              onClick={() => {
                setModifyCheckIn(booking.checkIn.split('T')[0]);
                setModifyCheckOut(booking.checkOut.split('T')[0]);
                setModifyOpen(true);
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
            >
              ✏️ {t('modifyDates')}
            </button>
          )}
          {(booking.status === 'completed' ||
            (booking.status === 'confirmed' && new Date(booking.checkOut) < new Date())) &&
            !(booking as any).review && (
            <button
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
            >
              <Star className="h-3.5 w-3.5" />
              {t('reviewTrip')}
            </button>
          )}
          {(booking as any).review && (
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Star className="h-3 w-3 fill-neutral-400" />
              {t('reviewedRating', { rating: (booking as any).review.overallRating ?? (booking as any).review.rating })}
            </span>
          )}
          {existingDisputeId ? (
            <Link
              href={`/${locale}/trips/disputes/${existingDisputeId}`}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Scale className="h-3.5 w-3.5" />
              View dispute
            </Link>
          ) : (
            <>
              {(booking.status === 'completed' || booking.status === 'cancelled') && (
                <Link
                  href={`/${locale}/trips/dispute/${booking.id}`}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-600 transition-colors"
                >
                  <Scale className="h-3.5 w-3.5" />
                  {t('openDispute')}
                </Link>
              )}
              {booking.status === 'confirmed' && new Date(booking.checkIn) <= new Date() && (
                <Link
                  href={`/${locale}/trips/dispute/${booking.id}`}
                  className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Report a problem
                </Link>
              )}
              {booking.status === 'in_progress' && (
                <Link
                  href={`/${locale}/trips/dispute/${booking.id}`}
                  className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Report a problem during your stay
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {/* Review Modal */}
    <Modal open={reviewOpen} onOpenChange={setReviewOpen}>
      <div className="p-6 space-y-4 max-w-md">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
            <Star className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{t('reviewYourStay')}</h3>
            <p className="text-sm text-indigo-500 font-medium">{booking.property.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            { label: t('overall'), value: overallRating, set: setOverallRating },
            { label: t('cleanliness'), value: cleanlinessRating, set: setCleanlinessRating },
            { label: t('communication'), value: communicationRating, set: setCommunicationRating },
            { label: t('location'), value: locationRating, set: setLocationRating },
            { label: t('value'), value: valueRating, set: setValueRating },
            { label: t('checkInRating'), value: checkinRating, set: setCheckinRating },
          ] as const).map(({ label, value, set }) => (
            <div key={label} className="bg-indigo-50/40 rounded-xl px-3 py-2.5">
              <label className="block text-xs font-semibold text-indigo-800 mb-1.5">{label}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => set(n)}
                    className="rounded transition-transform hover:scale-110 active:scale-95">
                    <Star className={cn('h-5 w-5 transition-colors', n <= value ? 'fill-violet-500 text-violet-500' : 'text-neutral-300 hover:text-violet-300')} />
                  </button>
                ))}
              </div>
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

        {/* G4: Review photo URLs */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('reviewPhotosLabel')} <span className="font-normal text-neutral-400">({t('optional')})</span></label>
          <div className="flex gap-2">
            <input
              type="url"
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && photoInput.trim()) { setReviewPhotos(p => [...p, photoInput.trim()]); setPhotoInput(''); e.preventDefault(); } }}
              className="flex-1 rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="https://..."
            />
            <button type="button" onClick={() => { if (photoInput.trim()) { setReviewPhotos(p => [...p, photoInput.trim()]); setPhotoInput(''); } }}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition">
              +
            </button>
          </div>
          {reviewPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {reviewPhotos.map((url, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover border border-indigo-100" />
                  <button type="button" onClick={() => setReviewPhotos(p => p.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 bg-white border border-neutral-200 rounded-full h-4 w-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-red-500">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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

    {/* Modify Dates Modal */}
    <Modal open={modifyOpen} onOpenChange={setModifyOpen}>
      <div className="p-6 space-y-4 max-w-sm">
        <h3 className="text-lg font-bold text-neutral-900">{t('modifyDatesTitle')}</h3>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('checkIn')}</label>
          <input
            type="date"
            value={modifyCheckIn}
            onChange={(e) => setModifyCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('checkOut')}</label>
          <input
            type="date"
            value={modifyCheckOut}
            onChange={(e) => setModifyCheckOut(e.target.value)}
            min={modifyCheckIn || new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setModifyOpen(false)}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleModifyDates}
            disabled={modifyPending || !modifyCheckIn || !modifyCheckOut}
            className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 transition"
          >
            {modifyPending ? t('saving') : t('confirmModify')}
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
}

export default function TripsPage() {
  const t = useTranslations('trips');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const [listingType, setListingType] = useState<'stays' | 'experiences'>('stays');
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [payingExpBooking, setPayingExpBooking] = useState<ExperienceBooking | null>(null);
  const [cancelPreviewId, setCancelPreviewId] = useState<number | null>(null);
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null);
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);

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

  const { data: myDisputes = [] } = useQuery({
    queryKey: ['my-disputes'],
    queryFn: () => disputesApi.getMyDisputes(),
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  // Map bookingId -> dispute id for fast lookup
  const disputeByBookingId = Object.fromEntries(
    (myDisputes as any[]).map((d: any) => [d.bookingId, d.id]),
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

  const upcoming = allTrips.filter((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'declined') return false;
    if (booking.status === 'completed') return false;
    const checkOut = new Date(booking.checkOut);
    return checkOut >= today;
  });

  const past = allTrips.filter((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'declined') return false;
    if (booking.status === 'completed') return true;
    const checkOut = new Date(booking.checkOut);
    return checkOut < today;
  });

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success(t('bookingCancelled'));
      setCancelPreviewId(null);
      setCancelPreviewData(null);
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
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
            My Disputes ({(myDisputes as any[]).length})
          </Link>
        )}
        {(myDisputes as any[]).length === 0 && (
          <Link
            href={`/${locale}/trips/disputes`}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <MessageSquareWarning className="h-4 w-4" />
            My Disputes
          </Link>
        )}
      </div>

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
        <Tabs.Root defaultValue="upcoming" className="mt-0">
          <Tabs.List className="flex gap-0 border-b border-neutral-200 mb-8">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-neutral-900 hover:text-neutral-700 transition-colors"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {tabs.map((tab) => (
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
                  <motion.div
                    className="text-6xl"
                    animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    🌍
                  </motion.div>
                  <h2 className="text-xl font-semibold text-neutral-900">{t('startPlanningTitle')}</h2>
                  <p className="text-neutral-500 max-w-xs">{t('startPlanningSubtitle')}</p>
                  <Link href={`/${locale}/s`} className="mt-2 btn-brand rounded-xl px-6 py-3 text-sm">
                    {t('startSearching')}
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
        <Tabs.Root defaultValue="upcoming" className="mt-0">
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
                ? old.map((b) => b.id === payingBooking!.id ? { ...b, paymentStatus: method === 'stripe' || method === 'opay-card' ? 'paid' : 'submitted' } : b)
                : old,
            );
            setPayingBooking(null);
            toast.success(
              method === 'stripe' || method === 'opay-card'
                ? t('paymentSuccessful')
                : t('paymentSubmitted'),
            );
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['trips'] }), method === 'stripe' || method === 'opay-card' ? 3000 : 6000);
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
                ? old.map((b) => b.id === payingExpBooking!.id ? { ...b, paymentStatus: method === 'stripe' || method === 'opay-card' ? 'paid' : 'submitted' } : b)
                : old,
            );
            setPayingExpBooking(null);
            toast.success(
              method === 'stripe' || method === 'opay-card'
                ? t('paymentSuccessful')
                : t('paymentSubmitted'),
            );
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['exp-trips'] }), method === 'stripe' || method === 'opay-card' ? 3000 : 6000);
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
            onClick={() => { setCancelPreviewId(null); setCancelPreviewData(null); }}
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

              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelPreviewId(null); setCancelPreviewData(null); }}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {t('keepReservation')}
                </button>
                <button
                  onClick={() => cancelPreviewId && cancelMutation.mutate(cancelPreviewId)}
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
