'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Loader2, ImagePlus, X } from 'lucide-react';
import Link from 'next/link';
import { disputesApi, bookingsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { FadeIn } from '@/components/ui/Motion';

const CATEGORIES = [
  { value: 'property_not_as_described', label: 'Property not as described', emoji: '🏠' },
  { value: 'no_show',                   label: 'Host no-show',              emoji: '🚫' },
  { value: 'safety_concern',            label: 'Safety concern',            emoji: '⚠️' },
  { value: 'refund_request',            label: 'Refund request',            emoji: '💰' },
  { value: 'damage_claim',              label: 'Damage claim (host)',        emoji: '🛠️' },
  { value: 'other',                     label: 'Other',                     emoji: '📝' },
] as const;

export default function OpenDisputePage() {
  const params   = useParams();
  const router   = useRouter();
  const locale   = useLocale();
  const bookingId = Number(params.bookingId);

  const [category, setCategory]     = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBooking(bookingId),
    enabled: !!bookingId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const dispute = await disputesApi.create({ bookingId, category, title, description });
      if (evidenceFiles.length > 0) {
        await disputesApi.uploadEvidence(dispute.id, evidenceFiles);
      }
      return dispute;
    },
    onSuccess: () => {
      toast.success('Dispute opened. Our team will review it within 5 business days.');
      router.push(`/${locale}/trips`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to open dispute. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { toast.error('Please select a category'); return; }
    if (title.trim().length < 10) { toast.error('Title must be at least 10 characters'); return; }
    if (description.trim().length < 30) { toast.error('Description must be at least 30 characters'); return; }
    mutation.mutate();
  };

  if (bookingLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <FadeIn>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Link
            href={`/${locale}/trips`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to trips
          </Link>

          {/* Header */}
          <div className="flex items-start gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Open a dispute</h1>
              <p className="text-neutral-500 text-sm mt-1">
                Our resolution team will review your case and respond within 5 business days.
              </p>
            </div>
          </div>

          {/* Booking summary */}
          {booking && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6 flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                {booking.property?.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.property.images[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-medium text-neutral-900 line-clamp-1">{booking.property?.title ?? 'Booking'}</p>
                <p className="text-xs text-neutral-500">
                  {booking.checkIn} → {booking.checkOut} · Booking #{booking.id}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-3">What is this dispute about?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${
                      category === cat.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Dispute title
                <span className="text-neutral-400 font-normal ml-1">(10–200 characters)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Property had no hot water as listed"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
              <p className="text-xs text-neutral-400 mt-1 text-right">{title.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Detailed description
                <span className="text-neutral-400 font-normal ml-1">(30–5 000 characters)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Describe the issue clearly. Include dates, what was promised vs. what happened, and any communication you had with the host."
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none"
              />
              <p className="text-xs text-neutral-400 mt-1 text-right">{description.length}/5000</p>
            </div>

            {/* Evidence photos */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Evidence photos
                <span className="text-neutral-400 font-normal ml-1">(optional, up to 10)</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {evidenceFiles.map((file, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-neutral-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {evidenceFiles.length < 10 && (
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 transition-colors">
                    <ImagePlus className="h-5 w-5 text-neutral-400" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setEvidenceFiles((prev) => [...prev, ...files].slice(0, 10));
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              {evidenceFiles.length > 0 && (
                <p className="text-xs text-neutral-400 mt-1">{evidenceFiles.length}/10 photos selected</p>
              )}
            </div>

            {/* Info box */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              <strong>Before submitting:</strong> Please attempt to resolve the issue directly with the host
              via the messaging system. Disputes that haven&apos;t involved prior communication may take
              longer to resolve.
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit dispute'
              )}
            </button>
          </form>
        </div>
      </FadeIn>
    </div>
  );
}
