'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { Scale, CheckCircle, XCircle, Eye, Clock, AlertTriangle, Search, ChevronLeft, ChevronRight, UserPlus, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
  closed: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  medium: 'bg-blue-900/50 text-blue-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

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
      <div className="w-full max-w-md rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resolve Dispute #{disputeId}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {RESOLUTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Admin Note <span className="text-red-400">*</span></label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Explain the resolution…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter, page, search],
    queryFn: () => adminApi.getDisputes({ status: statusFilter || undefined, page, limit: 20, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution, adminNote }: { id: number; resolution: string; adminNote: string }) =>
      adminApi.resolveDispute(id, resolution, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
      setResolveId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to resolve dispute'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateDisputeStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update status'),
  });

  // FIX AD2: Assignment mutation
  const assignDispute = useMutation({
    mutationFn: ({ id, assignedToId }: { id: number; assignedToId: number | null }) =>
      adminApi.assignDispute(id, assignedToId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute assigned');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to assign'),
  });

  // FIX AD2: Priority mutation
  const setPriority = useMutation({
    mutationFn: ({ id, priority }: { id: number; priority: string }) =>
      adminApi.setDisputePriority(id, priority),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Priority updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to set priority'),
  });

  // FIX AD2: SLA deadline mutation
  const setSla = useMutation({
    mutationFn: ({ id, slaDeadline }: { id: number; slaDeadline: string | null }) =>
      adminApi.setDisputeSla(id, slaDeadline),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('SLA deadline updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to set SLA'),
  });

  // Fetch admin users for assignment dropdown
  const { data: adminUsers } = useQuery({
    queryKey: ['admin-users-for-assign'],
    queryFn: () => adminApi.getUsers({ limit: 100, role: 'admin' }),
    select: (d: any) => (d?.items ?? []).filter((u: any) => u.isAdmin),
  });

  const d = disputes;
  const items: any[] = d?.items ?? [];

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disputes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and resolve booking disputes</p>
      </div>

      {!isLoading && (d?.total ?? 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open (page)', value: items.filter((x) => x.status === 'open').length, color: 'text-red-400', bg: 'bg-red-900/20 border-red-900/40' },
            { label: 'Under Review (page)', value: items.filter((x) => x.status === 'under_review').length, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-900/40' },
            { label: 'Resolved (page)', value: items.filter((x) => x.status === 'resolved').length, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-900/40' },
            { label: 'Total', value: d?.total ?? items.length, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          className="relative ml-auto"
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search disputes…"
            className="w-56 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      <div className="space-y-3">
        {isLoading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
            ))
          : items.length === 0
          ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center py-16 gap-3">
              <Scale className="h-10 w-10 text-gray-600" />
              <p className="text-gray-500 text-sm">No disputes found</p>
            </div>
          )
          : items.map((d: any) => (
            <div key={d.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 flex flex-wrap items-start gap-4">
                {/* ID + category */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">#{d.id}</span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[d.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                      {d.status}
                    </span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[d.priority] ?? PRIORITY_COLORS.medium)}>
                      <Flag className="h-2.5 w-2.5 mr-1" />{d.priority ?? 'medium'}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 capitalize">{d.category}</span>
                    {d.assignedTo && (
                      <span className="text-xs bg-indigo-900/30 text-indigo-400 rounded-full px-2 py-0.5">
                        <UserPlus className="h-2.5 w-2.5 inline mr-1" />{d.assignedTo.firstName} {d.assignedTo.lastName}
                      </span>
                    )}
                    {d.slaDeadline && (
                      <span className={cn('text-xs rounded-full px-2 py-0.5', new Date(d.slaDeadline) < new Date() ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400')}>
                        SLA: {new Date(d.slaDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{d.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Raised by <span className="text-gray-600 dark:text-gray-300">{d.raisedBy?.firstName} {d.raisedBy?.lastName}</span>
                    {' '}· Booking #{d.bookingId}
                    {d.booking?.property && <span> · {d.booking.property.title}</span>}
                    {' '}· {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === d.id && (
                <div className="px-5 pb-4 border-t border-gray-200 dark:border-gray-800 pt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Description</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{d.description}</p>
                  </div>

                  {/* FIX AD2: Assignment, Priority, SLA controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assign To</label>
                      <select
                        value={d.assignedToId ?? ''}
                        onChange={(e) => assignDispute.mutate({ id: d.id, assignedToId: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                      >
                        <option value="">Unassigned</option>
                        {(adminUsers ?? []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                      <select
                        value={d.priority ?? 'medium'}
                        onChange={(e) => setPriority.mutate({ id: d.id, priority: e.target.value })}
                        className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SLA Deadline</label>
                      <input
                        type="date"
                        value={d.slaDeadline ? new Date(d.slaDeadline).toISOString().split('T')[0] : ''}
                        onChange={(e) => setSla.mutate({ id: d.id, slaDeadline: e.target.value || null })}
                        className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {d.resolution && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Resolution</p>
                      <p className="text-sm text-emerald-400 capitalize">{d.resolution.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {d.adminNote && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Admin Note</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{d.adminNote}</p>
                    </div>
                  )}
                  {d.resolvedAt && (
                    <p className="text-xs text-gray-500">Resolved at: {new Date(d.resolvedAt).toLocaleString()}</p>
                  )}
                  {(d.disputeEvidencePhotos?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Evidence Photos</p>
                      <div className="flex flex-wrap gap-2">
                        {d.disputeEvidencePhotos.map((url: string, i: number) => (
                          <a key={i} href={getUploadUrl(url)} target="_blank" rel="noreferrer" className="rounded overflow-hidden border border-gray-300 dark:border-gray-700 hover:border-indigo-500 transition-colors">
                            <img src={getUploadUrl(url)} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {(d?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{d?.total} total disputes</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => { setPage((p) => p - 1); setExpandedId(null); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
            <button disabled={page === d?.totalPages} onClick={() => { setPage((p) => p + 1); setExpandedId(null); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
