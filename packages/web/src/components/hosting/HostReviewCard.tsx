'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, ChevronDown, ChevronUp, MessageSquare, Send,
  Sparkles, Home, CheckCircle2, Image as ImageIcon,
  Edit2, Trash2, X, MessageCircle,
} from 'lucide-react';
import { formatDate, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { reviewsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import type { Review } from '@/types';

interface HostReviewCardProps {
  review: Review;
}

const SUB_RATINGS: { key: keyof Review; label: string; emoji: string; color: string }[] = [
  { key: 'cleanlinessRating',    label: 'Cleanliness',    emoji: '🧹', color: 'bg-sky-500' },
  { key: 'accuracyRating',       label: 'Accuracy',       emoji: '🎯', color: 'bg-violet-500' },
  { key: 'communicationRating',  label: 'Communication',  emoji: '💬', color: 'bg-indigo-500' },
  { key: 'locationRating',       label: 'Location',       emoji: '📍', color: 'bg-rose-500' },
  { key: 'checkinRating',        label: 'Check-in',       emoji: '🗝️', color: 'bg-amber-500' },
  { key: 'valueRating',          label: 'Value',          emoji: '💰', color: 'bg-emerald-500' },
];

const RATING_EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩'];

const subRatingVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const subRatingItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
function ReviewDetailModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const t = useTranslations('hosting');
  const queryClient = useQueryClient();
  const rating = review.overallRating ?? (review as any).rating ?? 0;

  const [expanded, setExpanded] = useState(false);
  const [commentOpen, setCommentOpen] = useState(true);
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState(false);
  const [editReplyText, setEditReplyText] = useState('');

  const TRUNCATE_AT = 300;
  const isLong = (review.comment?.length ?? 0) > TRUNCATE_AT;
  const displayText = !isLong || expanded
    ? review.comment
    : review.comment?.slice(0, TRUNCATE_AT).trimEnd() + '…';

  const hasSubRatings = SUB_RATINGS.some((s) => review[s.key] != null);
  const photos = review.photos ?? [];

  const avatarSrc =
    (review.reviewer as any)?.avatarUrl ?? (review.reviewer as any)?.avatar ?? undefined;

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

  const editReplyMutation = useMutation({
    mutationFn: () => reviewsApi.replyReview(review.id, editReplyText),
    onSuccess: () => {
      toast.success('Reply updated');
      setEditingReply(false);
      queryClient.invalidateQueries({ queryKey: ['host-reviews'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update reply');
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: () => reviewsApi.deleteReply(review.id),
    onSuccess: () => {
      toast.success('Reply deleted');
      queryClient.invalidateQueries({ queryKey: ['host-reviews'] });
    },
    onError: () => {
      toast.error('Failed to delete reply');
    },
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {/* Accent bar */}
        <div className={`h-1.5 w-full shrink-0 ${
          rating >= 4.5 ? 'bg-gradient-to-r from-violet-500 to-indigo-500' :
          rating >= 3   ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                          'bg-gradient-to-r from-rose-400 to-red-400'
        }`} />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  src={avatarSrc}
                  firstName={review.reviewer?.firstName}
                  lastName={review.reviewer?.lastName}
                  size="md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-white">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </span>
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-sm leading-tight">
                  {review.reviewer?.firstName} {review.reviewer?.lastName}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {formatDate(review.createdAt, 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-2.5 py-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-white">{Number(rating).toFixed(1)}</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stars row */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-neutral-100 text-neutral-100'}`}
              />
            ))}
            <span className="ml-1.5 text-xs text-neutral-400">
              {rating >= 4.5 ? 'Excellent' : rating >= 3.5 ? 'Good' : rating >= 2.5 ? 'Fair' : 'Poor'}
            </span>
          </div>

          {/* Property */}
          {review.property && (
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5">
              <Home className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-xs text-neutral-500 truncate">{review.property.title}</span>
            </div>
          )}

          {/* Comment (collapsible) */}
          {review.comment && (
            <div>
              <button
                onClick={() => setCommentOpen(!commentOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Review comment
                {commentOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <AnimatePresence initial={false}>
                {commentOpen && (
                  <motion.div
                    key="comment"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2">
                      <p className="text-sm text-neutral-700 leading-relaxed">{displayText}</p>
                      {isLong && (
                        <button
                          onClick={() => setExpanded(!expanded)}
                          className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {expanded
                            ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                            : <><ChevronDown className="h-3.5 w-3.5" /> Show more</>}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Sub-ratings (collapsible) */}
          {hasSubRatings && (
            <div>
              <button
                onClick={() => setRatingsOpen(!ratingsOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Detailed ratings
                {ratingsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <AnimatePresence initial={false}>
                {ratingsOpen && (
                  <motion.div
                    key="ratings"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      variants={subRatingVariants}
                      initial="hidden"
                      animate="visible"
                      className="mt-2 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3"
                    >
                      {SUB_RATINGS.map((s) => {
                        const val = review[s.key] as number | undefined;
                        if (val == null) return null;
                        const pct = Math.round((val / 5) * 100);
                        return (
                          <motion.div key={s.key} variants={subRatingItemVariants} className="flex items-center gap-2">
                            <span className="text-sm w-4">{s.emoji}</span>
                            <span className="text-xs text-neutral-500 w-24 shrink-0">{s.label}</span>
                            <div className="relative flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                              <motion.div
                                className={`absolute inset-y-0 left-0 rounded-full ${s.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-neutral-700 w-4 text-right">{val}</span>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Photos (collapsible) */}
          {photos.length > 0 && (
            <div>
              <button
                onClick={() => setPhotosOpen(!photosOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {photos.length} photo{photos.length > 1 ? 's' : ''}
                {photosOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <AnimatePresence initial={false}>
                {photosOpen && (
                  <motion.div
                    key="photos"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {photos.map((url, i) => {
                        const fullUrl = getImageUrl(url);
                        return (
                          <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fullUrl}
                              alt={`Review photo ${i + 1}`}
                              className="h-20 w-20 rounded-xl object-cover border border-neutral-100 hover:scale-105 transition-transform"
                            />
                          </a>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Host reply section */}
          <AnimatePresence initial={false} mode="wait">
            {review.hostReply && !editingReply ? (
              <motion.div
                key="reply-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-indigo-700">
                      {t('yourReply') ?? 'Your reply'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingReply(true); setEditReplyText(review.hostReply!); }}
                        className="text-indigo-400 hover:text-indigo-700 transition-colors"
                        title="Edit reply"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteReplyMutation.mutate()}
                        disabled={deleteReplyMutation.isPending}
                        className="text-rose-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                        title="Delete reply"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{review.hostReply}</p>
                  {review.hostRepliedAt && (
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatDate(review.hostRepliedAt, 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : review.hostReply && editingReply ? (
              <motion.div
                key="reply-edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editReplyText}
                    onChange={(e) => setEditReplyText(e.target.value)}
                    className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
                    placeholder="Edit your reply…"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingReply(false); setEditReplyText(''); }}
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => editReplyMutation.mutate()}
                      disabled={!editReplyText.trim() || editReplyMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      <Send className="h-3 w-3" />
                      {editReplyMutation.isPending ? 'Saving…' : 'Save reply'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="no-reply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimatePresence initial={false} mode="wait">
                  {!replyOpen ? (
                    <motion.button
                      key="reply-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setReplyOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t('replyToReview') ?? 'Reply to review'}
                    </motion.button>
                  ) : (
                    <motion.div
                      key="reply-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 pt-1">
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
                            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                          >
                            {t('cancelReply') ?? 'Cancel'}
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => replyMutation.mutate()}
                            disabled={!replyText.trim() || replyMutation.isPending}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                          >
                            <Send className="h-3 w-3" />
                            {replyMutation.isPending
                              ? (t('posting') ?? 'Posting…')
                              : (t('postReply') ?? 'Post reply')}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Compact card ──────────────────────────────────────────────────────────────
export function HostReviewCard({ review }: HostReviewCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const rating = review.overallRating ?? (review as any).rating ?? 0;
  const avatarSrc =
    (review.reviewer as any)?.avatarUrl ?? (review.reviewer as any)?.avatar ?? undefined;

  const commentPreview = review.comment
    ? review.comment.slice(0, 80) + (review.comment.length > 80 ? '...' : '')
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, transition: { duration: 0.18 } }}
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <Avatar
          src={avatarSrc}
          firstName={review.reviewer?.firstName}
          lastName={review.reviewer?.lastName}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-neutral-900">
              {review.reviewer?.firstName} {review.reviewer?.lastName}
            </p>
            {review.hostReply ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Replied
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                <MessageCircle className="h-3 w-3" />
                Reply needed
              </span>
            )}
          </div>

          {review.property && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
              <Home className="h-3 w-3" />
              <span className="truncate">{review.property.title}</span>
            </div>
          )}

          {commentPreview && (
            <p className="mt-1 text-xs text-neutral-500 truncate">{commentPreview}</p>
          )}

          <p className="mt-1 text-xs text-neutral-400">
            {formatDate(review.createdAt, 'MMM d, yyyy')}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1 rounded-xl bg-neutral-900 px-2.5 py-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-white">{Number(rating).toFixed(1)}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <ReviewDetailModal review={review} onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
