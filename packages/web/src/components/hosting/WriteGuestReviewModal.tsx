'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, X, Send, Smile, Edit3 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { reviewsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { Review } from '@/types';

interface PendingBooking {
  id: number;
  checkIn: string;
  checkOut: string;
  guest: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    avatar?: string;
  };
  property: {
    id: number;
    title: string;
  };
}

interface WriteGuestReviewModalProps {
  booking: PendingBooking;
  onClose: () => void;
  onSuccess: () => void;
  /** When provided, modal is in edit mode — pre-fills fields, calls updateReview */
  existingReview?: Review;
}

const SUB_RATINGS = [
  { key: 'communicationRating', label: 'Communication', emoji: '💬', hint: 'How responsive was this guest?' },
  { key: 'cleanlinessRating',   label: 'Cleanliness',   emoji: '🧹', hint: 'Did they leave the space clean?' },
  { key: 'checkinRating',       label: 'Check-in',      emoji: '🗝️', hint: 'Was the check-in process smooth?' },
] as const;

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const RATING_EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩'];

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.button
            key={i}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                i <= display ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'
              }`}
            />
          </motion.button>
        ))}
        {display > 0 && (
          <span className="ml-2 text-sm font-medium text-neutral-600">
            {RATING_EMOJIS[display]} {RATING_LABELS[display]}
          </span>
        )}
      </div>
    </div>
  );
}

export function WriteGuestReviewModal({ booking, onClose, onSuccess, existingReview }: WriteGuestReviewModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!existingReview;
  const [overallRating, setOverallRating] = useState(existingReview?.overallRating ?? 0);
  const [subRatings, setSubRatings] = useState<Record<string, number>>({
    communicationRating: existingReview?.communicationRating ?? 0,
    cleanlinessRating: existingReview?.cleanlinessRating ?? 0,
    checkinRating: existingReview?.checkinRating ?? 0,
  });
  const [comment, setComment] = useState(existingReview?.comment ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      isEditMode
        ? reviewsApi.updateReview(existingReview!.id, {
            overallRating,
            communicationRating: subRatings.communicationRating || undefined,
            cleanlinessRating: subRatings.cleanlinessRating || undefined,
            checkinRating: subRatings.checkinRating || undefined,
            comment: comment.trim() || undefined,
          })
        : reviewsApi.createReview({
            bookingId: booking.id,
            overallRating,
            communicationRating: subRatings.communicationRating || undefined,
            cleanlinessRating: subRatings.cleanlinessRating || undefined,
            checkinRating: subRatings.checkinRating || undefined,
            comment: comment.trim() || undefined,
            reviewerRole: 'host',
          }),
    onSuccess: () => {
      toast.success(isEditMode ? 'Review updated!' : 'Guest review posted!');
      queryClient.invalidateQueries({ queryKey: ['pending-guest-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['host-guest-reviews'] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? (isEditMode ? 'Failed to update review' : 'Failed to post review'));
    },
  });

  const guestAvatarSrc = booking.guest?.avatarUrl ?? (booking.guest as any)?.avatar;
  const canSubmit = overallRating > 0 && !mutation.isPending;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          {/* Header accent */}
          <div className={`h-1.5 w-full ${isEditMode ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-violet-500 to-indigo-500'}`} />

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title + close */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  {isEditMode && <Edit3 className="h-4 w-4 text-amber-500" />}
                  {isEditMode ? 'Edit Guest Review' : 'Review your guest'}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">{booking.property?.title}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Guest info */}
            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
              <Avatar
                src={guestAvatarSrc}
                firstName={booking.guest?.firstName}
                lastName={booking.guest?.lastName}
                size="md"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {booking.guest?.firstName} {booking.guest?.lastName}
                </p>
                <p className="text-xs text-neutral-400">
                  {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
                </p>
              </div>
              <Smile className="ml-auto h-5 w-5 text-amber-400" />
            </div>

            {/* Overall rating */}
            <StarRating value={overallRating} onChange={setOverallRating} label="Overall rating *" />

            {/* Sub-ratings */}
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
              <p className="text-xs font-semibold text-neutral-500 mb-2">Optional detailed ratings</p>
              {SUB_RATINGS.map((s) => (
                <div key={s.key}>
                  <StarRating
                    value={subRatings[s.key] ?? 0}
                    onChange={(v) => setSubRatings((prev) => ({ ...prev, [s.key]: v }))}
                    label={`${s.emoji} ${s.label}`}
                  />
                  <p className="text-xs text-neutral-400 mt-0.5">{s.hint}</p>
                </div>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                Comments <span className="text-neutral-300">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
                placeholder="What was it like hosting this guest? (optional)"
              />
              <p className="mt-0.5 text-right text-xs text-neutral-300">{comment.length}/2000</p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                onClick={() => mutation.mutate()}
                disabled={!canSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="h-4 w-4" />
                {mutation.isPending ? (isEditMode ? 'Saving…' : 'Posting…') : (isEditMode ? 'Save Changes' : 'Post Review')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
