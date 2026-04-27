'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

const EMOJI_MAP: { key: keyof Review; label: string; emoji: string }[] = [
  { key: 'cleanlinessRating',    label: 'Cleanliness',    emoji: '🧹' },
  { key: 'accuracyRating',       label: 'Accuracy',       emoji: '🎯' },
  { key: 'communicationRating',  label: 'Communication',  emoji: '💬' },
  { key: 'locationRating',       label: 'Location',       emoji: '📍' },
  { key: 'checkinRating',        label: 'Check-in',       emoji: '🗝️' },
  { key: 'valueRating',          label: 'Value',          emoji: '💰' },
];

const RATING_EMOJI = ['', '😢', '😕', '😐', '😊', '🤩'];
const RATING_LABEL = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Amazing'];

function SubRatingRow({ label, emoji, value }: { label: string; emoji: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-sm text-neutral-600 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Bar */}
        <div className="w-24 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(value / 5) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="h-full rounded-full bg-indigo-500"
          />
        </div>
        <span className="text-sm font-semibold text-neutral-800 w-4 text-right">{value}</span>
        <span className="text-base leading-none">{RATING_EMOJI[value]}</span>
      </div>
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const rating = review.overallRating ?? review.rating ?? 0;
  const [open, setOpen] = useState(false);
  const TRUNCATE_AT = 160;
  const isLong = (review.comment?.length ?? 0) > TRUNCATE_AT;
  const displayText = isLong
    ? review.comment?.slice(0, TRUNCATE_AT).trimEnd() + '…'
    : review.comment;

  const subRatings = EMOJI_MAP.filter(({ key }) => review[key] != null);

  return (
    <>
      {/* Card */}
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(99,102,241,0.10)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm hover:border-indigo-100 transition-colors duration-200 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={review.reviewer.avatarUrl ?? review.reviewer.avatar}
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

        {/* Comment preview */}
        {review.comment && (
          <p className="text-sm text-neutral-700 leading-relaxed">{displayText}</p>
        )}

        {isLong && (
          <p className="text-xs font-semibold text-indigo-500">Tap to read more →</p>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
              >
                {/* Top gradient bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400" />

                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={review.reviewer.avatarUrl ?? review.reviewer.avatar}
                        firstName={review.reviewer.firstName}
                        lastName={review.reviewer.lastName}
                        size="lg"
                      />
                      <div>
                        <p className="font-semibold text-neutral-900 leading-tight">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">{formatDate(review.createdAt, 'MMMM yyyy')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Overall rating */}
                  <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
                    <span className="text-3xl leading-none">{RATING_EMOJI[Math.round(rating)] ?? '⭐'}</span>
                    <div>
                      <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">Overall</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-indigo-700">{Number(rating).toFixed(1)}</span>
                        <span className="text-sm text-indigo-400">/ 5</span>
                        <span className="text-sm font-semibold text-indigo-600 ml-1">
                          {RATING_LABEL[Math.round(rating)] ?? ''}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-violet-500 text-violet-500' : 'fill-neutral-200 text-neutral-200'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Sub-ratings */}
                  {subRatings.length > 0 && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                      className="space-y-3"
                    >
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Ratings breakdown</p>
                      {subRatings.map(({ key, label, emoji }, idx) => (
                        <motion.div
                          key={key as string}
                          variants={{
                            hidden: { opacity: 0, x: -12 },
                            visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                          }}
                        >
                          <SubRatingRow label={label} emoji={emoji} value={review[key] as number} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Review</p>
                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{review.comment}</p>
                    </div>
                  )}

                  {/* Host reply */}
                  {review.hostReply && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <p className="text-xs font-semibold text-indigo-600 mb-1.5">Response from host</p>
                      <p className="text-sm text-neutral-600 leading-relaxed">{review.hostReply}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
