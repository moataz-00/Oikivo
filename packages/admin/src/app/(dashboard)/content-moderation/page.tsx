'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, MapPin,
  User, Home, ImageOff, X, Star, ShieldCheck, BedDouble,
  Bath, Users, ZoomIn, Clock, BarChart3, Mail, Phone,
  Banknote, BookOpen, Wifi, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Constants ─────────────────────────────────────────────────────────────────
const QUEUE_TABS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published',      label: 'Published' },
  { value: 'archived',       label: 'Archived' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  published:      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  archived:       'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600',
  draft:          'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
};

const fmtEGP = (n: number | string | undefined) =>
  `EGP ${Number(n ?? 0).toLocaleString()}`;

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [cur, setCur] = useState(index);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCur((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === 'ArrowLeft') setCur((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, photos.length]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 bg-white/10 hover:bg-white/20">
        <X className="h-5 w-5 text-white" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setCur((i) => Math.max(i - 1, 0)); }}
        disabled={cur === 0}
        className="absolute left-4 rounded-full p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <img
        src={photos[cur]}
        alt=""
        className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setCur((i) => Math.min(i + 1, photos.length - 1)); }}
        disabled={cur === photos.length - 1}
        className="absolute right-4 rounded-full p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
        {cur + 1} / {photos.length}
      </span>
    </div>
  );
}

// ─── Property Detail Modal ─────────────────────────────────────────────────────
function PropertyDetailModal({
  propertyId,
  tab,
  onClose,
  onApprove,
  onReject,
  onArchive,
  onRestore,
  isPending,
}: {
  propertyId: number;
  tab: string;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  isPending: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && lightboxIndex === null) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, lightboxIndex]);

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['admin-property-detail', propertyId],
    queryFn: () => adminApi.getPropertyDetail(propertyId),
    staleTime: 30_000,
  });

  const photos: string[] = (p?.photos ?? []).map((ph: any) =>
    getUploadUrl(typeof ph === 'string' ? ph : (ph.url ?? ''))
  ).filter(Boolean);
  const amenities: any[] = p?.amenities ?? [];
  const houseRules: any[] = p?.houseRules ?? [];
  const reviews: any[]    = p?.reviews ?? [];
  const recentBookings: any[] = p?.recentBookings ?? [];
  const stats = p?.stats ?? {};

  const hostName = p ? `${p.host?.firstName ?? ''} ${p.host?.lastName ?? ''}`.trim() : '';
  const hostAvatar = p?.host?.avatarUrl ? getUploadUrl(p.host.avatarUrl) : null;

  const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value ?? '—'}</span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 overflow-y-auto">
        <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
              {isLoading ? 'Loading…' : (p?.title ?? 'Property Detail')}
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Body */}
          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          )}
          {isError && (
            <div className="flex h-32 items-center justify-center text-red-500 gap-2">
              <AlertTriangle className="h-5 w-5" />
              Failed to load property details
            </div>
          )}

          {p && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">

              {/* Photos grid */}
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[p.status ?? 'draft'])}>
                    {p.status === 'pending_review' ? 'Pending Review' : (p.status ?? 'draft')}
                  </span>
                  {p.category?.name && (
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      {p.category.name}
                    </span>
                  )}
                  {p.isFeatured && (
                    <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-400 dark:border-yellow-700 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
                      ★ Featured
                    </span>
                  )}
                </div>
                {photos.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    <ImageOff className="h-10 w-10 text-gray-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxIndex(i)}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                      >
                        <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{photos.length} photo{photos.length !== 1 ? 's' : ''} — click to enlarge</p>
              </div>

              {/* Booking stats */}
              {(stats.bookingCount != null) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-200 dark:divide-gray-700">
                  {[
                    { icon: <BookOpen className="h-4 w-4" />, label: 'Total Bookings', value: stats.bookingCount ?? 0 },
                    { icon: <Banknote className="h-4 w-4" />, label: 'Revenue', value: fmtEGP(stats.totalRevenue) },
                    { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Paid', value: stats.paidCount ?? 0 },
                    { icon: <Clock className="h-4 w-4" />, label: 'Pending', value: stats.pendingCount ?? 0 },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-1 py-4 px-2">
                      <span className="text-gray-400">{icon}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Host card */}
              <div className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Host</h3>
                <div className="flex items-start gap-4">
                  {hostAvatar ? (
                    <img src={hostAvatar} alt={hostName} className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {hostName.charAt(0) || <User className="h-6 w-6" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">{hostName || '—'}</span>
                      {p.host?.isSuperhost && (
                        <span className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-400 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> Superhost
                        </span>
                      )}
                      {p.host?.isIdVerified && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-400 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" /> ID Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {p.host?.email && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="h-3 w-3 shrink-0" /> {p.host.email}
                        </span>
                      )}
                      {p.host?.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Phone className="h-3 w-3 shrink-0" /> {p.host.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location + Key stats */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoItem label="Location" value={
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {[p.address, p.city, p.state, p.country].filter(Boolean).join(', ') || '—'}
                  </span>
                } />
                <InfoItem label="Price / Night" value={fmtEGP(p.pricePerNight)} />
                <InfoItem label="Max Guests" value={<span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-400" />{p.maxGuests}</span>} />
                <InfoItem label="Bedrooms / Beds" value={<span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-gray-400" />{p.bedrooms} / {p.beds}</span>} />
                <InfoItem label="Bathrooms" value={<span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-gray-400" />{p.bathrooms}</span>} />
                <InfoItem label="Cleaning Fee" value={fmtEGP(p.cleaningFee)} />
              </div>

              {/* Full details */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoItem label="Space Type" value={p.spaceType} />
                <InfoItem label="Property Kind" value={p.propertyKind} />
                <InfoItem label="Category" value={p.category?.name} />
                <InfoItem label="Booking Mode" value={p.bookingMode} />
                <InfoItem label="Cancellation" value={p.cancellationPolicy} />
                <InfoItem label="Min / Max Nights" value={`${p.minNights ?? '—'} / ${p.maxNights ?? '—'}`} />
                <InfoItem label="Check-in After" value={p.checkInAfter} />
                <InfoItem label="Check-out Before" value={p.checkOutBefore} />
                <InfoItem label="Security Deposit" value={fmtEGP(p.securityDeposit)} />
                <InfoItem label="Pets" value={p.allowsPets ? '✓ Allowed' : '✗ Not Allowed'} />
                <InfoItem label="Smoking" value={p.allowsSmoking ? '✓ Allowed' : '✗ Not Allowed'} />
                <InfoItem label="Parties" value={p.allowsParties ? '✓ Allowed' : '✗ Not Allowed'} />
                <InfoItem label="Children" value={p.allowsChildren ? '✓ Allowed' : '✗ Not Allowed'} />
                <InfoItem label="Created" value={fmtDate(p.createdAt)} />
                {p.latitude && <InfoItem label="Coordinates" value={`${Number(p.latitude).toFixed(4)}, ${Number(p.longitude).toFixed(4)}`} />}
              </div>

              {/* Description */}
              {p.description && (
                <div className="p-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{p.description}</p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amenities ({amenities.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a: any, i: number) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                        <Wifi className="h-3 w-3 text-gray-400" />
                        {typeof a === 'string' ? a : (a.name ?? a.nameEn ?? '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {houseRules.length > 0 && (
                <div className="p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">House Rules ({houseRules.length})</h3>
                  <ul className="space-y-1">
                    {houseRules.map((r: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {typeof r === 'string' ? r : (r.rule ?? r.ruleEn ?? '')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reviews ({reviews.length})</h3>
                  <div className="space-y-3">
                    {reviews.slice(0, 6).map((rev: any) => {
                      const reviewer = rev.reviewer ?? rev.guest;
                      const reviewerAvatar = reviewer?.avatarUrl ? getUploadUrl(reviewer.avatarUrl) : null;
                      return (
                        <div key={rev.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex gap-3">
                          {reviewerAvatar ? (
                            <img src={reviewerAvatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {reviewer?.firstName?.charAt(0) ?? '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{reviewer?.firstName} {reviewer?.lastName}</span>
                              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                {'★'.repeat(Math.min(5, rev.rating ?? 0))}{'☆'.repeat(Math.max(0, 5 - (rev.rating ?? 0)))}
                              </span>
                            </div>
                            {rev.comment && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{rev.comment}</p>}
                            <p className="mt-0.5 text-[10px] text-gray-400">{fmtDate(rev.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Bookings */}
              {recentBookings.length > 0 && (
                <div className="p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent Bookings</h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {['Guest', 'Dates', 'Amount', 'Status'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentBookings.slice(0, 5).map((b: any) => {
                          const guestAvatar = b.guest?.avatarUrl ? getUploadUrl(b.guest.avatarUrl) : null;
                          return (
                            <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {guestAvatar ? (
                                    <img src={guestAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                                      {b.guest?.firstName?.charAt(0) ?? '?'}
                                    </div>
                                  )}
                                  <span className="text-gray-900 dark:text-white">{b.guest?.firstName} {b.guest?.lastName}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{fmtEGP(b.totalAmount)}</td>
                              <td className="px-3 py-2">
                                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                  b.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' :
                                  b.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' :
                                  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                                )}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-5 flex flex-wrap gap-3">
                {(tab === 'pending_review' || p.status === 'pending_review' || p.status === 'draft') && (
                  <button
                    onClick={() => onApprove(p.id)}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve & Publish
                  </button>
                )}
                {(tab === 'pending_review' || p.status === 'pending_review') && (
                  <button
                    onClick={() => onReject(p.id)}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                )}
                {(tab === 'published' || p.status === 'published') && (
                  <button
                    onClick={() => onArchive(p.id)}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Archive
                  </button>
                )}
                {(tab === 'archived' || p.status === 'archived') && (
                  <button
                    onClick={() => onRestore(p.id)}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Restore
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox photos={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ContentModerationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab]             = useState<'pending_review' | 'published' | 'archived'>('pending_review');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modalPropertyId, setModalPropertyId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction]      = useState<{ id: number; status: 'archived' | 'published'; label: string } | null>(null);

  // Reset page when tab / search changes
  useEffect(() => { setPage(1); }, [tab, search]);

  // Count queries for stats cards
  const { data: dPending }  = useQuery({ queryKey: ['cm-count', 'pending_review'],  queryFn: () => adminApi.getProperties({ status: 'pending_review', limit: 1 }), staleTime: 30_000 });
  const { data: dPublished }= useQuery({ queryKey: ['cm-count', 'published'],        queryFn: () => adminApi.getProperties({ status: 'published',      limit: 1 }), staleTime: 30_000 });
  const { data: dArchived } = useQuery({ queryKey: ['cm-count', 'archived'],         queryFn: () => adminApi.getProperties({ status: 'archived',       limit: 1 }), staleTime: 30_000 });

  const pendingCount   = dPending?.total   ?? 0;
  const publishedCount = dPublished?.total ?? 0;
  const archivedCount  = dArchived?.total  ?? 0;
  const totalCount     = pendingCount + publishedCount + archivedCount;

  // Main list query
  const { data: d, isLoading } = useQuery({
    queryKey: ['cm-properties', tab, search, page],
    queryFn: () => adminApi.getProperties({ status: tab, search: search || undefined, page, limit: 20 }),
    staleTime: 30_000,
  });
  const items: any[] = d?.items ?? [];

  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updatePropertyStatus(id, status as any),
    onSuccess: (_data, vars) => {
      toast.success(`Property ${vars.status === 'published' ? 'published' : vars.status === 'archived' ? 'archived' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['cm-properties'] });
      queryClient.invalidateQueries({ queryKey: ['cm-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-property-detail', vars.id] });
      setModalPropertyId(null);
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to update property status'),
  });

  const stats = [
    { label: 'Pending Review', value: pendingCount, tab: 'pending_review' as const, color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800', icon: <Clock className="h-5 w-5" /> },
    { label: 'Published',      value: publishedCount, tab: 'published'      as const, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: 'Archived',       value: archivedCount,  tab: 'archived'       as const, color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-800',           border: 'border-gray-200 dark:border-gray-700', icon: <XCircle className="h-5 w-5" /> },
    { label: 'Total',          value: totalCount,     tab: null,                        color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20',    border: 'border-indigo-200 dark:border-indigo-800', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review, approve, or reject property listings before they go live.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, tab: statTab, color, bg, border, icon }) => (
          <button
            key={label}
            onClick={() => statTab && setTab(statTab)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
              bg, border,
              statTab && 'cursor-pointer hover:shadow-md',
              !statTab && 'cursor-default',
              tab === statTab && 'ring-2 ring-offset-1 ring-indigo-400',
            )}
          >
            <span className={cn('shrink-0', color)}>{icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {QUEUE_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative',
              tab === value
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px bg-transparent'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            )}
          >
            {label}
            {value === 'pending_review' && pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Property', 'Host', 'Type', 'Price/Night', 'Status', 'Photos', 'Created', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" style={{ width: `${40 + (j * 7 + i * 3) % 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Home className="h-10 w-10" />
                    <p className="font-medium">No listings found</p>
                    {search && <p className="text-xs">Try a different search term</p>}
                  </div>
                </td>
              </tr>
            )}
            {items.map((p: any) => {
              const coverPhoto = p.photos?.[0];
              const coverUrl = coverPhoto ? getUploadUrl(typeof coverPhoto === 'string' ? coverPhoto : (coverPhoto.url ?? '')) : null;
              const hostAvatar = p.host?.avatarUrl ? getUploadUrl(p.host.avatarUrl) : null;
              const hostName = `${p.host?.firstName ?? ''} ${p.host?.lastName ?? ''}`.trim();
              return (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Property */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {coverUrl ? (
                          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageOff className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[180px]">{p.title}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[160px]">{p.city}{p.country ? `, ${p.country}` : ''}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Host */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[160px]">
                      {hostAvatar ? (
                        <img src={hostAvatar} alt={hostName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {hostName.charAt(0) || <User className="h-3 w-3" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{hostName || '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{p.host?.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {p.propertyKind ?? p.spaceType ?? '—'}
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {fmtEGP(p.pricePerNight)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', STATUS_STYLES[p.status ?? 'draft'])}>
                      {p.status === 'pending_review' ? 'Pending' : (p.status ?? '—')}
                    </span>
                  </td>
                  {/* Photos */}
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {p.photos?.length ?? 0}
                  </td>
                  {/* Created */}
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {fmtDate(p.createdAt)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModalPropertyId(p.id)}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {p.status === 'pending_review' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {p.status === 'pending_review' && (
                        <button
                          onClick={() => setConfirmAction({ id: p.id, status: 'archived', label: 'Reject' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 rounded-lg bg-red-800 hover:bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      {p.status === 'published' && (
                        <button
                          onClick={() => setConfirmAction({ id: p.id, status: 'archived', label: 'Archive' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Archive
                        </button>
                      )}
                      {p.status === 'archived' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{d?.total ?? 0} total listings</span>
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-900 dark:text-white">{page} / {d.totalPages}</span>
            <button
              disabled={page === d.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Full-detail modal */}
      {modalPropertyId !== null && (
        <PropertyDetailModal
          propertyId={modalPropertyId}
          tab={tab}
          onClose={() => setModalPropertyId(null)}
          onApprove={(id) => updateStatus.mutate({ id, status: 'published' })}
          onReject={(id) => { setModalPropertyId(null); setConfirmAction({ id, status: 'archived', label: 'Reject' }); }}
          onArchive={(id) => { setModalPropertyId(null); setConfirmAction({ id, status: 'archived', label: 'Archive' }); }}
          onRestore={(id) => updateStatus.mutate({ id, status: 'published' })}
          isPending={updateStatus.isPending}
        />
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{confirmAction.label} Listing?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {confirmAction.label === 'Reject'
                ? 'This will archive the listing and remove it from public view.'
                : 'This will move the listing to the archive.'}
              {' '}Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: confirmAction.id, status: confirmAction.status })}
                disabled={updateStatus.isPending}
                className="flex-1 rounded-lg bg-red-800 hover:bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Processing…' : `Confirm ${confirmAction.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
