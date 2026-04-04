'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Calendar, Edit3, Eye, Star, Trash2, EyeOff, BedDouble, Users, Bath, BadgeCheck, AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageUrl, formatPrice, formatRating } from '@/lib/utils';
import { propertiesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { Property } from '@/types';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  property: Property;
}

const STATUS_CONFIG = {
  published: {
    label: 'Live',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    ring: 'ring-emerald-300/60',
  },
  draft: {
    label: 'Draft',
    dot: 'bg-amber-400',
    bg: 'bg-amber-400/10',
    text: 'text-amber-700',
    ring: 'ring-amber-300/60',
  },
  archived: {
    label: 'Archived',
    dot: 'bg-neutral-400',
    bg: 'bg-neutral-400/10',
    text: 'text-neutral-500',
    ring: 'ring-neutral-300/60',
  },
  pending_review: {
    label: 'Under Review',
    dot: 'bg-blue-400 animate-pulse',
    bg: 'bg-blue-400/10',
    text: 'text-blue-700',
    ring: 'ring-blue-300/60',
  },
};

export function ListingCard({ property }: ListingCardProps) {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const images = property.images ?? [];
  const coverImage = images.find((img) => img.isCover) ?? images[0];
  const status = STATUS_CONFIG[property.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  const isPublished = property.status === 'published';
  const isDraft = property.status === 'draft';
  const isPendingReview = property.status === 'pending_review';

  const { mutate: togglePublish, isPending: isToggling } = useMutation({
    mutationFn: () => propertiesApi.unpublishListing(property.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['home-section'] });
      toast.success('Listing unpublished â€” moved to drafts');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Action failed. Please try again.'),
  });

  const { mutate: archiveListing, isPending: isArchiving } = useMutation({
    mutationFn: () => propertiesApi.deleteListing(property.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['home-section'] });
      toast.success('Moved to archive. Recoverable within 30 days.');
    },
    onError: () => toast.error('Failed to archive listing'),
  });

  const handleArchive = () => setShowArchiveModal(true);

  return (
    <>
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="group relative bg-white rounded-3xl border border-neutral-200/80 overflow-hidden flex flex-col shadow-sm"
    >
      {/* â”€â”€ Image â”€â”€ */}
      <div className="relative h-48 overflow-hidden bg-neutral-100 shrink-0">
        {coverImage ? (
          <Image
            src={getImageUrl(coverImage.url)}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 select-none bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="text-5xl">ðŸ </span>
            <span className="text-xs text-neutral-400 font-medium">No photos yet</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        {/* Status pill â€” top-left */}
        <div className={cn(
          'absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 backdrop-blur-sm',
          status.bg, status.text, status.ring
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', status.dot)} />
          {status.label}
        </div>

        {/* Price â€” bottom-left */}
        {property.price && (
          <div className="absolute bottom-3 left-3 rounded-xl bg-black/65 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm font-bold text-white">{formatPrice(property.price)}</span>
            <span className="text-xs font-normal text-white/60"> / night</span>
          </div>
        )}

        {/* Rating â€” bottom-right */}
        {property.avgRating != null && property.avgRating > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-black/65 px-2.5 py-1.5 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-white">{formatRating(property.avgRating)}</span>
            <span className="text-white/50 font-normal text-xs">({property.reviewCount})</span>
          </div>
        )}
      </div>

      {/* â”€â”€ Body â”€â”€ */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title + location */}
        <div>
          <h3 className="font-bold text-neutral-900 leading-snug line-clamp-1 text-[15px]">{property.title}</h3>
          <p className="mt-0.5 text-xs text-neutral-400 flex items-center gap-1">
            <span>ðŸ“</span>{property.city}, {property.country}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-neutral-500 bg-neutral-50 rounded-xl px-3 py-2">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-neutral-400" />{property.maxGuests ?? 'â€”'}</span>
          <span className="w-px h-3 bg-neutral-200" />
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-neutral-400" />{property.beds ?? 'â€”'} bed{(property.beds ?? 0) !== 1 ? 's' : ''}</span>
          <span className="w-px h-3 bg-neutral-200" />
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-neutral-400" />{property.bathrooms ?? 'â€”'} bath{(property.bathrooms ?? 0) !== 1 ? 's' : ''}</span>
        </div>

        {/* CTA button */}
        {isPublished && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => togglePublish()}
            disabled={isToggling}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
              'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              isToggling && 'opacity-60 cursor-not-allowed',
            )}
          >
            {isToggling ? 'â€¦' : <><EyeOff className="h-4 w-4" />Unpublish</>}
          </motion.button>
        )}
        {isDraft && (
          <Link
            href={`/${locale}/hosting/listings/${property.id}/verify`}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-sm"
          >
            <BadgeCheck className="h-4 w-4" />
            Verify &amp; Publish
          </Link>
        )}
        {isPendingReview && (
          <div className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 cursor-default select-none">
            <Clock className="h-4 w-4 animate-pulse" />
            Pending Admin Approval
          </div>
        )}

        {/* â”€â”€ Action strip â”€â”€ */}
        <div className="grid grid-cols-4 gap-1 border-t border-neutral-100 pt-3 mt-auto">
          <ActionBtn href={`/${locale}/hosting/listings/${property.uuid}/edit`}    icon={<Edit3     className="h-4 w-4" />} label="Edit"      color="indigo" />
          <ActionBtn href={`/${locale}/rooms/${property.uuid}`}                    icon={<Eye       className="h-4 w-4" />} label="Preview"  color="teal"   />
          <ActionBtn href={`/${locale}/hosting/listings/${property.uuid}/calendar`}icon={<Calendar  className="h-4 w-4" />} label="Calendar" color="blue"   />
          <ActionBtn
            onClick={handleArchive}
            disabled={isArchiving}
            icon={<Trash2 className="h-4 w-4" />}
            label={isArchiving ? 'â€¦' : 'Archive'}
            color="red"
          />
        </div>
      </div>
    </motion.div>

    {/* ── Archive confirmation modal ── */}
    <AnimatePresence>
      {showArchiveModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowArchiveModal(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 flex flex-col gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 self-start">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Archive this listing?</h3>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">
                <span className="font-medium text-neutral-700">&quot;{property.title}&quot;</span> will be hidden from guests.
                You can restore it any time within 30 days.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowArchiveModal(false); archiveListing(); }}
                disabled={isArchiving}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {isArchiving ? 'Archiving…' : 'Yes, archive'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

/* â”€â”€ Tiny reusable action button â”€â”€ */
type ActionBtnProps = {
  icon: React.ReactNode;
  label: string;
  color: 'indigo' | 'teal' | 'blue' | 'red' | 'violet';
  disabled?: boolean;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

const COLOR_MAP = {
  indigo: 'hover:bg-indigo-50 hover:text-indigo-600',
  teal:   'hover:bg-teal-50   hover:text-teal-600',
  blue:   'hover:bg-blue-50   hover:text-blue-600',
  red:    'hover:bg-red-50    hover:text-red-500',
  violet: 'hover:bg-violet-50 hover:text-violet-600',
};

function ActionBtn({ icon, label, color, href, onClick, disabled }: ActionBtnProps) {
  const cls = cn(
    'flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium text-neutral-400 transition-colors w-full',
    COLOR_MAP[color],
    disabled && 'opacity-50 cursor-not-allowed'
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        <span className="leading-none">{label}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}

