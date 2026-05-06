'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { getImageUrl, formatDate } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { Booking } from '@/types';

/** G8: Print-friendly booking export page.
 *  Opens in a new tab (/trips/[ref]/export), print isolated via visibility trick.
 */
export default function BookingExportPage() {
  const params = useParams();
  const ref = params?.ref as string;
  const { formatPrice } = useCurrency();

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ['bookingDetail', ref],
    queryFn: () => bookingsApi.getBookingByRef(ref),
    enabled: !!ref,
    staleTime: 60_000,
  });

  if (isLoading || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-neutral-500">
        Loading...
      </div>
    );
  }

  const shortCode = `STAY-${booking.id.toString(36).toUpperCase().padStart(4, '0')}`;
  const qrData = encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/en/trips/${booking.bookingUuid ?? booking.id}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;

  const prop = (booking as any).property;
  const coverImage =
    prop?.photos?.find((i: any) => i.isCover)?.url ??
    prop?.photos?.[0]?.url;

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In Progress',
    completed: 'Completed', cancelled: 'Cancelled', declined: 'Declined',
  };
  const PAYMENT_LABELS: Record<string, string> = {
    pending: 'Pending', paid: 'Paid', refunded: 'Refunded', failed: 'Failed',
    partial: 'Partially paid',
  };
  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    instapay: 'InstaPay', cash: 'Cash', card: 'Card', stripe: 'Card (Stripe)', 'opay-card': 'Card (OPay)',
  };

  const nights = booking.nights ?? 0;
  const guestName = `${booking.guest?.firstName ?? ''} ${booking.guest?.lastName ?? ''}`.trim();
  const hostName = booking.host ? `${booking.host.firstName ?? ''} ${booking.host.lastName ?? ''}`.trim() : null;

  return (
    <>
      {/* Print isolation: hide everything except #printable-content */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-content, #printable-content * { visibility: visible !important; }
          #printable-content { position: fixed; top: 0; left: 0; width: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        body { font-family: system-ui, sans-serif; background: white; color: #111; }
      `}</style>

      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between print:hidden">
        <button onClick={() => window.close()} className="text-sm text-neutral-600 hover:text-neutral-900 underline">
          Close
        </button>
        <button onClick={() => window.print()} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 transition">
          Print / Save as PDF
        </button>
      </div>

      <div id="printable-content" className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Booking Confirmation</p>
            <h1 className="text-2xl font-bold text-neutral-900">{prop?.title ?? 'Your booking'}</h1>
            <p className="text-sm text-neutral-500 font-mono mt-0.5">{shortCode}</p>
          </div>
          {/* QR Code */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR ${shortCode}`} className="h-24 w-24 rounded-lg border border-neutral-200 shrink-0" />
        </div>

        {/* Property card */}
        <div className="flex gap-4 rounded-xl border border-neutral-200 p-4">
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getImageUrl(coverImage)}
              alt={prop?.title}
              className="h-20 w-20 rounded-lg object-cover shrink-0 border border-neutral-100"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-neutral-900">{prop?.title}</h2>
            {prop?.address && <p className="text-sm text-neutral-500 mt-0.5">{prop.address}</p>}
            {(prop?.city || prop?.country) && (
              <p className="text-sm text-neutral-500">{[prop.city, prop.country].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>

        {/* Stay details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Check-in</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatDate(booking.checkIn, 'EEE, MMM d yyyy')}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Check-out</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatDate(booking.checkOut, 'EEE, MMM d yyyy')}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Duration</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">{nights} night{nights !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Guests</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">
              {booking.guestsCount ?? booking.guests} guest{(booking.guestsCount ?? booking.guests) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Booking status */}
        <div className="rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
          <span className="text-sm text-neutral-600">Booking status</span>
          <span className="text-sm font-semibold">{STATUS_LABELS[booking.status] ?? booking.status}</span>
        </div>

        {/* People */}
        <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-2">People</p>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Guest</span>
            <span className="font-medium">{guestName || '-'}</span>
          </div>
          {hostName && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Host</span>
              <span className="font-medium">{hostName}</span>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-2">Price breakdown</p>
          {Number(booking.basePrice) > 0 && (() => {
            const cur = booking.currency ?? 'EGP';
            const preDiscountBase = Number(booking.basePrice) + Number(booking.discountAmount ?? 0);

            // Best case: nightly rates stored at booking time
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
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {formatPrice(row.price, cur)} × {row.count} night{row.count !== 1 ? 's' : ''}
                      </span>
                      <span>{formatPrice(row.price * row.count, cur)}</span>
                    </div>
                  ))}
                </>
              );
            }

            const storedPPN = (booking.pricePerNight && Number(booking.pricePerNight) > 0)
              ? Number(booking.pricePerNight)
              : null;
            const uniformTotal = storedPPN ? parseFloat((storedPPN * nights).toFixed(2)) : null;
            const hasVariedRates = uniformTotal !== null && Math.abs(preDiscountBase - uniformTotal) > 0.5;

            if (storedPPN && !hasVariedRates) {
              return (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {formatPrice(storedPPN, cur)} × {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                  <span>{formatPrice(storedPPN * nights, cur)}</span>
                </div>
              );
            }

            if (storedPPN && hasVariedRates) {
              return (
                <div className="flex justify-between text-sm items-start">
                  <span className="text-neutral-600">
                    <span className="block">{nights} night{nights !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-neutral-400">Base {formatPrice(storedPPN, cur)}/night · includes variable rates</span>
                  </span>
                  <span>{formatPrice(preDiscountBase, cur)}</span>
                </div>
              );
            }

            return (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">{nights} night{nights !== 1 ? 's' : ''}</span>
                <span>{formatPrice(Number(booking.basePrice), cur)}</span>
              </div>
            );
          })()}
          {Number(booking.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>
                {booking.discountType === 'monthly' ? 'Monthly discount' :
                 booking.discountType === 'weekly' ? 'Weekly discount' :
                 booking.discountType === 'new_listing_promotion' ? 'New listing promotion' :
                 booking.discountType === 'last_minute' ? 'Last-minute discount' : 'Discount'}
                {Number(booking.discountPercent ?? 0) > 0 && ` (${booking.discountPercent}%)`}
              </span>
              <span>−{formatPrice(Number(booking.discountAmount), booking.currency ?? 'EGP')}</span>
            </div>
          )}
          {Number(booking.cleaningFee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Cleaning fee</span>
              <span>{formatPrice(Number(booking.cleaningFee), booking.currency ?? 'EGP')}</span>
            </div>
          )}
          {Number(booking.serviceFee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Service fee</span>
              <span>{formatPrice(Number(booking.serviceFee), booking.currency ?? 'EGP')}</span>
            </div>
          )}
          {Number(booking.taxes) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Taxes</span>
              <span>{formatPrice(Number(booking.taxes), booking.currency ?? 'EGP')}</span>
            </div>
          )}
          <div className="border-t border-neutral-100 pt-2 flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{formatPrice(Number(booking.total), booking.currency ?? 'EGP')}</span>
          </div>
          {/* Security deposit — paid in cash to host, not part of the total */}
          {Number(booking.depositAmount ?? 0) > 0 && (
            <div className="pt-2 border-t border-neutral-100">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Security deposit (cash to host)</span>
                <span>{formatPrice(Number(booking.depositAmount), booking.currency ?? 'EGP')}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Paid directly to the host at check-in. Returned if no damage occurs.
              </p>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-2">Payment</p>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Status</span>
            <span className="font-medium">{PAYMENT_LABELS[booking.paymentStatus] ?? booking.paymentStatus}</span>
          </div>
          {booking.paymentMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Method</span>
              <span className="font-medium">{PAYMENT_METHOD_LABELS[booking.paymentMethod] ?? booking.paymentMethod}</span>
            </div>
          )}
          {booking.paymentReference && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Reference</span>
              <span className="font-mono text-xs">{booking.paymentReference}</span>
            </div>
          )}
        </div>

        {/* Guest message */}
        {booking.message && (
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-2">Message to host</p>
            <p className="text-sm text-neutral-700 leading-relaxed">{booking.message}</p>
          </div>
        )}

        {/* Cancellation policy */}
        {booking.cancellationPolicy && (
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1">Cancellation policy</p>
            <p className="text-sm text-neutral-700 capitalize">{booking.cancellationPolicy.replace(/_/g, ' ')}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-neutral-400 text-center pt-2 border-t border-neutral-100">
          <p>Oikivo | {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p className="font-mono mt-0.5">{booking.bookingUuid}</p>
        </div>
      </div>
    </>
  );
}
