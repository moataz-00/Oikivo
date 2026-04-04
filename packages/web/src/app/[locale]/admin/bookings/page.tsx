'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  confirmed: 'bg-sky-900/50 text-sky-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-700 text-gray-400',
  submitted: 'bg-amber-900/50 text-amber-400',
  paid: 'bg-emerald-900/50 text-emerald-400',
  refunded: 'bg-blue-900/50 text-blue-400',
};

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter, search],
    queryFn: () => adminApi.getBookings({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
  });

  const confirmPayment = useMutation({
    mutationFn: (id: number) => adminApi.confirmPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const d = data as any;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">All platform reservations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search guest, property…"
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Search
          </button>
        </form>
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
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (d?.items ?? []).map((b: any) => (
                    <tr key={b.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{b.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white line-clamp-1">{b.property?.title ?? '—'}</p>
                        <p className="text-xs text-gray-400">{b.property?.city}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {b.guest?.firstName} {b.guest?.lastName}
                        <p className="text-xs text-gray-500">{b.guest?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {b.checkIn} → {b.checkOut}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        EGP {b.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', BOOKING_STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-400')}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PAYMENT_STATUS_COLORS[b.paymentStatus] ?? 'bg-gray-700 text-gray-400')}>
                          {b.paymentStatus ?? 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {b.paymentStatus !== 'paid' && (
                            <button
                              title="Confirm payment"
                              onClick={() => confirmPayment.mutate(b.id)}
                              disabled={confirmPayment.isPending}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Confirm Pay
                            </button>
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
            <span>{d?.total} total bookings</span>
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
    </div>
  );
}
