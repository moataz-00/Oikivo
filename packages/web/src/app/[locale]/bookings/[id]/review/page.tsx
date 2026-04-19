'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { reviewsApi, bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { CreateReviewPayload } from '@/types';

const CATEGORIES: { key: keyof CreateReviewPayload; label: string; description: string }[] = [
  { key: 'cleanlinessRating',    label: 'Cleanliness',    description: 'Was the space clean and tidy?' },
  { key: 'accuracyRating',       label: 'Accuracy',       description: 'Did the listing match expectations?' },
  { key: 'communicationRating',  label: 'Communication',  description: 'Was the host responsive and helpful?' },
  { key: 'locationRating',       label: 'Location',       description: 'How was the surrounding area?' },
  { key: 'valueRating',          label: 'Value',          description: 'Was the price fair for the quality?' },
  { key: 'checkinRating',        label: 'Check-in',       description: 'Was the check-in process smooth?' },
];

function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform active:scale-90"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              'transition-colors',
              (hovered || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'fill-neutral-200 text-neutral-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent',
};

export default function ReviewPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const bookingId = Number(params.id);

  const [overall, setOverall] = useState(0);
  const [ratings, setRatings] = useState<Partial<Record<keyof CreateReviewPayload, number>>>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBooking(bookingId),
    enabled: !!bookingId && isLoggedIn,
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsApi.createReview(payload),
    onSuccess: () => {
      toast.success('Review submitted — thank you!');
      router.push(`/${locale}/trips`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to submit review');
    },
  });

  const handleSubmit = () => {
    if (overall === 0) {
      toast.error('Please select an overall rating');
      return;
    }
    mutation.mutate({
      bookingId,
      overallRating: overall,
      ...Object.fromEntries(
        Object.entries(ratings).filter(([, v]) => v && v > 0)
      ),
      comment: comment.trim() || undefined,
    } as CreateReviewPayload);
  };

  if (!hasHydrated || isLoading) return <FullPageSpinner />;

  // W18: Guard against reviewing an already-reviewed booking
  if (booking?.review || booking?.hasReview) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-3">
        <Star className="h-10 w-10 mx-auto text-amber-400 fill-amber-400" />
        <h2 className="text-xl font-bold text-neutral-900">Already reviewed</h2>
        <p className="text-neutral-500 text-sm">You have already submitted a review for this booking.</p>
        <Button onClick={() => router.push(`/${locale}/trips`)}>Back to Trips</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Rate your stay</h1>
        {booking?.property && (
          <p className="text-sm text-neutral-500 mt-1">{booking.property.title}</p>
        )}
      </div>

      {/* Overall rating */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
        <div>
          <p className="font-semibold text-neutral-900 text-base">Overall experience</p>
          <p className="text-sm text-neutral-500">How would you rate this stay overall?</p>
        </div>
        <StarInput value={overall} onChange={setOverall} size={36} />
        {overall > 0 && (
          <p className="text-sm font-medium text-amber-600">{RATING_LABELS[overall]}</p>
        )}
      </div>

      {/* Sub-category ratings */}
      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {CATEGORIES.map(({ key, label, description }) => {
          const val = (ratings[key] as number) ?? 0;
          return (
            <div key={key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{label}</p>
                <p className="text-xs text-neutral-400">{description}</p>
              </div>
              <div className="shrink-0">
                <StarInput
                  value={val}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                  size={22}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Leave a comment <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="Tell others about your experience..."
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-none"
        />
        <p className="text-xs text-neutral-400 text-right">{comment.length}/1000</p>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={overall === 0 || mutation.isPending}
        className="w-full"
        size="lg"
      >
        {mutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
        Submit Review
      </Button>
    </div>
  );
}
