'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Video, MapPin, Phone, MessageSquare,
  Star, CheckCircle, XCircle, AlertCircle, ArrowLeft,
  ExternalLink, RefreshCw,
} from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: any }> = {
  pending:    { label: 'Pending',    labelAr: 'بانتظار التأكيد', color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: AlertCircle },
  confirmed:  { label: 'Confirmed',  labelAr: 'مؤكد',            color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  completed:  { label: 'Completed',  labelAr: 'مكتمل',           color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  labelAr: 'ملغي',            color: 'bg-red-50 text-red-600 border-red-200',         icon: XCircle },
  in_progress: { label: 'In Progress', labelAr: 'جارٍ الآن',     color: 'bg-purple-50 text-purple-700 border-purple-200', icon: RefreshCw },
  no_show:    { label: 'No Show',    labelAr: 'غياب',            color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: XCircle },
};

const DELIVERY_ICONS: Record<string, any> = {
  video_call: Video,
  in_person: MapPin,
  phone: Phone,
  chat: MessageSquare,
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  booking,
  isAr,
  onClose,
  onSuccess,
}: {
  booking: any;
  isAr: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hovered, setHovered] = useState(0);

  const mutation = useMutation({
    mutationFn: () => consultationsApi.reviewBooking(booking.id, { rating, comment: comment || undefined }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          {isAr ? 'تقييم الجلسة' : 'Rate this session'}
        </h3>
        <p className="mb-5 text-sm text-gray-500">
          {booking.consultant?.displayName}
          {' · '}
          {isAr ? booking.service?.titleAr || booking.service?.title : booking.service?.title}
        </p>

        {/* Star rating */}
        <div className="mb-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-9 w-9 transition-colors',
                  s <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
                )}
              />
            </button>
          ))}
        </div>
        <p className="mb-4 text-center text-sm font-medium text-gray-600">
          {rating === 1 ? (isAr ? 'سيئ' : 'Poor') :
           rating === 2 ? (isAr ? 'مقبول' : 'Fair') :
           rating === 3 ? (isAr ? 'جيد' : 'Good') :
           rating === 4 ? (isAr ? 'جيد جداً' : 'Very Good') :
           (isAr ? 'ممتاز' : 'Excellent')}
        </p>

        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isAr ? 'شاركنا رأيك (اختياري)...' : 'Share your experience (optional)...'}
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 mb-4"
        />

        {mutation.isError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {(mutation.error as any)?.response?.data?.message ?? (isAr ? 'حدث خطأ' : 'Something went wrong')}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60 transition"
          >
            {mutation.isPending ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'إرسال التقييم' : 'Submit Review')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function MyConsultationBookingsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const qc = useQueryClient();
  const { isLoggedIn, hasHydrated } = useAuth();

  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-consultation-bookings'],
    queryFn: () => consultationsApi.getMyBookings({ limit: 50 }),
    enabled: isLoggedIn,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => consultationsApi.cancelBooking(id),
    onSuccess: () => {
      setCancelConfirm(null);
      qc.invalidateQueries({ queryKey: ['my-consultation-bookings'] });
    },
  });

  if (hasHydrated && !isLoggedIn) {
    router.replace(`/${locale}/login`);
    return null;
  }

  const bookings: any[] = data?.data ?? [];

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const d = new Date(b.scheduledAt);
    if (tab === 'upcoming') return d >= now && b.status !== 'cancelled';
    if (tab === 'past') return d < now || b.status === 'completed' || b.status === 'cancelled';
    return true;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium', timeStyle: 'short',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/${locale}/consultations`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition"
          >
            <ArrowLeft className={cn('h-4 w-4 text-gray-600', isAr && 'rotate-180')} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAr ? 'جلساتي الاستشارية' : 'My Consultation Sessions'}
            </h1>
            <p className="text-sm text-gray-500">
              {isAr ? 'عرض وإدارة جلساتك المحجوزة' : 'View and manage your booked sessions'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white border border-gray-100 p-1 shadow-sm w-fit">
          {(['upcoming', 'past', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition',
                tab === t ? 'bg-rose-500 text-white shadow' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {t === 'upcoming' ? (isAr ? 'القادمة' : 'Upcoming') :
               t === 'past' ? (isAr ? 'السابقة' : 'Past') :
               (isAr ? 'الكل' : 'All')}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">
              {isAr ? 'لا توجد جلسات في هذا القسم' : 'No sessions here yet'}
            </p>
            <Link
              href={`/${locale}/consultations`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition"
            >
              {isAr ? 'استعرض المستشارين' : 'Browse Consultants'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const DeliveryIcon = DELIVERY_ICONS[booking.service?.deliveryMode] ?? Video;
              const hasReview = !!booking.review;
              const canCancel = ['pending', 'confirmed'].includes(booking.status) && new Date(booking.scheduledAt) > now;
              const canReview = booking.status === 'completed' && !hasReview;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Consultant + service */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-sm font-bold text-white">
                          {booking.consultant?.displayName?.[0] ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {booking.consultant?.displayName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {isAr ? booking.service?.titleAr || booking.service?.title : booking.service?.title}
                          </p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-rose-400" />
                          {formatDate(booking.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-rose-400" />
                          {booking.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DeliveryIcon className="h-3.5 w-3.5 text-rose-400" />
                          {booking.service?.deliveryMode?.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-gray-700">
                          {booking.currency} {Number(booking.price).toLocaleString()}
                        </span>
                      </div>

                      {/* Meeting link */}
                      {booking.meetingLink && booking.status === 'confirmed' && (
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <Video className="h-3.5 w-3.5" />
                          {isAr ? 'انضم للجلسة' : 'Join Session'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {/* InstaPay pending notice */}
                      {booking.paymentMethod === 'instapay' && booking.paymentStatus === 'pending' && booking.status === 'pending' && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          ⏳ {isAr ? 'بانتظار تأكيد دفع InstaPay المُستشار' : "Waiting for consultant to confirm InstaPay payment receipt"}
                        </div>
                      )}

                      {/* Cancellation reason */}
                      {booking.status === 'cancelled' && booking.cancellationReason && (
                        <p className="mt-1 text-xs text-gray-400">
                          {isAr ? 'سبب الإلغاء: ' : 'Reason: '}{booking.cancellationReason}
                        </p>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={cn('flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium', cfg.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {isAr ? cfg.labelAr : cfg.label}
                      </span>

                      {canReview && (
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
                        >
                          <Star className="h-3.5 w-3.5" />
                          {isAr ? 'تقييم' : 'Review'}
                        </button>
                      )}

                      {hasReview && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          {isAr ? 'تم التقييم' : 'Reviewed'}
                        </span>
                      )}

                      {canCancel && (
                        cancelConfirm === booking.id ? (
                          <div className="flex gap-1">
                            <button
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(booking.id)}
                              className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60 transition"
                            >
                              {isAr ? 'تأكيد' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setCancelConfirm(null)}
                              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
                            >
                              {isAr ? 'لا' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelConfirm(booking.id)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isAr={isAr}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            qc.invalidateQueries({ queryKey: ['my-consultation-bookings'] });
          }}
        />
      )}
    </div>
  );
}
