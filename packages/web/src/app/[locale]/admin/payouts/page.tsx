'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  processing: 'bg-blue-900/50 text-blue-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  failed: 'bg-red-900/50 text-red-400',
};

export default function AdminPayoutsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [processId, setProcessId] = useState<number | null>(null);
  const [processAction, setProcessAction] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [processNote, setProcessNote] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', page, statusFilter],
    queryFn: () => adminApi.getPayouts({ page, limit: 20, status: statusFilter || undefined }),
  });

  const process = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: 'processing' | 'completed' | 'failed'; note?: string }) =>
      adminApi.processPayout(id, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] });
      setProcessId(null);
      setProcessNote('');
    },
  });

  const d = data as any;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Payouts</h1>
        <p className="text-sm text-gray-400 mt-1">Process host payout requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Host</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Requested</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (d?.items ?? []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{p.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{p.host?.firstName} {p.host?.lastName}</p>
                        <p className="text-xs text-gray-500">{p.host?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        EGP {p.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{p.method ?? 'instapay'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-700 text-gray-400')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setProcessId(p.id); setProcessAction('processing'); }}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/60 transition-colors"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                Process
                              </button>
                              <button
                                onClick={() => { setProcessId(p.id); setProcessAction('completed'); }}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Complete
                              </button>
                            </>
                          )}
                          {p.status === 'processing' && (
                            <>
                              <button
                                onClick={() => { setProcessId(p.id); setProcessAction('completed'); }}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Complete
                              </button>
                              <button
                                onClick={() => { setProcessId(p.id); setProcessAction('failed'); }}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Fail
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {d?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{d?.total} total payouts</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Process modal */}
      {processId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {processAction === 'completed' ? 'Complete' : processAction === 'failed' ? 'Fail' : 'Process'} Payout #{processId}
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Note (optional)</label>
              <textarea
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Transaction reference or admin note…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setProcessId(null); setProcessNote(''); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={process.isPending}
                onClick={() => process.mutate({ id: processId, status: processAction, note: processNote || undefined })}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
                  processAction === 'failed' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700',
                )}
              >
                {process.isPending ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
