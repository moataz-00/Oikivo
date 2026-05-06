'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, Search, XCircle, AlertCircle,
  CalendarDays, Users, Home, ImageIcon, Upload, Paperclip, Send, Mail, Phone,
  DollarSign, Tag,
} from 'lucide-react';
import { disputesApi } from '@/lib/api';
import { FadeIn } from '@/components/ui/Motion';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { getImageUrl } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  open:         { label: 'Open',         bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700', icon: AlertCircle  },
  under_review: { label: 'Under review', bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700',  icon: Search       },
  resolved:     { label: 'Resolved',     bg: 'bg-green-50 border-green-200',  text: 'text-green-700', icon: CheckCircle2 },
  closed:       { label: 'Closed',       bg: 'bg-gray-50 border-gray-200',    text: 'text-gray-600',  icon: XCircle      },
};

const STATUS_STEPS = [
  { key: 'open',         label: 'Dispute filed'  },
  { key: 'under_review', label: 'Under review'   },
  { key: 'resolved',     label: 'Resolved'       },
];
const STEP_ORDER = ['open', 'under_review', 'resolved', 'closed'];

const CATEGORY_LABELS: Record<string, string> = {
  property_damage:    'Property damage',
  cleanliness:        'Cleanliness',
  noise_complaint:    'Noise complaint',
  unauthorized_guest: 'Unauthorized guest',
  early_checkout:     'Early checkout',
  host_issues:        'Host issues',
  payment_dispute:    'Payment dispute',
  other:              'Other',
};

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
              <span className={`absolute top-3.5 left-1/2 w-full h-0.5 -translate-y-1/2 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
            <span className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              done    ? 'bg-emerald-400 border-emerald-400 text-white' :
              active  ? 'bg-white border-emerald-500 text-emerald-600' :
                        'bg-white border-gray-200 text-gray-400'
            }`}>
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

export default function HostDisputeDetailPage() {
  const params      = useParams();
  const locale      = useLocale();
  const qc          = useQueryClient();
  const disputeSlug = String(params.id);
  const isNumericId = /^\d+$/.test(disputeSlug);

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: dispute, isLoading, isError } = useQuery({
    queryKey: ['dispute', disputeSlug],
    queryFn:  () => isNumericId ? disputesApi.getById(Number(disputeSlug)) : disputesApi.getByUuid(disputeSlug),
    enabled:  !!disputeSlug,
  });

  const responseMut = useMutation({
    mutationFn: async () => {
      // Upload evidence photos first if selected
      if (evidenceFiles.length > 0) {
        await disputesApi.uploadEvidence(dispute!.id, evidenceFiles);
      }
      // Append the text response
      if (responseMsg.trim()) {
        await disputesApi.appendUpdate(dispute!.id, responseMsg.trim());
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispute', disputeSlug] });
      setResponseMsg('');
      setEvidenceFiles([]);
      setEvidencePreviews([]);
      toast.success('Your response has been submitted');
    },
    onError: () => toast.error('Failed to submit response. Please try again.'),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...evidenceFiles, ...files].slice(0, 10);
    setEvidenceFiles(combined);
    const previews = combined.map((f) => URL.createObjectURL(f));
    setEvidencePreviews(previews);
    e.target.value = '';
  };

  const removeEvidenceFile = (idx: number) => {
    const newFiles    = evidenceFiles.filter((_, i) => i !== idx);
    const newPreviews = evidencePreviews.filter((_, i) => i !== idx);
    URL.revokeObjectURL(evidencePreviews[idx]);
    setEvidenceFiles(newFiles);
    setEvidencePreviews(newPreviews);
  };

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
  const filedDate  = new Date(dispute.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const booking    = dispute.booking;
  const guest      = dispute.raisedBy ?? booking?.guest;

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  // Hosts see their own uploads (hostEvidence); guest evidence is hidden server-side
  const evidenceUrls: string[] = (dispute.hostEvidence ?? []).map((path: string) => {
    const filename = path.split('/').pop() ?? '';
    return `${apiBase}/disputes/${dispute.id}/evidence/${encodeURIComponent(filename)}`;
  });

  const canRespond = dispute.status === 'open' || dispute.status === 'under_review';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <FadeIn>
          <Link
            href={`/${locale}/hosting/disputes`}
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
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Dispute details</h2>
            <p className="font-bold text-gray-900 mb-1">{dispute.title}</p>
            {dispute.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-3 capitalize">
                <Tag className="w-3 h-3" />
                {CATEGORY_LABELS[dispute.category] ?? dispute.category.replace(/_/g, ' ')}
              </span>
            )}
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {/* Guest info */}
          {guest && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Filed by</h2>
              <div className="flex items-center gap-3">
                <Avatar
                  src={guest.avatarUrl ?? undefined}
                  firstName={guest.firstName}
                  lastName={guest.lastName}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{guest.firstName} {guest.lastName}</p>
                  {guest.email && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {guest.email}
                    </p>
                  )}
                  {guest.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {guest.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    className="w-full h-36 object-cover rounded-xl mb-4"
                  />
                ) : null;
              })()}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {booking.property?.title && (
                  <div className="flex items-start gap-2 col-span-2">
                    <Home className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="font-medium text-gray-900">{booking.property.title}</span>
                  </div>
                )}
                {(booking.checkIn || booking.checkOut) && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Stay</p>
                      <p className="text-gray-700">
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
                {booking.guestsCount && (
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Guests</p>
                      <p className="text-gray-700">{booking.guestsCount}</p>
                    </div>
                  </div>
                )}
                {booking.totalAmount && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-gray-700 font-medium">
                        {Number(booking.totalAmount).toLocaleString()} {booking.currency ?? 'EGP'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence from guest */}
          {evidenceUrls.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Your evidence ({evidenceUrls.length})
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {evidenceUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional info / history */}
          {dispute.additionalInfo && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Additional information</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{dispute.additionalInfo}</p>
            </div>
          )}

          {/* Admin resolution */}
          {(dispute.adminNote || dispute.resolution) && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-5">
              <h2 className="text-sm font-semibold text-blue-700 mb-2">Oikivo decision</h2>
              {dispute.resolution && (
                <p className="text-sm font-medium text-blue-800 capitalize mb-1">
                  Resolution: {dispute.resolution.replace(/_/g, ' ')}
                </p>
              )}
              {dispute.adminNote && (
                <p className="text-sm text-blue-700 leading-relaxed">{dispute.adminNote}</p>
              )}
              {dispute.resolvedAt && (
                <p className="text-xs text-blue-500 mt-2">
                  Resolved on {new Date(dispute.resolvedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {/* Host response / add evidence */}
          {canRespond && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Add your response or evidence</h2>
              <p className="text-xs text-gray-500 mb-4">
                You can add a written response and/or upload supporting photos to help Oikivo review this dispute.
              </p>

              {/* Text response */}
              <textarea
                value={responseMsg}
                onChange={(e) => setResponseMsg(e.target.value)}
                rows={4}
                placeholder="Describe your side of the situation..."
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
              />

              {/* Evidence photo upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-3"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach photos or documents ({evidenceFiles.length}/10)
                </button>

                {/* Preview thumbnails */}
                {evidencePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {evidencePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeEvidenceFile(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-400 text-center mt-0.5 truncate max-w-[64px]">
                          {evidenceFiles[i]?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => responseMut.mutate()}
                isLoading={responseMut.isPending}
                disabled={!responseMsg.trim() && evidenceFiles.length === 0}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit response
              </Button>
            </div>
          )}
        </FadeIn>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={evidenceUrls[lightboxIdx]}
            alt={`Evidence ${lightboxIdx + 1}`}
            className="max-w-full max-h-full rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            {evidenceUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + evidenceUrls.length) % evidenceUrls.length); }}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1 text-sm"
                >←</button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % evidenceUrls.length); }}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1 text-sm"
                >→</button>
              </>
            )}
            <button
              onClick={() => setLightboxIdx(null)}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1 text-sm"
            >✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
