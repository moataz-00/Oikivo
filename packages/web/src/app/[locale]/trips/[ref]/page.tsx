'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Home,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { bookingsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types';
import { FadeIn } from '@/components/ui/Motion';

// ─── Timeline helpers ──────────────────────────────────────────────────────-
interface TimelineEvent {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle?: string;
  date: string;
}

function buildTimeline(
  booking: Booking,
  formatPrice: (amount: number, currency?: string) => string,
  sourceCurrency: string,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Booking requested
  events.push({
    icon: <CalendarDays className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-600',
    title: 'Booking requested',
    subtitle: `${booking.guests} guest${booking.guests !== 1 ? 's' : ''} · ${booking.nights} night${booking.nights !== 1 ? 's' : ''}`,
    date: booking.createdAt,
  });

  // 2. Confirmed / pending / declined
  if (booking.status === 'confirmed') {
    events.push({
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-green-100 text-green-600',
      title: 'Reservation confirmed',
      subtitle: 'Host accepted your booking',
      date: booking.createdAt,
    });
  } else if (booking.status === 'declined') {
    events.push({
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-600',
      title: 'Booking declined',
      subtitle: 'Host declined your request',
      date: booking.createdAt,
    });
  }

  // 3. Payment events
  if (booking.paymentStatus === 'submitted') {
    events.push({
      icon: <CreditCard className="h-4 w-4" />,
      color: 'bg-amber-100 text-amber-600',
      title: 'Payment submitted',
      subtitle: booking.paymentMethod ? `Method: ${booking.paymentMethod}` : undefined,
      date: booking.createdAt,
    });
  } else if (booking.paymentStatus === 'paid') {
    events.push({
      icon: <CreditCard className="h-4 w-4" />,
      color: 'bg-green-100 text-green-600',
      title: 'Payment confirmed',
      subtitle: booking.paymentMethod ? `Method: ${booking.paymentMethod}` : undefined,
      date: booking.createdAt,
    });
  }

  // 4. Cancellation
  if (booking.cancelledAt) {
    events.push({
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-600',
      title: 'Reservation cancelled',
      subtitle: booking.cancelledBy ? `Cancelled by ${booking.cancelledBy}` : undefined,
      date: booking.cancelledAt,
    });
  }

  // 5. Refund issued — use formatPrice to localize amounts
  if (booking.paymentStatus === 'refunded' || (booking.refundAmount && booking.refundAmount > 0)) {
    events.push({
      icon: <RefreshCw className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-600',
      title: `Refund — ${formatPrice(Number(booking.refundAmount ?? 0), sourceCurrency)}`,
      subtitle:
        booking.cancellationFee && Number(booking.cancellationFee) > 0
          ? `Cancellation fee deducted: ${formatPrice(Number(booking.cancellationFee), sourceCurrency)}`
          : undefined,
      date: booking.cancelledAt ?? booking.createdAt,
    });
  }

  // 6. Stay completed
  if (booking.status === 'completed') {
    events.push({
      icon: <Home className="h-4 w-4" />,
      color: 'bg-teal-100 text-teal-600',
      title: 'Stay completed',
      subtitle: 'Checkout processed',
      date: booking.checkOut,
    });
  }

  // Sort by date ascending
  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-teal-100 text-teal-800',
    cancelled: 'bg-red-100 text-red-800',
    declined:  'bg-neutral-100 text-neutral-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700',
    submitted: 'bg-blue-50 text-blue-700',
    paid:      'bg-green-50 text-green-700',
    refunded:  'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {status}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────--
export default function BookingHistoryPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const ref = params.ref as string;
  const { formatPrice } = useCurrency();
  const { isLoggedIn, hasHydrated } = useAuth();

  // Security: redirect unauthenticated users
  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.replace(`/${locale}/login?redirect=/${locale}/trips/${ref}`);
    }
  }, [hasHydrated, isLoggedIn, locale, router, ref]);

  const { data: booking, isLoading, isError } = useQuery<Booking>({
    queryKey: ['booking-ref', ref],
    queryFn: () => bookingsApi.getBookingByRef(ref),
    enabled: !!ref,
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-neutral-600">Booking not found or you don&apos;t have access to it.</p>
        <Link href={`/${locale}/trips`} className="text-sm font-medium underline text-neutral-700">
          Back to trips
        </Link>
      </div>
    );
  }

  const sourceCurrency = booking.currency ?? (booking.property as any)?.currency ?? 'EGP';
  const timeline = buildTimeline(booking, formatPrice, sourceCurrency);
  const total = booking.total ?? booking.totalAmount ?? 0;

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.push(`/${locale}/trips`)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to trips
        </button>

        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Booking history</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Ref <span className="font-mono">{ref.slice(0, 8)}…</span>
        </p>

        {/* Property card */}
        <div className="flex gap-4 items-center bg-neutral-50 rounded-2xl p-4 mb-6 border border-neutral-100">
          <div className="relative h-20 w-28 rounded-xl overflow-hidden shrink-0 bg-neutral-200">
            {booking.property?.images?.[0] && (
              <Image
                src={getImageUrl(booking.property.images[0].url)}
                alt={booking.property.title ?? ''}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 truncate">{booking.property?.title}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{booking.property?.city}</p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-neutral-100 rounded-xl p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-1">Check-in</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-semibold text-neutral-800">{fmtDate(booking.checkIn)}</span>
            </div>
          </div>
          <div className="bg-white border border-neutral-100 rounded-xl p-4">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-1">Check-out</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-semibold text-neutral-800">{fmtDate(booking.checkOut)}</span>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Price breakdown</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {formatPrice(Number(booking.basePrice), sourceCurrency)} × {booking.nights} night{booking.nights !== 1 ? 's' : ''}
              </span>
              <span className="font-medium">{formatPrice(Number(booking.basePrice) * Number(booking.nights), sourceCurrency)}</span>
            </div>
            {Number(booking.cleaningFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Cleaning fee</span>
                <span className="font-medium">{formatPrice(Number(booking.cleaningFee), sourceCurrency)}</span>
              </div>
            )}
            {Number(booking.serviceFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Service fee</span>
                <span className="font-medium">{formatPrice(Number(booking.serviceFee), sourceCurrency)}</span>
              </div>
            )}
            {Number(booking.taxes) > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Taxes</span>
                <span className="font-medium">{formatPrice(Number(booking.taxes), sourceCurrency)}</span>
              </div>
            )}
            <div className="border-t border-neutral-100 pt-2.5 flex justify-between font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatPrice(Number(total), sourceCurrency)}</span>
            </div>
          </div>

          {/* Cancellation / refund block */}
          {booking.cancelledAt && (
            <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2 text-sm">
              {booking.cancellationFee != null && Number(booking.cancellationFee) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Cancellation fee</span>
                  <span>− {formatPrice(Number(booking.cancellationFee), sourceCurrency)}</span>
                </div>
              )}
              {booking.refundAmount != null && Number(booking.refundAmount) > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Refund</span>
                  <span>+ {formatPrice(Number(booking.refundAmount), sourceCurrency)}</span>
                </div>
              )}
              {Number(booking.refundAmount) === 0 && (
                <p className="text-xs text-neutral-500 italic">No refund based on the cancellation policy.</p>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-5">
          <h2 className="font-semibold text-neutral-900 mb-5">Activity timeline</h2>
          <ol className="relative border-l-2 border-neutral-100 space-y-6 ml-2">
            {timeline.map((event, idx) => (
              <li key={idx} className="ml-4">
                <span className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ${event.color}`}>
                  {event.icon}
                </span>
                <p className="text-sm font-semibold text-neutral-800 leading-snug">{event.title}</p>
                {event.subtitle && (
                  <p className="text-xs text-neutral-500 mt-0.5">{event.subtitle}</p>
                )}
                <time className="text-xs text-neutral-400 mt-0.5 block">{fmt(event.date)}</time>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/rooms/${booking.property?.uuid || booking.property?.id}`}
            className="flex-1 text-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            View property
          </Link>
          {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'declined' && (
            <Link
              href={`/${locale}/trips/dispute/${booking.id}`}
              className="flex-1 text-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Open dispute
            </Link>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
