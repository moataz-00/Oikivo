'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Receipt, ChevronLeft, ChevronRight, Search, Calendar, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const METHOD_LABELS: Record<string, string> = {
  'opay-card': 'OPay Card',
  card: 'Card',
  stripe: 'Stripe',
  instapay: 'InstaPay',
  cash: 'Cash',
};

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-900/50 text-emerald-400',
  pending: 'bg-amber-900/50 text-amber-400',
  unpaid: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  refunded: 'bg-red-900/50 text-red-400',
  partially_refunded: 'bg-orange-900/50 text-orange-400',
  failed: 'bg-red-900/50 text-red-400',
};

const METHOD_FILTERS = [
  { value: '', label: 'All Methods' },
  { value: 'opay-card', label: 'OPay Card' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'instapay', label: 'InstaPay' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

export default function PaymentTransactionsPage() {
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', page, method, status, fromDate, toDate, search],
    queryFn: () =>
      adminApi.getPaymentTransactions({
        page,
        limit: 25,
        method: method || undefined,
        status: status || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: search || undefined,
      }),
    placeholderData: (prev: any) => prev,
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];

  function exportCsv() {
    if (!items.length) return;
    const headers = ['ID', 'Type', 'Guest', 'Host', 'Property', 'Amount', 'Service Fee', 'Method', 'Payment Status', 'Reference', 'Date'];
    const rows = items.map((t: any) => [
      t.id, t.type, t.guestName ?? '', t.hostName ?? '', t.propertyTitle ?? '',
      t.totalAmount, t.serviceFee, t.paymentMethod, t.paymentStatus,
      t.paymentReference ?? t.opayOrderReference ?? t.stripePaymentIntentId ?? '',
      t.createdAt ? new Date(t.createdAt).toISOString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-page${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All payment transactions across OPay, Stripe, InstaPay, and cash</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!items.length}
          className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {METHOD_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white" />
          <span className="text-gray-500 text-xs">to</span>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white" />
        </div>
        <form className="relative ml-auto" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by reference…"
            className="w-56 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Host</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Fee</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10} className="px-4 py-4"><div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" /></td>
                    </tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Receipt className="h-10 w-10 text-gray-600" />
                          <p className="text-gray-500">No transactions found</p>
                        </div>
                      </td>
                    </tr>
                  )
                : items.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{t.id}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white text-xs">{t.guestName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white text-xs">{t.hostName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs max-w-[160px] truncate">{t.propertyTitle ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white text-xs">EGP {Number(t.totalAmount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">EGP {Number(t.serviceFee).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[t.paymentStatus] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500')}>
                          {t.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate">
                        {t.paymentReference ?? t.opayOrderReference ?? t.stripePaymentIntentId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{d?.total} total transactions</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
