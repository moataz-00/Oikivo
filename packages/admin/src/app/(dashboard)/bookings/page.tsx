'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, ExternalLink, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const BOOKING_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  confirmed: 'bg-sky-900/50 text-sky-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  submitted: 'bg-amber-900/50 text-amber-300',
  paid: 'bg-emerald-900/50 text-emerald-400',
  refunded: 'bg-blue-900/50 text-blue-400',
  declined: 'bg-red-900/50 text-red-400',
};

export default function BookingsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter, search],
    queryFn: () => adminApi.getBookings({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const confirmPayment = useMutation({
    mutationFn: (id: number) => adminApi.confirmPayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to confirm payment'),
  });

  const declinePayment = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminApi.declinePayment(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
      setDeclineId(null);
      setDeclineReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to decline payment'),
  });

  const d = data;

  if (isError) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load bookings</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">The backend may be unavailable. Try refreshing the page.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All platform reservations</p>
      </div>

      {/* Decline reason modal */}
      {declineId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Decline InstaPay Payment</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">The guest will be notified by email and in-app notification and asked to retry payment.</p>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Reason (optional)</label>
              <input
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Reference not found, amount mismatch…"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => { setDeclineId(null); setDeclineReason(''); }} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => declinePayment.mutate({ id: declineId, reason: declineReason || undefined })}
                disabled={declinePayment.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {declinePayment.isPending ? 'Declining…' : 'Decline Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search guest, property…"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Search</button>
        </form>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : (d?.items ?? []).map((b: any) => (
                    <tr key={b.id} className={cn('hover:bg-gray-800/50 transition-colors', b.paymentStatus === 'submitted' && 'bg-amber-950/20')}>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">#{b.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{b.property?.title ?? '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{b.property?.city}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {b.guest?.firstName} {b.guest?.lastName}
                        <p className="text-xs text-gray-500">{b.guest?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{b.checkIn} → {b.checkOut}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {b.checkIn && b.checkOut
                          ? `${Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000))}n`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">EGP {b.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', BOOKING_COLORS[b.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', PAYMENT_COLORS[b.paymentStatus ?? 'pending'])}>
                            {b.paymentStatus === 'submitted' && <Clock className="h-3 w-3" />}
                            {b.paymentStatus ?? 'pending'}
                          </span>
                          {b.paymentStatus === 'submitted' && b.paymentReference && (
                            <p className="text-xs text-amber-400 font-mono">Ref: {b.paymentReference}</p>
                          )}
                          {b.paymentStatus === 'submitted' && b.paymentProofUrl && (
                            <a href={getUploadUrl(b.paymentProofUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-300">
                              <ExternalLink className="h-3 w-3" /> View proof
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">                            <button
                              onClick={() => router.push(`/bookings/${b.bookingUuid}`)}
                              title="View detail"
                              className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-900/30 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>                          {b.paymentStatus === 'submitted' && (
                            <>
                              <button
                                onClick={() => confirmPayment.mutate(b.id)}
                                disabled={confirmPayment.isPending && confirmPayment.variables === b.id}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Confirm
                              </button>
                              <button
                                onClick={() => { setDeclineId(b.id); setDeclineReason(''); }}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Decline
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
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{d?.total} total bookings</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

