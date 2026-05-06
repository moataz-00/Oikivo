'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, Image as ImageIcon, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { adminApi, getUploadUrl } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'claimed', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: undefined, label: 'All' },
] as const;

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  held:     { label: 'Held',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  claimed:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  released: { label: 'Released', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

function EvidenceThumb({ path }: { path: string }) {
  return (
    <a href={getUploadUrl(path)} target="_blank" rel="noopener noreferrer" title="View full photo">
      <img
        src={getUploadUrl(path)}
        alt="Evidence"
        className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
      />
    </a>
  );
}

export default function DepositClaimsPage() {
  const qc = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<string | undefined>('claimed');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState<{ id: number; amount: string } | null>(null);
  const [approveNote, setApproveNote] = useState('');

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<{ id: number; amount: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['admin-deposit-claims', activeStatus],
    queryFn: () => adminApi.getDepositClaims(activeStatus),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => adminApi.approveDepositClaim(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-deposit-claims'] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      setApproveTarget(null);
      setApproveNote('');
      toast.success('Deposit claim approved — host keeps the deposit');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Approve failed'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminApi.rejectDepositClaim(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-deposit-claims'] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      setRejectTarget(null);
      setRejectReason('');
      toast.success('Deposit claim rejected — host must return deposit to guest');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Reject failed'),
  });

  const fmt = (n: number, currency = 'EGP') =>
    `${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deposit Claims</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review host damage deposit claims and evidence</p>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeStatus === tab.key
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-indigo-600" />
        </div>
      ) : (claims as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <ShieldCheck className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">No deposit claims found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(claims as any[]).map((booking: any) => {
            const evidence: string[] = Array.isArray(booking.depositClaimEvidence) ? booking.depositClaimEvidence : [];
            const badge = STATUS_BADGE[booking.depositStatus ?? 'held'] ?? STATUS_BADGE.held;
            const currency = booking.displayCurrency ?? booking.currency ?? 'EGP';
            const expanded = expandedId === booking.id;

            return (
              <div key={booking.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {/* Row summary */}
                <div
                  className="flex flex-wrap items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : booking.id)}
                >
                  {/* Booking ID + property */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/bookings/${booking.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        #{booking.id} <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-0.5">{booking.property?.title ?? '—'}</p>
                  </div>

                  {/* Deposit amount */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 uppercase">Deposit</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(booking.depositAmount, currency)}</p>
                  </div>

                  {/* Host info */}
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500 uppercase">Host</p>
                    <p className="text-sm text-gray-900 dark:text-white">{booking.host?.firstName} {booking.host?.lastName}</p>
                    <p className="text-xs text-gray-500">{booking.host?.email}</p>
                  </div>

                  {/* Guest info */}
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500 uppercase">Guest</p>
                    <p className="text-sm text-gray-900 dark:text-white">{booking.guest?.firstName} {booking.guest?.lastName}</p>
                    <p className="text-xs text-gray-500">{booking.guest?.email}</p>
                  </div>

                  {/* Evidence count */}
                  <div className="shrink-0 flex items-center gap-1 text-xs text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    {evidence.length} photo{evidence.length !== 1 ? 's' : ''}
                  </div>

                  {/* Deadline */}
                  {booking.depositClaimDeadline && (
                    <div className="shrink-0">
                      <p className="text-xs text-gray-500 uppercase">Deadline</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {new Date(booking.depositClaimDeadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Expand indicator */}
                  <div className="text-gray-400 shrink-0">
                    <span className="text-xs">{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gray-200 dark:border-gray-800 p-5 space-y-4 bg-gray-50 dark:bg-gray-800/30">
                    {/* Claim reason */}
                    {booking.depositClaimReason && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Host's Claim Reason</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          {booking.depositClaimReason}
                        </p>
                      </div>
                    )}

                    {/* Evidence photos */}
                    {evidence.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Evidence Photos</p>
                        <div className="flex flex-wrap gap-2">
                          {evidence.map((path: string, i: number) => (
                            <EvidenceThumb key={i} path={path} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Guest info detail */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Host Details</p>
                        <p className="text-sm text-gray-900 dark:text-white">{booking.host?.firstName} {booking.host?.lastName}</p>
                        <p className="text-xs text-gray-500">{booking.host?.email}</p>
                        <p className="text-xs text-gray-500">{booking.host?.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Guest Details</p>
                        <p className="text-sm text-gray-900 dark:text-white">{booking.guest?.firstName} {booking.guest?.lastName}</p>
                        <p className="text-xs text-gray-500">{booking.guest?.email}</p>
                        <p className="text-xs text-gray-500">{booking.guest?.phone}</p>
                      </div>
                    </div>

                    {/* Actions — only for pending claims */}
                    {booking.depositStatus === 'claimed' && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setApproveTarget({ id: booking.id, amount: fmt(booking.depositAmount, currency) })}
                          className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve claim
                        </button>
                        <button
                          onClick={() => setRejectTarget({ id: booking.id, amount: fmt(booking.depositAmount, currency) })}
                          className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <XCircle className="h-4 w-4" /> Reject claim
                        </button>
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" /> View full booking
                        </Link>
                      </div>
                    )}

                    {/* Resolved status */}
                    {(booking.depositStatus === 'approved' || booking.depositStatus === 'rejected') && (
                      <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                        booking.depositStatus === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {booking.depositStatus === 'approved'
                          ? <><CheckCircle className="h-4 w-4" /> Claim approved — host retains deposit</>
                          : <><XCircle className="h-4 w-4" /> Claim rejected — host must return deposit</>
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve Deposit Claim</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Booking <strong>#{approveTarget.id}</strong> — deposit of <strong>{approveTarget.amount}</strong>.
              The host will be allowed to keep the cash deposit. Both host and guest will be notified by email.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Admin Note (optional)</label>
              <textarea
                rows={3}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="e.g. Evidence of damage confirmed — towels and mirror broken."
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setApproveTarget(null); setApproveNote(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => approveMut.mutate({ id: approveTarget.id, note: approveNote || undefined })}
                disabled={approveMut.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
              >
                {approveMut.isPending ? 'Approving…' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Deposit Claim</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Booking <strong>#{rejectTarget.id}</strong> — deposit of <strong>{rejectTarget.amount}</strong>.
              The host will be required to return the deposit to the guest. Both parties will be notified by email.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient evidence — photos do not show damage caused by guest."
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMut.mutate({ id: rejectTarget.id, reason: rejectReason || undefined })}
                disabled={rejectMut.isPending || !rejectReason.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {rejectMut.isPending ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
