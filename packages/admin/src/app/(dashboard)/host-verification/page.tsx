'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { AuthImage } from '@/lib/AuthImage';
import {
  ShieldCheck, ShieldX, User, CheckCircle2, XCircle, Clock, ImageOff,
  ZoomIn, X, Search, ChevronLeft, ChevronRight, Eye, AlertCircle,
  Mail, Phone, Calendar, Hash, BadgeCheck, Ban, Shield, FileText,
  ExternalLink, RefreshCw, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
  approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
  rejected: 'bg-red-900/30 text-red-400 border-red-800/40',
  none: 'bg-gray-800 text-gray-400 border-gray-700',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  none: AlertCircle,
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 p-2 transition-colors"
      >
        <X className="h-5 w-5 text-white" />
      </button>
      <img
        src={url}
        alt="Document full view"
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── SecureDocPhoto ────────────────────────────────────────────────────────────

function SecureDocPhoto({
  src,
  userId,
  label,
  onLightbox,
}: {
  src: string | null | undefined;
  userId: number;
  label: string;
  onLightbox: (url: string) => void;
}) {
  if (!src) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
        <ImageOff className="h-6 w-6 text-gray-500" />
        <p className="text-xs text-gray-500">{label} — not uploaded</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 group cursor-zoom-in">
      <AuthImage
        src={src}
        userId={userId}
        alt={label}
        className="w-full object-contain max-h-52"
        onClick={(url) => onLightbox(url)}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-center text-[10px] text-white py-1 font-medium tracking-wide">
        {label}
      </div>
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <div className="text-sm text-gray-900 dark:text-white break-all">{value}</div>
      </div>
    </div>
  );
}

// ─── UserViewModal ─────────────────────────────────────────────────────────────

function UserViewModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: u, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminApi.getUserDetail(userId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-users-verifications'] });
    qc.invalidateQueries({ queryKey: ['admin-verif-count-pending'] });
    qc.invalidateQueries({ queryKey: ['admin-verif-count-approved'] });
    qc.invalidateQueries({ queryKey: ['admin-verif-count-rejected'] });
    qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    qc.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
  };

  const approveMut = useMutation({
    mutationFn: () => adminApi.reviewIdDocument(userId, true),
    onSuccess: () => { toast.success('ID approved'); invalidate(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const rejectMut = useMutation({
    mutationFn: (reason?: string) => adminApi.reviewIdDocument(userId, false, reason),
    onSuccess: () => {
      toast.success('ID rejected');
      invalidate();
      setShowRejectForm(false);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to reject'),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightboxUrl) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, lightboxUrl]);

  const StatusIcon = u ? (STATUS_ICONS[(u as any).idVerificationStatus ?? 'none'] ?? AlertCircle) : AlertCircle;

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
              <Shield className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">ID Verification Review</h2>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-40" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-56" />
                </div>
              </div>
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />)}
            </div>
          ) : u ? (
            <div className="p-5 space-y-6 overflow-y-auto">
              {/* Avatar + basic */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  {(u as any).avatarUrl ? (
                    <img
                      src={getUploadUrl((u as any).avatarUrl)}
                      alt=""
                      className="h-16 w-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xl font-bold text-white shadow">
                      {(u as any).firstName?.[0]}{(u as any).lastName?.[0]}
                    </div>
                  )}
                  <span
                    className={cn('absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-gray-950', (u as any).isActive ? 'bg-emerald-500' : 'bg-gray-400')}
                    title={(u as any).isActive ? 'Active' : 'Inactive'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{(u as any).firstName} {(u as any).lastName}</h3>
                    {(u as any).isHost && <span className="rounded-full bg-indigo-900/30 border border-indigo-800/40 text-indigo-400 text-[10px] px-2 py-0.5 font-medium">Host</span>}
                    {(u as any).isSuperhost && <span className="rounded-full bg-amber-900/30 border border-amber-800/40 text-amber-400 text-[10px] px-2 py-0.5 font-medium">Superhost</span>}
                    {(u as any).isAdmin && <span className="rounded-full bg-violet-900/30 border border-violet-800/40 text-violet-400 text-[10px] px-2 py-0.5 font-medium">Admin</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[(u as any).idVerificationStatus ?? 'none'])}>
                      <StatusIcon className="h-3 w-3" />
                      {((u as any).idVerificationStatus ?? 'none').replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">#{(u as any).id}</span>
                    {(u as any).profileUuid && (
                      <Link
                        href={`/users/${(u as any).profileUuid}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                        target="_blank"
                      >
                        <ExternalLink className="h-3 w-3" />View profile
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* User details */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">User Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                  <InfoRow icon={Mail} label="Email" value={
                    <span className="flex items-center gap-1.5">
                      {(u as any).email}
                      {(u as any).isEmailVerified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    </span>
                  } />
                  {(u as any).phone && (
                    <InfoRow icon={Phone} label="Phone" value={
                      <span className="flex items-center gap-1.5">
                        {(u as any).phone}
                        {(u as any).isPhoneVerified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </span>
                    } />
                  )}
                  {(u as any).dateOfBirth && (
                    <InfoRow icon={Calendar} label="Date of Birth" value={new Date((u as any).dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
                  )}
                  <InfoRow icon={Hash} label="Member Since" value={(u as any).createdAt ? new Date((u as any).createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                  <InfoRow icon={Clock} label="Last Login" value={(u as any).lastLoginAt ? new Date((u as any).lastLoginAt).toLocaleString() : 'Never'} />
                  {(u as any).preferredLanguage && (
                    <InfoRow icon={FileText} label="Language" value={(u as any).preferredLanguage?.toUpperCase()} />
                  )}
                  {(u as any).bio && (
                    <div className="sm:col-span-2">
                      <InfoRow icon={User} label="Bio" value={(u as any).bio} />
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection reason if rejected */}
              {(u as any).idVerificationStatus === 'rejected' && (u as any).idRejectionReason && (
                <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 flex gap-3">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-0.5">Previous Rejection Reason</p>
                    <p className="text-sm text-red-300">{(u as any).idRejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Identity Documents</p>
                  {(u as any).idDocumentType && (
                    <span className="rounded-full bg-indigo-900/30 border border-indigo-800/40 text-indigo-300 text-[10px] px-2.5 py-0.5 font-medium">
                      {(u as any).idDocumentType === 'national_id' ? 'National ID' : 'Passport'}
                    </span>
                  )}
                </div>
                <div className={cn('grid gap-3', (u as any).idDocumentType === 'national_id' ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                  <SecureDocPhoto
                    src={(u as any).idDocumentUrl}
                    userId={(u as any).id}
                    label={(u as any).idDocumentType === 'national_id' ? 'Front Side' : 'Photo Page'}
                    onLightbox={setLightboxUrl}
                  />
                  {(u as any).idDocumentType !== 'passport' && (
                    <SecureDocPhoto
                      src={(u as any).idDocumentBackUrl}
                      userId={(u as any).id}
                      label="Back Side"
                      onLightbox={setLightboxUrl}
                    />
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {((u as any).idVerificationStatus === 'pending' || (u as any).idVerificationStatus === 'rejected') && !showRejectForm && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => approveMut.mutate()}
                    disabled={approveMut.isPending || rejectMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {approveMut.isPending ? 'Approving…' : 'Approve Identity'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={approveMut.isPending || rejectMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-800/80 hover:bg-red-700 px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    <ShieldX className="h-4 w-4" />
                    {(u as any).idVerificationStatus === 'rejected' ? 'Re-reject' : 'Reject'}
                  </button>
                </div>
              )}

              {(u as any).idVerificationStatus === 'approved' && !showRejectForm && (
                <div className="flex gap-3 pt-2">
                  <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-900/20 border border-emerald-800/40 px-4 py-3 text-sm font-medium text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />Identity Verified
                  </div>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={rejectMut.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-800/40 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <ShieldX className="h-4 w-4" />Revoke
                  </button>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-400">Rejection reason (shown to user)</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Optional — describe why the document was rejected…"
                    rows={3}
                    className="w-full rounded-lg border border-red-800/40 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-700 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMut.mutate(rejectReason || undefined)}
                      disabled={rejectMut.isPending}
                      className="flex-1 rounded-lg bg-red-800 hover:bg-red-700 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    >
                      {rejectMut.isPending ? 'Rejecting…' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                      className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-gray-500" />
              <p className="text-gray-400 text-sm">User not found</p>
            </div>
          )}
        </div>
      </div>

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HostVerificationPage() {
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-verifications', tab, page, search],
    queryFn: () => adminApi.getUsers({
      page,
      limit: 20,
      idVerificationStatus: tab || undefined,
      search: search || undefined,
    }),
    placeholderData: (prev) => prev,
  });

  const { data: pendingStats } = useQuery({
    queryKey: ['admin-verif-count-pending'],
    queryFn: () => adminApi.getUsers({ page: 1, limit: 1, idVerificationStatus: 'pending' }),
    staleTime: 30_000,
  });
  const { data: approvedStats } = useQuery({
    queryKey: ['admin-verif-count-approved'],
    queryFn: () => adminApi.getUsers({ page: 1, limit: 1, idVerificationStatus: 'approved' }),
    staleTime: 30_000,
  });
  const { data: rejectedStats } = useQuery({
    queryKey: ['admin-verif-count-rejected'],
    queryFn: () => adminApi.getUsers({ page: 1, limit: 1, idVerificationStatus: 'rejected' }),
    staleTime: 30_000,
  });

  const raw = data as any;
  const users: any[] = raw?.items ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
  const totalPages: number = raw?.totalPages ?? 1;
  const total: number = raw?.total ?? 0;

  const pendingCount: number = (pendingStats as any)?.total ?? 0;
  const approvedCount: number = (approvedStats as any)?.total ?? 0;
  const rejectedCount: number = (rejectedStats as any)?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const tabChange = (v: string) => { setTab(v); setPage(1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID Verification</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review identity documents and manage host verification status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-400', activeBg: 'bg-amber-900/20 border-amber-800/30', key: 'pending' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle2, color: 'text-emerald-400', activeBg: 'bg-emerald-900/20 border-emerald-800/30', key: 'approved' },
          { label: 'Rejected', value: rejectedCount, icon: XCircle, color: 'text-red-400', activeBg: 'bg-red-900/20 border-red-800/30', key: 'rejected' },
          { label: 'Total', value: pendingCount + approvedCount + rejectedCount, icon: Shield, color: 'text-indigo-400', activeBg: 'bg-indigo-900/20 border-indigo-800/30', key: '' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => tabChange(s.key)}
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
              onClick={() => tabChange(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                tab === t.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {t.label}
              {t.value === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5 font-bold">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email…"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-9 pr-8 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm font-medium transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_130px_110px_80px] gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">User</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Action</p>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">
              {search ? 'No results found' : tab === 'pending' ? 'All caught up — no pending verifications' : 'No verifications in this category'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.map((u: any) => {
              const StatusIcon = STATUS_ICONS[u.idVerificationStatus ?? 'none'] ?? AlertCircle;
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap sm:grid sm:grid-cols-[1fr_1fr_130px_110px_80px] items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {u.avatarUrl ? (
                        <img src={getUploadUrl(u.avatarUrl)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {u.isHost && <span className="text-[10px] text-indigo-400 font-medium">Host</span>}
                        {u.isSuperhost && <span className="text-[10px] text-amber-400 font-medium">Superhost</span>}
                        <span className="text-[10px] text-gray-500 font-mono">#{u.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="min-w-0 hidden sm:block">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{u.email}</p>
                    {u.phone && <p className="text-xs text-gray-500 mt-0.5">{u.phone}</p>}
                  </div>

                  {/* Document type */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {u.idDocumentType === 'national_id' ? 'National ID' : u.idDocumentType === 'passport' ? 'Passport' : '—'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block">
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[u.idVerificationStatus ?? 'none'])}>
                      <StatusIcon className="h-3 w-3" />
                      {(u.idVerificationStatus ?? 'none').replace('_', ' ')}
                    </span>
                    {u.idVerificationStatus === 'rejected' && u.idRejectionReason && (
                      <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[110px]" title={u.idRejectionReason}>
                        {u.idRejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setViewId(u.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        u.idVerificationStatus === 'pending'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {u.idVerificationStatus === 'pending' ? 'Review' : 'View'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-900 dark:text-white font-medium">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewId !== null && (
        <UserViewModal userId={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  );
}