'use client';

import { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const rating = review.overallRating ?? review.rating ?? 0;
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE_AT = 180;
  const isLong = (review.comment?.length ?? 0) > TRUNCATE_AT;
  const displayText = !isLong || expanded
    ? review.comment
    : review.comment?.slice(0, TRUNCATE_AT).trimEnd() + '…';

  return (
    <div className="group rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={review.reviewer.avatar}
            firstName={review.reviewer.firstName}
            lastName={review.reviewer.lastName}
            size="md"
          />
          <div>
            <p className="font-semibold text-neutral-900 text-sm leading-tight">
              {review.reviewer.firstName} {review.reviewer.lastName}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{formatDate(review.createdAt, 'MMMM yyyy')}</p>
          </div>
        </div>
        {/* Rating badge */}
        <div className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1">
          <Star className="h-3.5 w-3.5 fill-violet-500 text-violet-500" />
          <span className="text-xs font-bold text-indigo-700">{Number(rating).toFixed(1)}</span>
        </div>
      </div>

      {/* Stars row */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 transition-colors ${
              i < rating ? 'fill-violet-500 text-violet-500' : 'fill-neutral-200 text-neutral-200'
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      {review.comment && (
        <div>
          <p className="text-sm text-neutral-700 leading-relaxed">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Show more</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Host reply */}
      {review.hostReply && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 mt-1">
          <p className="text-xs font-semibold text-indigo-700 mb-1">Response from host</p>
          <p className="text-sm text-neutral-600 leading-relaxed">{review.hostReply}</p>
        </div>
      )}
    </div>
  );
}
