'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Scale, CheckCircle, XCircle, Eye, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-900/50 text-red-400',
  under_review: 'bg-amber-900/50 text-amber-400',
  resolved: 'bg-emerald-900/50 text-emerald-400',
  closed: 'bg-gray-700 text-gray-400',
};

const RESOLUTION_OPTIONS = [
  { value: 'resolved_for_guest', label: 'Resolved for Guest' },
  { value: 'resolved_for_host', label: 'Resolved for Host' },
  { value: 'split', label: 'Split Decision' },
  { value: 'dismissed', label: 'Dismissed' },
];

function ResolveModal({
  disputeId,
  onClose,
  onSubmit,
  isPending,
}: {
  disputeId: number;
  onClose: () => void;
  onSubmit: (resolution: string, adminNote: string) => void;
  isPending: boolean;
}) {
  const [resolution, setResolution] = useState('resolved_for_guest');
  const [adminNote, setAdminNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Resolve Dispute #{disputeId}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {RESOLUTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Note <span className="text-red-400">*</span></label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Explain the resolution…"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onSubmit(resolution, adminNote)}
              disabled={!adminNote.trim() || isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Resolving…' : 'Resolve Dispute'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: () => adminApi.getDisputes(statusFilter || undefined),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution, adminNote }: { id: number; resolution: string; adminNote: string }) =>
      adminApi.resolveDispute(id, resolution, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolveId(null);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateDisputeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-disputes'] }),
  });

  const items = (disputes ?? []) as any[];

  const counts = useMemo(() => ({
    open: items.filter((d) => d.status === 'open').length,
    under_review: items.filter((d) => d.status === 'under_review').length,
    resolved: items.filter((d) => d.status === 'resolved').length,
    closed: items.filter((d) => d.status === 'closed').length,
  }), [items]);

  return (
    <div className="space-y-5">
      {resolveId !== null && (
        <ResolveModal
          disputeId={resolveId}
          onClose={() => setResolveId(null)}
          onSubmit={(resolution, adminNote) => resolve.mutate({ id: resolveId, resolution, adminNote })}
          isPending={resolve.isPending}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Disputes</h1>
        <p className="text-sm text-gray-400 mt-1">Review and resolve booking disputes</p>
      </div>

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open', value: counts.open, color: 'text-red-400', bg: 'bg-red-900/20 border-red-900/40' },
            { label: 'Under Review', value: counts.under_review, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-900/40' },
            { label: 'Resolved', value: counts.resolved, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-900/40' },
            { label: 'Closed', value: counts.closed, color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {counts.open > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-900/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{counts.open} open dispute{counts.open !== 1 ? 's' : ''} require attention</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
            ))
          : items.length === 0
          ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 flex flex-col items-center py-16 gap-3">
              <Scale className="h-10 w-10 text-gray-600" />
              <p className="text-gray-500 text-sm">No disputes found</p>
            </div>
          )
          : items.map((d: any) => (
            <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 flex flex-wrap items-start gap-4">
                {/* ID + category */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">#{d.id}</span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[d.status] ?? 'bg-gray-700 text-gray-400')}>
                      {d.status}
                    </span>
                    <span className="text-xs bg-gray-800 text-gray-300 rounded-full px-2 py-0.5 capitalize">{d.category}</span>
                  </div>
                  <p className="font-semibold text-white">{d.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Raised by <span className="text-gray-300">{d.raisedBy?.firstName} {d.raisedBy?.lastName}</span>
                    {' '}· Booking #{d.bookingId}
                    {d.booking?.property && <span> · {d.booking.property.title}</span>}
                    {' '}· {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {d.status === 'open' && (
                    <button
                      title="Mark under review"
                      onClick={() => updateStatus.mutate({ id: d.id, status: 'under_review' })}
                      disabled={updateStatus.isPending}
                      className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  )}
                  {(d.status === 'open' || d.status === 'under_review') && (
                    <button
                      title="Resolve"
                      onClick={() => setResolveId(d.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Resolve
                    </button>
                  )}
                  {d.status === 'resolved' && (
                    <button
                      title="Close dispute"
                      onClick={() => updateStatus.mutate({ id: d.id, status: 'closed' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === d.id && (
                <div className="px-5 pb-4 border-t border-gray-800 pt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-0.5">Description</p>
                    <p className="text-sm text-gray-300">{d.description}</p>
                  </div>
                  {d.resolution && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-0.5">Resolution</p>
                      <p className="text-sm text-emerald-400 capitalize">{d.resolution.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {d.adminNote && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-0.5">Admin Note</p>
                      <p className="text-sm text-gray-300">{d.adminNote}</p>
                    </div>
                  )}
                  {d.resolvedAt && (
                    <p className="text-xs text-gray-500">Resolved at: {new Date(d.resolvedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
