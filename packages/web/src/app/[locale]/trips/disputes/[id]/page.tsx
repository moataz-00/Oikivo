'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, Search, XCircle, AlertCircle,
  CalendarDays, Users, Home, ImageIcon,
} from 'lucide-react';
import { disputesApi } from '@/lib/api';
import { FadeIn } from '@/components/ui/Motion';
import { getImageUrl } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  open:         { label: 'Open',         bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700', icon: AlertCircle  },
  under_review: { label: 'Under review', bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700',  icon: Search       },
  resolved:     { label: 'Resolved',     bg: 'bg-green-50 border-green-200',  text: 'text-green-700', icon: CheckCircle2 },
  closed:       { label: 'Closed',       bg: 'bg-gray-50 border-gray-200',    text: 'text-gray-600',  icon: XCircle      },
};

const STATUS_STEPS: Array<{ key: string; label: string }> = [
  { key: 'open',         label: 'Dispute filed'  },
  { key: 'under_review', label: 'Under review'   },
  { key: 'resolved',     label: 'Resolved'       },
];

const STEP_ORDER = ['open', 'under_review', 'resolved', 'closed'];

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STEP_ORDER.indexOf(status);
  return (
    <ol className="flex items-start gap-0 relative">
      {STATUS_STEPS.map((step, idx) => {
        const stepIdx = STEP_ORDER.indexOf(step.key);
        const done    = currentIdx > stepIdx;
        const active  = currentIdx === stepIdx;
        return (
          <li key={step.key} className="flex-1 flex flex-col items-center relative">
            {idx < STATUS_STEPS.length - 1 && (
              <span
                className={`absolute top-3.5 left-1/2 w-full h-0.5 -translate-y-1/2 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`}
              />
            )}
            <span
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                done    ? 'bg-emerald-400 border-emerald-400 text-white' :
                active  ? 'bg-white border-emerald-500 text-emerald-600' :
                          'bg-white border-gray-200 text-gray-400'
              }`}
            >
              {done ? '✓' : idx + 1}
            </span>
            <span className={`mt-2 text-xs font-medium text-center ${active ? 'text-emerald-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function DisputeDetailPage() {
  const params      = useParams();
  const locale      = useLocale();
  const disputeUuid = String(params.id);
  // Backward-compat: old disputes created before migration_056 may not have a uuid yet,
  // so the link falls back to the numeric id. Handle both cases.
  const isNumericId = /^\d+$/.test(disputeUuid);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data: dispute, isLoading, isError } = useQuery({
    queryKey: ['dispute', disputeUuid],
    queryFn:  () =>
      isNumericId
        ? disputesApi.getById(Number(disputeUuid))
        : disputesApi.getByUuid(disputeUuid),
    enabled:  !!disputeUuid,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !dispute) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Dispute not found.
      </div>
    );
  }

  const cfg        = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.open;
  const StatusIcon = cfg.icon;
  const filedDate  = new Date(dispute.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const booking = dispute.booking;

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const evidenceUrls: string[] = (dispute.evidence ?? []).map((path: string) => {
    const filename = path.split('/').pop() ?? '';
    return `${apiBase}/disputes/${dispute.id}/evidence/${encodeURIComponent(filename)}`;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <FadeIn>
          <Link
            href={`/${locale}/trips/disputes`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All disputes
          </Link>

          {/* Status banner */}
          <div className={`flex items-center gap-3 border rounded-2xl p-4 mb-6 ${cfg.bg}`}>
            <StatusIcon className={`w-6 h-6 shrink-0 ${cfg.text}`} />
            <div>
              <p className={`font-semibold ${cfg.text}`}>Status: {cfg.label}</p>
              <p className="text-xs text-gray-500">Filed on {filedDate}</p>
            </div>
          </div>

          {/* Progress timeline */}
          {dispute.status !== 'closed' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Progress</h2>
              <StatusTimeline status={dispute.status} />
            </div>
          )}

          {/* Dispute details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Your dispute</h2>
            <p className="font-bold text-gray-900 mb-1">{dispute.title}</p>
            <span className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-3 capitalize">
              {(dispute.category ?? '').replace(/_/g, ' ')}
            </span>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {/* Booking summary */}
          {booking && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Related booking</h2>
              {(() => {
                const coverImage = booking.property?.photos?.find((img: any) => img.isCover) ?? booking.property?.photos?.[0];
                return coverImage ? (
                  <img
                    src={getImageUrl(coverImage.url)}
                    alt={booking.property?.title ?? 'Property'}
                    className="w-full h-36 object-cover rounded-xl mb-3"
                  />
                ) : null;
              })()}
              <div className="space-y-2 text-sm text-gray-700">
                {booking.property?.title && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium">{booking.property.title}</span>
                  </div>
                )}
                {(booking.checkIn || booking.checkOut) && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>
                      {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' → '}
                      {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {booking.guestsCount && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{booking.guestsCount} guest{booking.guestsCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence */}
          {evidenceUrls.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Evidence submitted</h2>
              <div className="grid grid-cols-2 gap-2">
                {evidenceUrls.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className="block w-full overflow-hidden rounded-lg border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <img
                      src={src}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-28 object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Admin note */}
          {dispute.adminNote && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
              <h2 className="text-sm font-semibold text-blue-800 mb-2">Note from support</h2>
              <p className="text-sm text-blue-700 leading-relaxed">{dispute.adminNote}</p>
            </div>
          )}

          {/* Resolution */}
          {dispute.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-green-800 mb-2">Resolution</h2>
              <p className="text-sm text-green-700 leading-relaxed">{dispute.resolution}</p>
              {dispute.resolvedAt && (
                <p className="text-xs text-green-600 mt-2">
                  Resolved on{' '}
                  {new Date(dispute.resolvedAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          )}
        </FadeIn>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            onClick={() => setLightboxIdx(null)}
          >
            &times;
          </button>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 text-white text-4xl font-bold w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              &#8249;
            </button>
          )}

          {/* Image */}
          <img
            src={evidenceUrls[lightboxIdx]}
            alt={`Evidence ${lightboxIdx + 1}`}
            className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxIdx < evidenceUrls.length - 1 && (
            <button
              className="absolute right-4 text-white text-4xl font-bold w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              &#8250;
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 text-white text-sm opacity-60">
            {lightboxIdx + 1} / {evidenceUrls.length}
          </p>
        </div>
      )}
    </div>
  );
}
