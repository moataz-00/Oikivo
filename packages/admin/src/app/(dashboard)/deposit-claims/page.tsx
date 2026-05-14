'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldCheck, ShieldX, ExternalLink, Image as ImageIcon,
  CheckCircle2, XCircle, Clock, AlertCircle, ZoomIn, X,
  User, Mail, Phone, Calendar, Home, Hash, Banknote,
  Search, Eye, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import { adminApi, getUploadUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_TABS = [
  { value: 'claimed', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

const STATUS_STYLES: Record<string, string> = {
  held:     'bg-blue-900/30 text-blue-400 border-blue-800/40',
  claimed:  'bg-amber-900/30 text-amber-400 border-amber-800/40',
  released: 'bg-gray-800 text-gray-400 border-gray-700',
  approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
  rejected: 'bg-red-900/30 text-red-400 border-red-800/40',
};

const STATUS_LABEL: Record<string, string> = {
  held: 'Held', claimed: 'Pending Review', released: 'Released',
  approved: 'Approved', rejected: 'Rejected',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  held: Clock, claimed: AlertCircle, released: CheckCircle2,
  approved: ShieldCheck, rejected: ShieldX,
};

// â”€â”€â”€ Lightbox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 p-2 transition-colors">
        <X className="h-5 w-5 text-white" />
      </button>
      <img
        src={url}
        alt="Evidence full view"
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// â”€â”€â”€ PersonCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PersonCard({ person, role }: { person: any; role: 'Host' | 'Guest' }) {
  if (!person) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
      <div className="shrink-0">
        {person.avatarUrl ? (
          <img
            src={getUploadUrl(person.avatarUrl)}
            alt=""
            className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-base font-bold text-white shadow">
            {person.firstName?.[0]}{person.lastName?.[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{person.firstName} {person.lastName}</p>
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] px-2 py-0.5 font-medium">{role}</span>
        </div>
        {person.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="h-3 w-3 shrink-0" />{person.email}
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
            <Phone className="h-3 w-3 shrink-0" />{person.phone}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ ClaimViewModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ClaimViewModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const evidence: string[] = Array.isArray(booking.depositClaimEvidence) ? booking.depositClaimEvidence : [];
  const currency = booking.displayCurrency ?? booking.currency ?? 'EGP';
  const fmt = (n: number) => `${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
  const StatusIcon = STATUS_ICONS[booking.depositStatus] ?? AlertCircle;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-deposit-claims'] });
    qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
  };

  const approveMut = useMutation({
    mutationFn: () => adminApi.approveDepositClaim(booking.id, approveNote || undefined),
    onSuccess: () => {
      toast.success('Deposit claim approved â€” host keeps the deposit');
      invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Approve failed'),
  });

  const rejectMut = useMutation({
    mutationFn: () => adminApi.rejectDepositClaim(booking.id, rejectReason || undefined),
    onSuccess: () => {
      toast.success('Deposit claim rejected â€” host must return deposit to guest');
      invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Reject failed'),
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightboxUrl && !action) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, lightboxUrl, action]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4" onClick={onClose}>
        <div
          className="w-full sm:max-w-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Deposit Claim</h2>
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[booking.depositStatus] ?? STATUS_STYLES.held)}>
                <StatusIcon className="h-3 w-3" />
                {STATUS_LABEL[booking.depositStatus] ?? booking.depositStatus}
              </span>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-6 overflow-y-auto">
            {/* Booking info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Booking</p>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
                  target="_blank"
                >
                  #{booking.id} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Property</p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5 line-clamp-2">{booking.property?.title ?? 'â€”'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Dates</p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">{booking.checkIn} â†’ {booking.checkOut}</p>
                <p className="text-xs text-gray-500">{booking.nights} nights Â· {booking.guestsCount} guest{booking.guestsCount !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{fmt(booking.totalAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Deposit</p>
                <p className="text-sm font-bold text-amber-500 mt-0.5">{fmt(booking.depositAmount)}</p>
              </div>
              {booking.depositClaimDeadline && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Claim Deadline</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                    {new Date(booking.depositClaimDeadline).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </div>

            {/* Host & Guest */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Parties Involved</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PersonCard person={booking.host} role="Host" />
                <PersonCard person={booking.guest} role="Guest" />
              </div>
            </div>

            {/* Claim reason */}
            {booking.depositClaimReason && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Host's Claim Reason</p>
                <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4">
                  <p className="text-sm text-amber-200 leading-relaxed whitespace-pre-wrap">{booking.depositClaimReason}</p>
                </div>
              </div>
            )}

            {/* Evidence photos */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Evidence Photos
                <span className="ml-2 rounded-full bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5">{evidence.length}</span>
              </p>
              {evidence.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 rounded-xl border border-dashed border-gray-700 bg-gray-900/50">
                  <ImageIcon className="h-6 w-6 text-gray-600" />
                  <p className="text-xs text-gray-500">No evidence photos uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {evidence.map((path: string, i: number) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 group cursor-zoom-in aspect-square"
                      onClick={() => setLightboxUrl(getUploadUrl(path))}
                    >
                      <img
                        src={getUploadUrl(path)}
                        alt={`Evidence ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      <div className="absolute bottom-1 right-1 rounded bg-black/60 text-white text-[9px] px-1 py-0.5">
                        {i + 1}/{evidence.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision display if already resolved */}
            {(booking.depositStatus === 'approved' || booking.depositStatus === 'rejected') && (
              <div className={cn(
                'rounded-xl border p-4 flex gap-3',
                booking.depositStatus === 'approved'
                  ? 'border-emerald-800/40 bg-emerald-900/10'
                  : 'border-red-800/40 bg-red-900/10',
              )}>
                {booking.depositStatus === 'approved'
                  ? <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  : <ShieldX className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                }
                <div>
                  <p className={cn('text-sm font-semibold', booking.depositStatus === 'approved' ? 'text-emerald-400' : 'text-red-400')}>
                    {booking.depositStatus === 'approved' ? 'Claim Approved â€” Host keeps the deposit' : 'Claim Rejected â€” Host must return deposit to guest'}
                  </p>
                </div>
              </div>
            )}

            {/* Approve / Reject actions */}
            {booking.depositStatus === 'claimed' && !action && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAction('approve')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />Approve Claim
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-800/80 hover:bg-red-700 px-4 py-3 text-sm font-semibold text-white transition-colors"
                >
                  <ShieldX className="h-4 w-4" />Reject Claim
                </button>
              </div>
            )}

            {/* Approve form */}
            {action === 'approve' && (
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-400">Approve â€” host keeps deposit of {fmt(booking.depositAmount)}</p>
                <p className="text-xs text-gray-400">Both host and guest will be notified by email and in-app.</p>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Admin note (optional) â€” e.g. 'Damage in photos confirmed'"
                  rows={3}
                  className="w-full rounded-lg border border-emerald-800/40 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMut.mutate()}
                    disabled={approveMut.isPending}
                    className="flex-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {approveMut.isPending ? 'Approvingâ€¦' : 'Confirm Approval'}
                  </button>
                  <button
                    onClick={() => setAction(null)}
                    className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reject form */}
            {action === 'reject' && (
              <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-red-400">Reject â€” host must return deposit of {fmt(booking.depositAmount)} to guest</p>
                <p className="text-xs text-gray-400">Both host and guest will be notified by email and in-app.</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional) â€” e.g. 'Insufficient evidence of damage'"
                  rows={3}
                  className="w-full rounded-lg border border-red-800/40 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-700 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectMut.mutate()}
                    disabled={rejectMut.isPending}
                    className="flex-1 rounded-lg bg-red-800 hover:bg-red-700 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {rejectMut.isPending ? 'Rejectingâ€¦' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => setAction(null)}
                    className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DepositClaimsPage() {
  const [tab, setTab] = useState('claimed');
  const [search, setSearch] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: allClaims = [], isLoading } = useQuery({
    queryKey: ['admin-deposit-claims', tab],
    queryFn: () => adminApi.getDepositClaims(tab || undefined),
    placeholderData: (prev) => prev,
  });

  // Stats per status
  const { data: pendingData = [] } = useQuery({ queryKey: ['admin-deposit-claims', 'claimed'], queryFn: () => adminApi.getDepositClaims('claimed'), staleTime: 30_000 });
  const { data: approvedData = [] } = useQuery({ queryKey: ['admin-deposit-claims', 'approved'], queryFn: () => adminApi.getDepositClaims('approved'), staleTime: 30_000 });
  const { data: rejectedData = [] } = useQuery({ queryKey: ['admin-deposit-claims', 'rejected'], queryFn: () => adminApi.getDepositClaims('rejected'), staleTime: 30_000 });

  const pendingCount = (pendingData as any[]).length;
  const approvedCount = (approvedData as any[]).length;
  const rejectedCount = (rejectedData as any[]).length;

  const fmt = (n: number, cur = 'EGP') =>
    `${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cur}`;

  // Client-side search filter
  const claims = (allClaims as any[]).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(b.id).includes(q) ||
      (b.property?.title ?? '').toLowerCase().includes(q) ||
      `${b.host?.firstName} ${b.host?.lastName}`.toLowerCase().includes(q) ||
      (b.host?.email ?? '').toLowerCase().includes(q) ||
      `${b.guest?.firstName} ${b.guest?.lastName}`.toLowerCase().includes(q) ||
      (b.guest?.email ?? '').toLowerCase().includes(q)
    );
  });

  const viewedBooking = viewId !== null ? (allClaims as any[]).find((b) => b.id === viewId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deposit Claims</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review host damage deposit claims and evidence submitted after checkout</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: pendingCount, icon: AlertCircle, color: 'text-amber-400', activeBg: 'bg-amber-900/20 border-amber-800/30', key: 'claimed' },
          { label: 'Approved', value: approvedCount, icon: ShieldCheck, color: 'text-emerald-400', activeBg: 'bg-emerald-900/20 border-emerald-800/30', key: 'approved' },
          { label: 'Rejected', value: rejectedCount, icon: ShieldX, color: 'text-red-400', activeBg: 'bg-red-900/20 border-red-800/30', key: 'rejected' },
          { label: 'Total', value: pendingCount + approvedCount + rejectedCount, icon: Banknote, color: 'text-indigo-400', activeBg: 'bg-indigo-900/20 border-indigo-800/30', key: '' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={cn(
              'rounded-xl border p-4 text-left transition-all hover:scale-[1.02]',
              tab === s.key ? s.activeBg : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
            )}
          >
            <s.icon className={cn('h-5 w-5 mb-2', s.color)} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0.5 gap-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                tab === t.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {t.label}
              {t.value === 'claimed' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5 font-bold">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking #, property, host or guestâ€¦"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-9 pr-8 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_110px_90px_80px] gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Booking / Property</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Host</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Guest</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deposit</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Action</p>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">
              {search ? 'No claims match your search' : tab === 'claimed' ? 'No pending deposit claims' : 'No claims in this category'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {claims.map((b: any) => {
              const currency = b.displayCurrency ?? b.currency ?? 'EGP';
              const evidence: string[] = Array.isArray(b.depositClaimEvidence) ? b.depositClaimEvidence : [];
              const StatusIcon = STATUS_ICONS[b.depositStatus] ?? AlertCircle;
              return (
                <div
                  key={b.id}
                  className="flex flex-wrap sm:grid sm:grid-cols-[1fr_1fr_1fr_110px_90px_80px] items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  {/* Booking / Property */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-indigo-400 font-mono">#{b.id}</span>
                      {b.shortCode && <span className="text-[10px] text-gray-500 font-mono">{b.shortCode}</span>}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white truncate mt-0.5">{b.property?.title ?? 'â€”'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{b.checkIn} â†’ {b.checkOut}</p>
                  </div>

                  {/* Host */}
                  <div className="hidden sm:flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {b.host?.avatarUrl
                        ? <img src={getUploadUrl(b.host.avatarUrl)} alt="" className="h-full w-full object-cover" />
                        : <>{b.host?.firstName?.[0]}{b.host?.lastName?.[0]}</>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{b.host?.firstName} {b.host?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{b.host?.email}</p>
                    </div>
                  </div>

                  {/* Guest */}
                  <div className="hidden sm:flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {b.guest?.avatarUrl
                        ? <img src={getUploadUrl(b.guest.avatarUrl)} alt="" className="h-full w-full object-cover" />
                        : <>{b.guest?.firstName?.[0]}{b.guest?.lastName?.[0]}</>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{b.guest?.firstName} {b.guest?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{b.guest?.email}</p>
                    </div>
                  </div>

                  {/* Deposit */}
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-amber-500">{fmt(b.depositAmount, currency)}</p>
                    {evidence.length > 0 && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <ImageIcon className="h-3 w-3" />{evidence.length} photo{evidence.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block">
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_STYLES[b.depositStatus] ?? STATUS_STYLES.held)}>
                      <StatusIcon className="h-3 w-3" />
                      {STATUS_LABEL[b.depositStatus] ?? b.depositStatus}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setViewId(b.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        b.depositStatus === 'claimed'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {b.depositStatus === 'claimed' ? 'Review' : 'View'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View modal */}
      {viewedBooking && (
        <ClaimViewModal booking={viewedBooking} onClose={() => setViewId(null)} />
      )}
    </div>
  );
}
