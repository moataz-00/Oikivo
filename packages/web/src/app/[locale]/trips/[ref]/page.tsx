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
  Navigation,
  FileDown,
  ShieldCheck,
  ShieldAlert,
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

  // 7. Deposit events
  if ((booking.depositAmount ?? 0) > 0) {
    const depositFmt = formatPrice(Number(booking.depositAmount ?? 0), sourceCurrency);
    if (booking.depositStatus === 'claimed') {
      events.push({
        icon: <ShieldAlert className="h-4 w-4" />,
        color: 'bg-amber-100 text-amber-600',
        title: `Host submitted a damage claim`,
        subtitle: `Security deposit of ${depositFmt} is under admin review`,
        date: booking.checkOut,
      });
    } else if (booking.depositStatus === 'approved') {
      events.push({
        icon: <ShieldAlert className="h-4 w-4" />,
        color: 'bg-red-100 text-red-600',
        title: 'Damage claim approved',
        subtitle: `Host's claim for ${depositFmt} was approved. The deposit was not returned.`,
        date: booking.checkOut,
      });
    } else if (booking.depositStatus === 'rejected') {
      events.push({
        icon: <ShieldCheck className="h-4 w-4" />,
        color: 'bg-green-100 text-green-600',
        title: 'Damage claim rejected',
        subtitle: `Host's claim was rejected. The ${depositFmt} deposit must be returned to you.`,
        date: booking.checkOut,
      });
    } else if (booking.depositStatus === 'released') {
      events.push({
        icon: <ShieldCheck className="h-4 w-4" />,
        color: 'bg-emerald-100 text-emerald-600',
        title: 'Deposit released',
        subtitle: `Host confirmed the ${depositFmt} deposit has been returned`,
        date: booking.checkOut,
      });
    }
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
            {/* Accommodation row */}
            {(() => {
              const nights = Number(booking.nights);
              const preDiscountBase = Number(booking.basePrice) + Number(booking.discountAmount ?? 0);
              const cur = booking.currency ?? sourceCurrency;

              // Best case: nightly rates stored at booking time — group and show rows
              if (booking.nightlyRates && booking.nightlyRates.length > 0) {
                const groups: { price: number; count: number }[] = [];
                let g = { price: booking.nightlyRates[0].price, count: 1 };
                for (let i = 1; i < booking.nightlyRates.length; i++) {
                  if (booking.nightlyRates[i].price === g.price) {
                    g.count++;
                  } else {
                    groups.push(g);
                    g = { price: booking.nightlyRates[i].price, count: 1 };
                  }
                }
                groups.push(g);
                return (
                  <>
                    {groups.map((row, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-neutral-600">
                          {formatPrice(row.price, cur)} × {row.count} night{row.count !== 1 ? 's' : ''}
                        </span>
                        <span className="font-medium">{formatPrice(row.price * row.count, cur)}</span>
                      </div>
                    ))}
                  </>
                );
              }

              const storedPPN = (booking.pricePerNight && Number(booking.pricePerNight) > 0)
                ? Number(booking.pricePerNight)
                : null;
              const uniformTotal = storedPPN ? parseFloat((storedPPN * nights).toFixed(2)) : null;
              // Rates varied (weekend/seasonal) if stored per-night × nights ≠ actual pre-discount total
              const hasVariedRates = uniformTotal !== null && Math.abs(preDiscountBase - uniformTotal) > 0.5;

              if (storedPPN && !hasVariedRates) {
                // All nights at same rate — simple formula
                return (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">
                      {formatPrice(storedPPN, cur)} × {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">{formatPrice(storedPPN * nights, cur)}</span>
                  </div>
                );
              }

              if (storedPPN && hasVariedRates) {
                // Mixed nightly rates — no detailed breakdown available for old bookings
                return (
                  <div className="flex justify-between items-start">
                    <span className="text-neutral-600">
                      <span className="block">{nights} night{nights !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-neutral-400">Base {formatPrice(storedPPN, cur)}/night · includes variable rates</span>
                    </span>
                    <span className="font-medium">{formatPrice(preDiscountBase, cur)}</span>
                  </div>
                );
              }

              // Old booking — per-night rate not stored, show accommodation total only
              return (
                <div className="flex justify-between">
                  <span className="text-neutral-600">{nights} night{nights !== 1 ? 's' : ''}</span>
                  <span className="font-medium">{formatPrice(Number(booking.basePrice), cur)}</span>
                </div>
              );
            })()}
            {/* Discount row */}
            {Number(booking.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  {booking.discountType === 'monthly' ? 'Monthly discount' :
                   booking.discountType === 'weekly' ? 'Weekly discount' :
                   booking.discountType === 'new_listing_promotion' ? 'New listing promotion' :
                   booking.discountType === 'last_minute' ? 'Last-minute discount' : 'Discount'}
                  {Number(booking.discountPercent ?? 0) > 0 && ` (${booking.discountPercent}%)`}
                </span>
                <span>−{formatPrice(Number(booking.discountAmount), sourceCurrency)}</span>
              </div>
            )}
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

            {/* Deposit row — paid in cash, not included in total */}
            {(booking.depositAmount ?? 0) > 0 && (
              <div className="mt-2 flex justify-between text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  Security deposit <span className="text-xs italic">(cash, collected by host)</span>
                </span>
                <span>{formatPrice(Number(booking.depositAmount), sourceCurrency)}</span>
              </div>
            )}
          </div>

          {/* Deposit status panel */}
          {(booking.depositAmount ?? 0) > 0 && booking.depositStatus && booking.depositStatus !== 'none' && (() => {
            const depositFmt = formatPrice(Number(booking.depositAmount), sourceCurrency);
            const panels: Record<string, { bg: string; icon: JSX.Element; text: string }> = {
              held: {
                bg: 'bg-amber-50 border-amber-200',
                icon: <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />,
                text: `Security deposit of ${depositFmt} is payable in cash to your host at check-in. It will be returned if no damage occurs.`,
              },
              claimed: {
                bg: 'bg-amber-50 border-amber-300',
                icon: <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />,
                text: `Your host has submitted a damage claim for the security deposit (${depositFmt}). This is currently under admin review.`,
              },
              approved: {
                bg: 'bg-red-50 border-red-200',
                icon: <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />,
                text: `The damage claim for ${depositFmt} has been approved. The host retains the security deposit.`,
              },
              rejected: {
                bg: 'bg-green-50 border-green-200',
                icon: <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />,
                text: `The damage claim has been rejected. The host is required to return the ${depositFmt} security deposit to you.`,
              },
              released: {
                bg: 'bg-emerald-50 border-emerald-200',
                icon: <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />,
                text: `Your host has confirmed that the ${depositFmt} security deposit has been returned to you.`,
              },
            };
            const panel = panels[booking.depositStatus ?? 'held'];
            if (!panel) return null;
            return (
              <div className={`mt-4 border rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm ${panel.bg}`}>
                {panel.icon}
                <p className="text-neutral-700 leading-snug">{panel.text}</p>
              </div>
            );
          })()}

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

        {/* Check-in instructions (G6) — shown when booking is confirmed */}
        {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
          booking.property?.checkInInstructions ||
          (booking.property as any)?.wifiName ||
          (booking.property as any)?.doorCode
        ) && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Home className="h-4 w-4" /> Check-in information
            </h2>

            {/* Structured fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {(booking.property as any)?.doorCode && (
                <div className="bg-white/70 rounded-xl px-4 py-3 border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Door Code</p>
                  <p className="text-lg font-mono font-bold text-blue-900 mt-0.5">{(booking.property as any).doorCode}</p>
                </div>
              )}
              {(booking.property as any)?.wifiName && (
                <div className="bg-white/70 rounded-xl px-4 py-3 border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">WiFi</p>
                  <p className="text-sm font-semibold text-blue-900 mt-0.5">{(booking.property as any).wifiName}</p>
                  {(booking.property as any)?.wifiPassword && (
                    <p className="text-xs text-blue-700 mt-0.5">Password: <span className="font-mono font-semibold">{(booking.property as any).wifiPassword}</span></p>
                  )}
                </div>
              )}
            </div>

            {/* Freeform instructions */}
            {booking.property?.checkInInstructions && (
              <p className="text-sm text-blue-800 whitespace-pre-line">{booking.property.checkInInstructions}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/rooms/${booking.property?.uuid || booking.property?.id}`}
            className="flex-1 text-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View property
          </Link>
          {/* G5: Get Directions — links to Google Maps with property coordinates */}
          {booking.property?.lat && booking.property?.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.property.lat},${booking.property.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Navigation className="h-3.5 w-3.5" />
              Get directions
            </a>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'declined' && (
            <Link
              href={`/${locale}/trips/dispute/${booking.id}`}
              className="flex-1 text-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Open dispute
            </Link>
          )}
          {/* G3: Invoice PDF Download */}
          <button
            onClick={async () => {
              try {
                const blob = await bookingsApi.downloadInvoice(booking.id);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-${booking.bookingRef || booking.id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch { /* silently fail */ }
            }}
            className="flex-1 text-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            Invoice
          </button>
        </div>
      </div>
    </FadeIn>
  );
}
