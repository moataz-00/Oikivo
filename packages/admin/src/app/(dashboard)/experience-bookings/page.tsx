'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Ticket, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'declined', label: 'Declined' },
];

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-gray-700 text-gray-300',
  submitted: 'bg-amber-900/50 text-amber-400',
  paid: 'bg-emerald-900/50 text-emerald-400',
  refunded: 'bg-blue-900/50 text-blue-400',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  confirmed: 'bg-blue-900/50 text-blue-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  cancelled: 'bg-red-900/50 text-red-400',
  declined: 'bg-gray-700 text-gray-400',
};

export default function ExperienceBookingsAdminPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exp-bookings', page, statusFilter, search],
    queryFn: () => adminApi.getExperienceBookings({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
  });

  const confirmPayment = useMutation({
    mutationFn: (id: number) => adminApi.confirmExpBookingPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-exp-bookings'] }),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const pageRevenue = useMemo(
    () => items
      .filter((b: any) => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum: number, b: any) => sum + Number(b.totalAmount ?? 0), 0),
    [items],
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Experience Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all experience bookings and confirm payments</p>
      </div>

      {pageRevenue > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-900/40 bg-emerald-900/20 px-4 py-3 text-sm">
          <span className="text-emerald-300">Confirmed + completed revenue on this page</span>
          <span className="font-semibold text-emerald-400">EGP {pageRevenue.toLocaleString('en-EG', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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

        <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search guest or experience…"
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['ID', 'Guest', 'Experience', 'Date', 'Guests', 'Total', 'Status', 'Payment', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-gray-800 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Ticket className="h-10 w-10 text-gray-600" />
                        <p className="text-gray-500">No experience bookings found</p>
                      </div>
                    </td>
                  </tr>
                )
                : items.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{b.guest?.firstName} {b.guest?.lastName}</p>
                      <p className="text-xs text-gray-400">{b.guest?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[180px]">{b.experience?.title}</p>
                      <p className="text-xs text-gray-400">Host: {b.host?.firstName} {b.host?.lastName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <p>{b.bookingDate}</p>
                      <p className="text-xs text-gray-500">{b.startTime}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{b.guestsCount}</td>
                    <td className="px-4 py-3 text-gray-300">
                      ${Number(b.totalAmount).toFixed(2)}
                      {b.paymentMethod && (
                        <p className="text-xs text-gray-500 capitalize">{b.paymentMethod}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-400')}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', PAYMENT_COLORS[b.paymentStatus] ?? 'bg-gray-700 text-gray-400')}>
                        {b.paymentStatus}
                      </span>
                      {b.paymentReference && (
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">Ref: {b.paymentReference}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.paymentStatus === 'submitted' && (
                        <button
                          onClick={() => confirmPayment.mutate(b.id)}
                          disabled={confirmPayment.isPending}
                          title="Confirm payment"
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Confirm
                        </button>
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
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} · {data?.total ?? 0} total
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition-colors"
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
