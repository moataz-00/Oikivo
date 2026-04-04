'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-900/40 text-amber-300 border-amber-700',
  processing: 'bg-blue-900/40 text-blue-300 border-blue-700',
  completed:  'bg-green-900/40 text-green-300 border-green-700',
  failed:     'bg-red-900/40 text-red-300 border-red-700',
};

export default function AdminConsultantPayoutsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionForm, setActionForm] = useState<{ status: 'processing' | 'completed' | 'failed'; note: string }>({
    status: 'completed',
    note: '',
  });

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-consultant-payouts', page, statusFilter],
    queryFn: () =>
      adminApi.getConsultantPayouts({
        page,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status: 'processing' | 'completed' | 'failed'; note?: string }) =>
      adminApi.processConsultantPayout(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-consultant-payouts'] });
      setProcessingId(null);
    },
  });

  const d = data as any;
  const total = d?.total ?? 0;
  const totalPages = d?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Consultant Payouts</h1>
        <p className="text-sm text-gray-400 mt-1">
          Review and process consultant payout requests
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition capitalize',
              statusFilter === s
                ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600',
            )}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{total} total</span>
      </div>

      {/* Process modal */}
      {processingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setProcessingId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-bold text-white">Process Payout #{processingId}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">New Status</label>
                <select
                  value={actionForm.status}
                  onChange={(e) => setActionForm((f) => ({ ...f, status: e.target.value as any }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Note (optional)</label>
                <textarea
                  rows={2}
                  value={actionForm.note}
                  onChange={(e) => setActionForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Transaction ref, reason for failure, etc."
                  className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
            {processMutation.isError && (
              <p className="mt-2 text-xs text-red-400">Something went wrong, please try again.</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setProcessingId(null)}
                className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                disabled={processMutation.isPending}
                onClick={() =>
                  processMutation.mutate({
                    id: processingId,
                    status: actionForm.status,
                    ...(actionForm.note.trim() ? { note: actionForm.note.trim() } : {}),
                  })
                }
                className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50 transition"
              >
                {processMutation.isPending ? '…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Note</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(10)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (d?.items ?? []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">#{r.id}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {r.consultant?.displayName ?? r.consultant?.user?.firstName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {r.consultant?.user?.email ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {r.currency} {Number(r.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 capitalize">
                        {r.method === 'instapay' ? 'InstaPay' : 'Bank Transfer'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate" title={r.accountDetails}>
                        {r.accountDetails ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                            STATUS_BADGE[r.status] ?? STATUS_BADGE.pending,
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate" title={r.note}>
                        {r.note ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status !== 'completed' && r.status !== 'failed' ? (
                          <button
                            onClick={() => {
                              setProcessingId(r.id);
                              setActionForm({ status: 'completed', note: '' });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
                          >
                            <Wallet className="h-3 w-3" />
                            Process
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:bg-gray-800 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:bg-gray-800 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
