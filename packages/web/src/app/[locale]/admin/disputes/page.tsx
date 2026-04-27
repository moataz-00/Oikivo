'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-900/50 text-amber-400',
  under_review: 'bg-blue-900/50 text-blue-400',
  resolved: 'bg-emerald-900/50 text-emerald-400',
  closed: 'bg-gray-700 text-gray-400',
};

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');
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
      setResolution('');
      setAdminNote('');
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateDisputeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-disputes'] }),
  });

  const items = (disputes as any[]) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Disputes</h1>
        <p className="text-sm text-gray-400 mt-1">Manage guest-filed disputes</p>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Filed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{d.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white line-clamp-1">{d.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{d.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{d.category}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {d.guest?.firstName} {d.guest?.lastName}
                        <p className="text-xs text-gray-500">{d.guest?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white line-clamp-1">{d.booking?.property?.title ?? `Booking #${d.bookingId}`}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[d.status] ?? 'bg-gray-700 text-gray-400')}>
                          {d.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {d.status === 'open' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: d.id, status: 'under_review' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/60 transition-colors disabled:opacity-50"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Review
                            </button>
                          )}
                          {(d.status === 'open' || d.status === 'under_review') && (
                            <button
                              onClick={() => setResolveId(d.id)}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Resolve
                            </button>
                          )}
                          {d.status !== 'closed' && d.status !== 'resolved' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: d.id, status: 'closed' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve modal */}
      {resolveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Resolve Dispute #{resolveId}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select resolution…</option>
                <option value="refund_full">Full Refund</option>
                <option value="refund_partial">Partial Refund</option>
                <option value="no_action">No Action Required</option>
                <option value="warning_issued">Warning Issued to Host</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Admin Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Internal note about the resolution…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setResolveId(null); setResolution(''); setAdminNote(''); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!resolution || resolve.isPending}
                onClick={() => resolve.mutate({ id: resolveId, resolution, adminNote })}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {resolve.isPending ? 'Saving…' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
