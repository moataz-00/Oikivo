'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight, CreditCard, CheckCircle, XCircle, Clock, Layers, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchNote, setBatchNote] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', page, statusFilter, search],
    queryFn: () => adminApi.getPayouts({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const processPayout = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: 'processing' | 'completed' | 'failed'; note?: string }) =>
      adminApi.processPayout(id, status, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
      setNoteInputs((prev) => { const n = { ...prev }; delete n[vars.id]; return n; });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to process payout'),
  });

  const batchProcess = useMutation({
    mutationFn: ({ ids, status, note }: { ids: number[]; status: 'processing' | 'completed' | 'failed'; note?: string }) =>
      adminApi.batchProcessPayouts(ids, status, note),
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] });
      setSelected(new Set());
      setBatchNote('');
      toast.success(`Processed ${result.processed ?? 0} payouts${result.failed ? `, ${result.failed} failed` : ''}`);
    },
    onError: () => toast.error('Batch processing failed'),
  });

  const d = data;
  const items: any[] = d?.items ?? [];
  const actionableItems = items.filter((p: any) => p.status !== 'completed' && p.status !== 'failed');
  const pendingTotal = items
    .filter((p: any) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === actionableItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(actionableItems.map((p: any) => p.id)));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage host payout requests</p>
      </div>

      {/* Search bar */}
      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by host name or email…"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72"
          />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Clear</button>
        )}
      </form>

      {pendingTotal > 0 && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-3 flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">EGP {pendingTotal.toLocaleString()}</span> pending / processing on this page
          </p>
        </div>
      )}

      {/* Batch Actions Bar */}
      {selected.size > 0 && (
        <div className="rounded-xl border border-indigo-800/40 bg-indigo-900/10 px-5 py-3 flex flex-wrap items-center gap-3">
          <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="text-sm text-indigo-300 font-medium">{selected.size} selected</span>
          <input
            value={batchNote}
            onChange={(e) => setBatchNote(e.target.value)}
            placeholder="Batch note (optional)…"
            className="rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
          />
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => batchProcess.mutate({ ids: [...selected], status: 'processing', note: batchNote || undefined })}
              disabled={batchProcess.isPending}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              <Clock className="h-3.5 w-3.5" /> Processing
            </button>
            <button
              onClick={() => batchProcess.mutate({ ids: [...selected], status: 'completed', note: batchNote || undefined })}
              disabled={batchProcess.isPending}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Complete
            </button>
            <button
              onClick={() => batchProcess.mutate({ ids: [...selected], status: 'failed', note: batchNote || undefined })}
              disabled={batchProcess.isPending}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Failed
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); setSelected(new Set()); }}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={actionableItems.length > 0 && selected.size === actionableItems.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Host</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Booking</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Note</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(10)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : items.map((p: any) => {
                    const actionable = p.status !== 'completed' && p.status !== 'failed';
                    return (
                    <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-3">
                        {actionable ? (
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                          />
                        ) : <div className="w-4" />}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">#{p.id}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-900 dark:text-white">{p.host?.firstName} {p.host?.lastName}</p>
                        <p className="text-xs text-gray-500">{p.host?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {p.bookingId ? (
                          <Link href={`/bookings/${p.bookingId}`} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            <ExternalLink className="h-3 w-3" />#{p.bookingId}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">EGP {Number(p.amount)?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{p.method ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[140px] truncate" title={p.accountDetails ?? ''}>
                        {p.accountDetails ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        {p.processedAt && <div className="text-gray-500">Processed: {new Date(p.processedAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        {actionable ? (
                          <input
                            value={noteInputs[p.id] ?? ''}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="Admin note…"
                            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">{p.note ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {actionable && (
                          <div className="flex items-center justify-end gap-1">
                            {p.status === 'pending' && (
                              <button
                                title="Mark processing"
                                onClick={() => processPayout.mutate({ id: p.id, status: 'processing', note: noteInputs[p.id] })}
                                disabled={processPayout.isPending && processPayout.variables?.id === p.id}
                                className="rounded-lg p-1.5 text-sky-400 hover:bg-sky-900/30 transition-colors disabled:opacity-50"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              title="Mark completed"
                              onClick={() => processPayout.mutate({ id: p.id, status: 'completed', note: noteInputs[p.id] })}
                              disabled={processPayout.isPending && processPayout.variables?.id === p.id}
                              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              title="Mark failed"
                              onClick={() => processPayout.mutate({ id: p.id, status: 'failed', note: noteInputs[p.id] })}
                              disabled={processPayout.isPending && processPayout.variables?.id === p.id}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No payout requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{d?.total} total payouts</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => { setPage((p) => p - 1); setNoteInputs({}); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => { setPage((p) => p + 1); setNoteInputs({}); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
