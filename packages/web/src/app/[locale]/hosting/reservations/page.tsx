'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageSquare, CalendarClock, Home, Compass, ShieldCheck, Send, Paperclip } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { bookingsApi, experienceBookingsApi, messagesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { getImageUrl, formatPrice, formatDate } from '@/lib/utils';
import type { Booking, BookingStatus, ExperienceBooking, ExperienceBookingStatus } from '@/types';

const statusColors: Record<BookingStatus, 'success' | 'warning' | 'error' | 'default'> = {
  confirmed: 'success',
  in_progress: 'success',
  pending: 'warning',
  cancelled: 'error',
  declined: 'error',
  completed: 'default',
};

const expStatusColors: Record<ExperienceBookingStatus, 'success' | 'warning' | 'error' | 'default'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
  declined: 'error',
  completed: 'default',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

function DepositClaimButton({ bookingId, claimDeadline, amount }: { bookingId: number; claimDeadline?: string | null; amount?: number }) {
  const queryClient = useQueryClient();
  const t = useTranslations('hosting');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deadline = claimDeadline ? new Date(claimDeadline) : null;
  const expired = deadline ? new Date() > deadline : false;
  if (expired) return null;

  const handleClose = () => {
    setOpen(false);
    setReason('');
    evidencePreviews.forEach((url) => URL.revokeObjectURL(url));
    setEvidenceFiles([]);
    setEvidencePreviews([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...evidenceFiles, ...files].slice(0, 10);
    setEvidenceFiles(combined);
    setEvidencePreviews(combined.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(evidencePreviews[idx]);
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const claim = useMutation({
    mutationFn: async () => {
      let evidencePaths: string[] = [];
      if (evidenceFiles.length > 0) {
        const result = await bookingsApi.uploadDepositEvidence(bookingId, evidenceFiles);
        evidencePaths = result.paths ?? [];
      }
      return bookingsApi.claimDeposit(bookingId, reason, evidencePaths);
    },
    onSuccess: () => {
      toast.success('Deposit claim submitted');
      handleClose();
      queryClient.invalidateQueries({ queryKey: ['host-reservations'] });
    },
    onError: () => toast.error('Failed to claim deposit'),
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {t('claimDeposit')}{amount ? ` (${formatPrice(amount, 'EGP')})` : ''}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Scrollable modal */}
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            {/* Sticky header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{t('claimSecurityDeposit')}</h3>
                {amount ? (
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {t('depositAmountLabel')} <strong className="text-neutral-800">{formatPrice(amount, 'EGP')}</strong>
                  </p>
                ) : null}
              </div>
              <button onClick={handleClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6 pt-4 space-y-4">
              <p className="text-sm text-neutral-500">
                {t('describeDamageInfo')}
              </p>

              {/* Reason textarea */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  {t('reasonForClaim')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Describe the damage or reason for claiming the deposit..."
                  className="w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                {!reason.trim() && reason.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">Please provide a reason for your claim.</p>
                )}
              </div>

              {/* Evidence photo upload */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  {t('evidencePhotosLabel')} <span className="text-gray-400">{t('evidenceOptional')}</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload photos showing the damage or issue. This helps Oikivo review your claim faster.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Photo previews */}
                {evidencePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {evidencePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt={`Evidence ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={evidenceFiles.length >= 10}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors w-full justify-center disabled:opacity-40"
                >
                  <Paperclip className="w-4 h-4" />
                  {evidenceFiles.length === 0 ? t('addEvidencePhotos') : `${t('addEvidencePhotos')} (${evidenceFiles.length}/10)`}
                </button>
              </div>

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t('depositReviewNote')}
                </p>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 shrink-0">
              <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">{t('cancel')}</Button>
              <Button
                size="sm"
                isLoading={claim.isPending}
                onClick={() => claim.mutate()}
                disabled={!reason.trim()}
                className="flex-1"
              >
                {t('submitClaim')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Shown when depositStatus === 'claimed' — lets host cancel or edit the claim before admin decides */
function DepositClaimManageButtons({ bookingId, amount, existingReason, existingEvidence }: {
  bookingId: number;
  amount?: number;
  existingReason?: string | null;
  existingEvidence?: string[] | null;
}) {
  const queryClient = useQueryClient();
  const t = useTranslations('hosting');
  const [editOpen, setEditOpen] = useState(false);
  const [reason, setReason] = useState(existingReason ?? '');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClose = () => {
    setEditOpen(false);
    setReason(existingReason ?? '');
    evidencePreviews.forEach((u) => URL.revokeObjectURL(u));
    setEvidenceFiles([]);
    setEvidencePreviews([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...evidenceFiles, ...files].slice(0, 10);
    setEvidenceFiles(combined);
    setEvidencePreviews(combined.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(evidencePreviews[idx]);
    setEvidenceFiles((p) => p.filter((_, i) => i !== idx));
    setEvidencePreviews((p) => p.filter((_, i) => i !== idx));
  };

  const cancelClaim = useMutation({
    mutationFn: () => bookingsApi.cancelDepositClaim(bookingId),
    onSuccess: () => {
      toast.success('Deposit claim cancelled');
      queryClient.invalidateQueries({ queryKey: ['host-reservations'] });
    },
    onError: () => toast.error('Failed to cancel claim'),
  });

  const editClaim = useMutation({
    mutationFn: async () => {
      let evidencePaths: string[] = [];
      if (evidenceFiles.length > 0) {
        const result = await bookingsApi.uploadDepositEvidence(bookingId, evidenceFiles);
        evidencePaths = result.paths ?? [];
      }
      return bookingsApi.editDepositClaim(bookingId, reason, evidencePaths.length ? evidencePaths : existingEvidence ?? undefined);
    },
    onSuccess: () => {
      toast.success('Deposit claim updated');
      handleEditClose();
      queryClient.invalidateQueries({ queryKey: ['host-reservations'] });
    },
    onError: () => toast.error('Failed to update claim'),
  });

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
          <ShieldCheck className="h-3 w-3" /> {t('depositClaimUnderReview')}
        </span>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          {t('editClaim')}
        </button>
        <button
          disabled={cancelClaim.isPending}
          onClick={() => cancelClaim.mutate()}
          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {cancelClaim.isPending ? '…' : t('cancelClaim')}
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleEditClose(); }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{t('editDepositClaim')}</h3>
                {amount ? (
                  <p className="text-sm text-neutral-500 mt-0.5">{t('amountColonLabel')} <strong className="text-neutral-800">{formatPrice(amount, 'EGP')}</strong></p>
                ) : null}
              </div>
              <button onClick={handleEditClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 pt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('reasonLabel')} <span className="text-red-500">*</span></label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Describe the damage..."
                  className="w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('addMoreEvidencePhotos')}</label>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} />
                {evidencePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {evidencePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                        <button type="button" onClick={() => removeFile(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={evidenceFiles.length >= 10}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors w-full justify-center disabled:opacity-40">
                  <Paperclip className="w-4 h-4" /> {t('addPhotos')}
                </button>
              </div>
              {(existingEvidence?.length ?? 0) > 0 && (
                <p className="text-xs text-neutral-400">{t('previousEvidenceKept')}</p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 shrink-0">
              <Button variant="outline" size="sm" onClick={handleEditClose} className="flex-1">{t('cancel')}</Button>
              <Button size="sm" isLoading={editClaim.isPending} onClick={() => editClaim.mutate()} disabled={!reason.trim()} className="flex-1">
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Shown when depositStatus === 'held' and booking is completed — lets host release without claiming */
function ReleaseDepositButton({ bookingId, amount }: { bookingId: number; amount?: number }) {
  const queryClient = useQueryClient();
  const t = useTranslations('hosting');
  const [confirm, setConfirm] = useState(false);

  const release = useMutation({
    mutationFn: () => bookingsApi.releaseDeposit(bookingId),
    onSuccess: () => {
      toast.success('Deposit marked as released to guest');
      queryClient.invalidateQueries({ queryKey: ['host-reservations'] });
    },
    onError: () => toast.error('Failed to release deposit'),
  });

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        {t('releaseDeposit')}{amount ? ` (${formatPrice(amount, 'EGP')})` : ''}
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirm(false); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-2">{t('releaseDepositTitle')}</h3>
            <p className="text-sm text-neutral-600 mb-5">
              {t('releaseDepositDesc')}{amount ? ` (${formatPrice(amount, 'EGP')})` : ''}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setConfirm(false)} className="flex-1">{t('cancel')}</Button>
              <Button size="sm" isLoading={release.isPending} onClick={() => { release.mutate(); setConfirm(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {t('yesRelease')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReservationCard({
  booking,
  onConfirm,
  onDecline,
  onMsgGuest,
}: {
  booking: Booking;
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
  onMsgGuest: (guestId: number, guestName: string, propertyId?: number) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('hosting');
  const coverImage = booking.property.images?.find((i) => i.isCover)?.url ?? booking.property.images?.[0]?.url;

  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="relative h-32 sm:h-24 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
          {coverImage ? (
            <Image src={getImageUrl(coverImage)} alt={booking.property.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100 flex items-center justify-center text-2xl">🏠</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900 truncate">{booking.property.title}</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                📅 {formatDate(booking.checkIn, 'MMM d')} – {formatDate(booking.checkOut, 'MMM d, yyyy')}
                {' '}· {booking.nights} nights · 👥 {booking.guests} guest{booking.guests > 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant={statusColors[booking.status]} className="shrink-0">{booking.status}</Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Avatar src={booking.guest.avatarUrl ?? booking.guest.avatar} firstName={booking.guest.firstName} lastName={booking.guest.lastName} size="sm" />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {booking.guest.firstName} {booking.guest.lastName}
              </p>
              {(booking.guest.isEmailVerified || booking.guest.isPhoneVerified || (booking.guest as any).isIdVerified) && (
                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                  {booking.guest.isEmailVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">✉️ {(booking.guest as any).email ?? 'Email verified'}</span>
                  )}
                  {booking.guest.isPhoneVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">📱 Phone</span>
                  )}
                  {(booking.guest as any).isIdVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">🪪 ID</span>
                  )}
                </div>
              )}
              <p className="text-xs text-neutral-500">💰 {formatPrice(booking.total)} total</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {booking.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onConfirm(booking.id)} className="gap-1.5">
                  <Check className="h-4 w-4" />
                  {t('confirmReservation')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDecline(booking.id)} className="gap-1.5">
                  <X className="h-4 w-4" />
                  {t('declineReservation')}
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => onMsgGuest(booking.guest.id, `${booking.guest.firstName} ${booking.guest.lastName}`, booking.property?.id)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              💬 {t('messageGuest')}
            </button>
            {booking.status === 'completed' && booking.depositStatus === 'held' && (
              <div className="flex items-center gap-2 flex-wrap">
                <DepositClaimButton
                  bookingId={booking.id}
                  claimDeadline={booking.depositClaimDeadline}
                  amount={booking.depositAmount}
                />
                <ReleaseDepositButton bookingId={booking.id} amount={booking.depositAmount} />
              </div>
            )}
            {booking.depositStatus === 'claimed' && (
              <DepositClaimManageButtons
                bookingId={booking.id}
                amount={booking.depositAmount}
                existingReason={booking.depositClaimReason}
                existingEvidence={booking.depositClaimEvidence}
              />
            )}
            {booking.depositStatus === 'approved' && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="h-3 w-3" /> {t('depositClaimApproved')}
              </span>
            )}
            {booking.depositStatus === 'rejected' && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="h-3 w-3" /> {t('claimRejected')}
              </span>
            )}
            {booking.depositStatus === 'released' && (booking.depositAmount ?? 0) > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="h-3 w-3" /> {t('depositReleased')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExperienceReservationCard({
  booking,
  onConfirm,
  onDecline,
  onMsgGuest,
}: {
  booking: ExperienceBooking;
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
  onMsgGuest: (guestId: number, guestName: string, propertyId?: number) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('hosting');
  const coverPhoto = booking.experience.photos?.find((p) => p.isCover) ?? booking.experience.photos?.[0];

  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="relative h-32 sm:h-24 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhoto.url} alt={booking.experience.title} className="w-full h-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100 flex items-center justify-center text-2xl">🎭</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900 truncate">{booking.experience.title}</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                📅 {formatDate(booking.bookingDate, 'MMM d, yyyy')} · {booking.startTime}
                {' '}· 👥 {booking.guestsCount} guest{booking.guestsCount > 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant={expStatusColors[booking.status]} className="shrink-0 capitalize">{booking.status}</Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Avatar src={booking.guest.avatarUrl ?? booking.guest.avatar} firstName={booking.guest.firstName} lastName={booking.guest.lastName} size="sm" />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {booking.guest.firstName} {booking.guest.lastName}
              </p>
              {(booking.guest.isEmailVerified || booking.guest.isPhoneVerified || (booking.guest as any).isIdVerified) && (
                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                  {booking.guest.isEmailVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">✉️ Email</span>
                  )}
                  {booking.guest.isPhoneVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">📱 Phone</span>
                  )}
                  {(booking.guest as any).isIdVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">🪪 ID</span>
                  )}
                </div>
              )}
              <p className="text-xs text-neutral-500">💰 ${booking.totalAmount} total</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {booking.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onConfirm(booking.id)} className="gap-1.5">
                  <Check className="h-4 w-4" />
                  {t('confirmReservation')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDecline(booking.id)} className="gap-1.5">
                  <X className="h-4 w-4" />
                  {t('declineReservation')}
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => onMsgGuest(booking.guest.id, `${booking.guest.firstName} ${booking.guest.lastName}`, (booking.experience as any)?.id)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              💬 {t('messageGuest')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReservationsPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const queryClient = useQueryClient();
  const [activeListingType, setActiveListingType] = useState<'properties' | 'experiences'>('properties');
  const [msgModal, setMsgModal] = useState<{ guestId: number; guestName: string; propertyId?: number } | null>(null);
  const [msgText, setMsgText] = useState('');

  const sendMsgMutation = useMutation({
    mutationFn: ({ guestId, body, propertyId }: { guestId: number; body: string; propertyId?: number }) =>
      messagesApi.startConversation(guestId, body, propertyId),
    onSuccess: () => {
      toast.success('Message sent!');
      setMsgModal(null);
      setMsgText('');
    },
    onError: () => toast.error('Failed to send message'),
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const statuses = ['upcoming', 'pending', 'completed', 'cancelled'] as const;
  const expStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

  const upcomingQuery = useQuery({ queryKey: ['host-reservations', 'upcoming'], queryFn: () => bookingsApi.getHostReservations('upcoming'), enabled: isLoggedIn && isHost, staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: true });
  const pendingQuery = useQuery({ queryKey: ['host-reservations', 'pending'], queryFn: () => bookingsApi.getHostReservations('pending'), enabled: isLoggedIn && isHost, staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: true });
  const completedQuery = useQuery({ queryKey: ['host-reservations', 'completed'], queryFn: () => bookingsApi.getHostReservations('completed'), enabled: isLoggedIn && isHost, staleTime: 60_000, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const cancelledQuery = useQuery({ queryKey: ['host-reservations', 'cancelled'], queryFn: () => bookingsApi.getHostReservations('cancelled'), enabled: isLoggedIn && isHost, staleTime: 60_000, refetchInterval: 60_000, refetchOnWindowFocus: true });

  const queryMap: Record<string, { data?: Booking[]; isLoading: boolean }> = {
    upcoming: upcomingQuery,
    pending: pendingQuery,
    completed: completedQuery,
    cancelled: cancelledQuery,
  };

  const expPendingQuery = useQuery({ queryKey: ['host-exp-reservations', 'pending'], queryFn: () => experienceBookingsApi.getHostReservations('pending'), enabled: isLoggedIn && isHost, staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: true });
  const expConfirmedQuery = useQuery({ queryKey: ['host-exp-reservations', 'confirmed'], queryFn: () => experienceBookingsApi.getHostReservations('confirmed'), enabled: isLoggedIn && isHost, staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: true });
  const expCompletedQuery = useQuery({ queryKey: ['host-exp-reservations', 'completed'], queryFn: () => experienceBookingsApi.getHostReservations('completed'), enabled: isLoggedIn && isHost, staleTime: 60_000, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const expCancelledQuery = useQuery({ queryKey: ['host-exp-reservations', 'cancelled'], queryFn: () => experienceBookingsApi.getHostReservations('cancelled'), enabled: isLoggedIn && isHost, staleTime: 60_000, refetchInterval: 60_000, refetchOnWindowFocus: true });

  const expQueryMap: Record<string, { data?: ExperienceBooking[]; isLoading: boolean }> = {
    pending: expPendingQuery,
    confirmed: expConfirmedQuery,
    completed: expCompletedQuery,
    cancelled: expCancelledQuery,
  };

  const confirmMutation = useMutation({
    mutationFn: bookingsApi.confirmBooking,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-reservations'] }); toast.success('✅ Reservation confirmed!'); },
    onError: () => toast.error('Failed to confirm'),
  });

  const declineMutation = useMutation({
    mutationFn: bookingsApi.declineBooking,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-reservations'] }); toast.success('Reservation declined'); },
    onError: () => toast.error('Failed to decline'),
  });

  const confirmExpMutation = useMutation({
    mutationFn: experienceBookingsApi.confirm,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-exp-reservations'] }); toast.success('✅ Experience booking confirmed!'); },
    onError: () => toast.error('Failed to confirm'),
  });

  const declineExpMutation = useMutation({
    mutationFn: (id: number) => experienceBookingsApi.decline(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['host-exp-reservations'] }); toast.success('Experience booking declined'); },
    onError: () => toast.error('Failed to decline'),
  });

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  const tabConfig: Record<string, { label: string; emoji: string; emptyEmoji: string; emptyText: string }> = {
    upcoming: { label: t('upcoming'), emoji: '🗓️', emptyEmoji: '🌅', emptyText: t('emptyUpcoming') },
    pending: { label: t('tabPending'), emoji: '⏳', emptyEmoji: '✨', emptyText: t('emptyPending') },
    completed: { label: t('tabCompleted'), emoji: '✅', emptyEmoji: '🏆', emptyText: t('emptyCompleted') },
    cancelled: { label: t('tabCancelled'), emoji: '❌', emptyEmoji: '😌', emptyText: t('emptyCancelled') },
  };

  const expTabConfig: Record<string, { label: string; emoji: string; emptyEmoji: string; emptyText: string }> = {
    pending: { label: t('tabPending'), emoji: '⏳', emptyEmoji: '✨', emptyText: t('emptyExpPending') },
    confirmed: { label: t('tabConfirmed'), emoji: '✅', emptyEmoji: '🎭', emptyText: t('emptyExpConfirmed') },
    completed: { label: t('tabCompleted'), emoji: '🏆', emptyEmoji: '🏆', emptyText: t('emptyExpCompleted') },
    cancelled: { label: t('tabCancelled'), emoji: '❌', emptyEmoji: '😌', emptyText: t('emptyCancelled') },
  };

  const listingTypeTabs = [
    { id: 'properties' as const, label: t('tabHomes'), icon: Home },
    { id: 'experiences' as const, label: t('tabExperiences'), icon: Compass },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.09),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.07),transparent_35%)]" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}
          className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <CalendarClock className="h-3.5 w-3.5" />
                🗓️ {t('reservationOps')}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-900">{t('reservations')}</h1>
              <p className="mt-1 text-sm text-neutral-500">{t('reservationsPageDesc')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/hosting/reservations-calendar`}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <CalendarClock className="h-4 w-4 text-indigo-500" />
                {t('calendarView')}
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                ⚡ {t('replyWithin24h')}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Outer listing type tabs */}
        <div className="mb-6 flex border-b border-neutral-200 bg-white rounded-t-2xl overflow-hidden">
          {listingTypeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeListingType === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveListingType(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeListingType === 'properties' ? (
          <Tabs.Root defaultValue="upcoming">
            <Tabs.List className="relative flex gap-0 border-b border-neutral-200 mb-8 overflow-x-auto">
              {statuses.map((status) => {
                const q = queryMap[status];
                const count = q?.data?.length ?? 0;
                const cfg = tabConfig[status];
                return (
                  <Tabs.Trigger key={status} value={status}
                    className="relative px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0">
                    <span>{cfg.emoji} {cfg.label}</span>
                    {count > 0 && (
                      <span className="ms-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-1">
                        {count}
                      </span>
                    )}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            {statuses.map((reservationStatus) => {
              const q = queryMap[reservationStatus];
              const bookings = q?.data ?? [];
              const cfg = tabConfig[reservationStatus];
              return (
                <Tabs.Content key={reservationStatus} value={reservationStatus}>
                  <AnimatePresence mode="wait">
                    {q?.isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex justify-center py-16">
                        <Spinner size="lg" />
                      </motion.div>
                    ) : bookings.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex flex-col items-center py-24 gap-3 text-center">
                        <motion.p className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                          {cfg.emptyEmoji}
                        </motion.p>
                        <p className="text-lg font-semibold text-neutral-700">{cfg.emptyText}</p>
                        <p className="text-sm text-neutral-400">{t('noReservations')}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                        {bookings.map((booking) => (
                          <ReservationCard key={booking.id} booking={booking}
                            onConfirm={(id) => confirmMutation.mutate(id)}
                            onDecline={(id) => declineMutation.mutate(id)}
                            onMsgGuest={(guestId, guestName, propertyId) => setMsgModal({ guestId, guestName, propertyId })} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tabs.Content>
              );
            })}
          </Tabs.Root>
        ) : (
          <Tabs.Root defaultValue="pending">
            <Tabs.List className="relative flex gap-0 border-b border-neutral-200 mb-8 overflow-x-auto">
              {expStatuses.map((status) => {
                const q = expQueryMap[status];
                const count = q?.data?.length ?? 0;
                const cfg = expTabConfig[status];
                return (
                  <Tabs.Trigger key={status} value={status}
                    className="relative px-5 py-3 text-sm font-medium text-neutral-500 border-b-2 border-transparent data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0">
                    <span>{cfg.emoji} {cfg.label}</span>
                    {count > 0 && (
                      <span className="ms-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-1">
                        {count}
                      </span>
                    )}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            {expStatuses.map((expStatus) => {
              const q = expQueryMap[expStatus];
              const bookings = q?.data ?? [];
              const cfg = expTabConfig[expStatus];
              return (
                <Tabs.Content key={expStatus} value={expStatus}>
                  <AnimatePresence mode="wait">
                    {q?.isLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex justify-center py-16">
                        <Spinner size="lg" />
                      </motion.div>
                    ) : bookings.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex flex-col items-center py-24 gap-3 text-center">
                        <motion.p className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                          {cfg.emptyEmoji}
                        </motion.p>
                        <p className="text-lg font-semibold text-neutral-700">{cfg.emptyText}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-4">
                        {bookings.map((booking) => (
                          <ExperienceReservationCard key={booking.id} booking={booking}
                            onConfirm={(id) => confirmExpMutation.mutate(id)}
                            onDecline={(id) => declineExpMutation.mutate(id)}
                            onMsgGuest={(guestId, guestName, propertyId) => setMsgModal({ guestId, guestName, propertyId })} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tabs.Content>
              );
            })}
          </Tabs.Root>
        )}
      </div>
    </div>

    {/* Message guest modal */}
    <AnimatePresence>
      {msgModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => { setMsgModal(null); setMsgText(''); }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('messageGuest')}</h3>
                  <p className="text-xs text-neutral-500">{msgModal.guestName}</p>
                </div>
              </div>
              <button onClick={() => { setMsgModal(null); setMsgText(''); }} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              rows={4}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder={t('writeMessagePlaceholder')}
              className="w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              autoFocus
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setMsgModal(null); setMsgText(''); }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => msgModal && msgText.trim() && sendMsgMutation.mutate({ guestId: msgModal.guestId, body: msgText.trim(), propertyId: msgModal.propertyId })}
                disabled={!msgText.trim() || sendMsgMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                {sendMsgMutation.isPending ? t('sendingMessage') : t('sendMessage')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
