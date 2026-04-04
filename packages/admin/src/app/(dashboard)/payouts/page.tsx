'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
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
  processing: 'bg-sky-900/50 text-sky-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  failed: 'bg-red-900/50 text-red-400',
};

export default function PayoutsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', page, statusFilter],
    queryFn: () => adminApi.getPayouts({ page, limit: 20, status: statusFilter || undefined }),
  });

  const processPayout = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: 'processing' | 'completed' | 'failed'; note?: string }) =>
      adminApi.processPayout(id, status, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] });
      setNoteInputs((prev) => { const n = { ...prev }; delete n[vars.id]; return n; });
    },
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];
  const pendingTotal = items
    .filter((p: any) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Payouts</h1>
        <p className="text-sm text-gray-400 mt-1">Manage host payout requests</p>
      </div>

      {pendingTotal > 0 && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-3 flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">EGP {pendingTotal.toLocaleString()}</span> pending / processing on this page
          </p>
        </div>
      )}

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Note</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : (d?.items ?? []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{p.id}</td>
                      <td className="px-4 py-3 text-gray-300">
                        <p className="font-medium text-white">{p.host?.firstName} {p.host?.lastName}</p>
                        <p className="text-xs text-gray-500">{p.host?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">EGP {Number(p.amount)?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-300 capitalize">{p.method ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-700 text-gray-400')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        {p.processedAt && <div className="text-gray-500">Processed: {new Date(p.processedAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        {p.status !== 'completed' && p.status !== 'failed' ? (
                          <input
                            value={noteInputs[p.id] ?? ''}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="Admin note…"
                            className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">{p.note ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.status !== 'completed' && p.status !== 'failed' && (
                          <div className="flex items-center justify-end gap-1">
                            {p.status === 'pending' && (
                              <button
                                title="Mark processing"
                                onClick={() => processPayout.mutate({ id: p.id, status: 'processing', note: noteInputs[p.id] })}
                                disabled={processPayout.isPending}
                                className="rounded-lg p-1.5 text-sky-400 hover:bg-sky-900/30 transition-colors disabled:opacity-50"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              title="Mark completed"
                              onClick={() => processPayout.mutate({ id: p.id, status: 'completed', note: noteInputs[p.id] })}
                              disabled={processPayout.isPending}
                              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              title="Mark failed"
                              onClick={() => processPayout.mutate({ id: p.id, status: 'failed', note: noteInputs[p.id] })}
                              disabled={processPayout.isPending}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              {!isLoading && (d?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No payout requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {d?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{d?.total} total payouts</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
