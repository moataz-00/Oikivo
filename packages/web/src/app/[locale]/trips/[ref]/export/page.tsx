'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { getImageUrl, formatDate } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { Booking } from '@/types';

/** G8: Print-friendly booking export page.
 *  Opens in a new tab (/trips/[ref]/export), auto-triggers print dialog.
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

  // Auto-print once booking is loaded
  useEffect(() => {
    if (booking) {
      window.print();
    }
  }, [booking]);

  if (isLoading || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-neutral-500">
        Loading…
      </div>
    );
  }

  const shortCode = `STAY-${booking.id.toString(36).toUpperCase().padStart(4, '0')}`;
  const qrData = encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/en/trips/${booking.bookingUuid ?? booking.id}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;

  const coverImage =
    (booking as any).property?.images?.find((i: any) => i.isCover)?.url ??
    (booking as any).property?.images?.[0]?.url;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        body { font-family: system-ui, sans-serif; background: white; color: #111; }
      `}</style>

      {/* Close button — hidden when printing */}
      <div className="no-print p-4 border-b border-neutral-200 flex items-center justify-between print:hidden">
        <button onClick={() => window.close()} className="text-sm text-neutral-600 hover:text-neutral-900 underline">
          ← Close
        </button>
        <button onClick={() => window.print()} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 transition">
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Booking Confirmation</h1>
            <p className="text-sm text-neutral-500 mt-0.5 font-mono">{shortCode}</p>
          </div>
          {/* QR Code (uses public QR API — works offline if cached) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR ${shortCode}`} className="h-24 w-24 rounded-lg border border-neutral-200" />
        </div>

        {/* Property */}
        <div className="flex gap-4 rounded-xl border border-neutral-200 p-4">
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getImageUrl(coverImage)}
              alt={(booking as any).property?.title}
              className="h-20 w-20 rounded-lg object-cover shrink-0 border border-neutral-100"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-neutral-900 text-lg">
              {(booking as any).property?.title}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {(booking as any).property?.city}, {(booking as any).property?.country}
            </p>
          </div>
        </div>

        {/* Dates + guests */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Check-in</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">
              {formatDate(booking.checkIn, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Check-out</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">
              {formatDate(booking.checkOut, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Guests</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">
              {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Financial summary */}
        <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-3">Payment</p>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Status</span>
            <span className="font-medium capitalize">{booking.paymentStatus ?? 'pending'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Total</span>
            <span className="font-bold text-neutral-900">
              {formatPrice(Number(booking.total), booking.currency ?? 'EGP')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-neutral-400 text-center pt-2">
          Printed from Oikivo · Booking ref: {booking.bookingUuid ?? booking.id} · {new Date().toLocaleDateString()}
        </p>
      </div>
    </>
  );
}
