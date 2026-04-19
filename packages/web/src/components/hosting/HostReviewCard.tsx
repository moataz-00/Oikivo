'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { reviewsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import type { Review } from '@/types';

interface HostReviewCardProps {
  review: Review;
}

export function HostReviewCard({ review }: HostReviewCardProps) {
  const t = useTranslations('hosting');
  const rating = review.overallRating ?? review.rating ?? 0;
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();
  const TRUNCATE_AT = 180;
  const isLong = (review.comment?.length ?? 0) > TRUNCATE_AT;
  const displayText = !isLong || expanded
    ? review.comment
    : review.comment?.slice(0, TRUNCATE_AT).trimEnd() + '…';

  const replyMutation = useMutation({
    mutationFn: () => reviewsApi.replyReview(review.id, replyText),
    onSuccess: () => {
      toast.success(t('replyPosted') ?? 'Reply posted');
      setReplyOpen(false);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['host-reviews'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to post reply');
    },
  });

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={review.reviewer?.avatar}
            firstName={review.reviewer?.firstName}
            lastName={review.reviewer?.lastName}
            size="md"
          />
          <div>
            <p className="font-semibold text-neutral-900 text-sm leading-tight">
              {review.reviewer?.firstName} {review.reviewer?.lastName}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{formatDate(review.createdAt, 'MMMM yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1">
          <Star className="h-3.5 w-3.5 fill-violet-500 text-violet-500" />
          <span className="text-xs font-bold text-indigo-700">{Number(rating).toFixed(1)}</span>
        </div>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < rating ? 'fill-violet-500 text-violet-500' : 'fill-neutral-200 text-neutral-200'}`}
          />
        ))}
      </div>

      {/* Property reference */}
      {(review as any).property && (
        <p className="text-xs text-neutral-500">
          {(review as any).property.title}
        </p>
      )}

      {/* Comment */}
      {review.comment && (
        <div>
          <p className="text-sm text-neutral-700 leading-relaxed">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show more</>}
            </button>
          )}
        </div>
      )}

      {/* Existing host reply */}
      {review.hostReply && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <p className="text-xs font-semibold text-indigo-700 mb-1">{t('yourReply') ?? 'Your reply'}</p>
          <p className="text-sm text-neutral-600 leading-relaxed">{review.hostReply}</p>
        </div>
      )}

      {/* Reply button / form */}
      {!review.hostReply && (
        <>
          {!replyOpen ? (
            <button
              onClick={() => setReplyOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('replyToReview') ?? 'Reply to review'}
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
                placeholder={t('replyPlaceholder') ?? 'Write your reply to the guest…'}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setReplyOpen(false); setReplyText(''); }}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                >
                  {t('cancelReply') ?? 'Cancel'}
                </button>
                <button
                  onClick={() => replyMutation.mutate()}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  <Send className="h-3 w-3" />
                  {replyMutation.isPending ? (t('posting') ?? 'Posting…') : (t('postReply') ?? 'Post reply')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
