'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  FileDown,
  CalendarCheck,
  CreditCard,
  Users,
  Star,
  Loader2,
  CheckCircle2,
  Table,
  Scale,
  Filter,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type ExportConfig = {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  fetchFn: () => Promise<any>;
  columns: string[];
  rowFn: (item: any) => (string | number)[];
};

function toCsv(columns: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[,"\n\r]/.test(s) ? `"${s}"` : s;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map((r) => r.map(escape).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard', fromDate, toDate],
    queryFn: () => adminApi.getDashboard({ from: fromDate || undefined, to: toDate || undefined }),
  });
  const s = stats as any;

  const EXPORTS: ExportConfig[] = [
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarCheck,
      description: 'All booking records with guest info, dates, amounts, and status',
      color: 'from-amber-600 to-amber-700',
      fetchFn: async () => {
        const allItems: any[] = [];
        let page = 1;
        while (true) {
          const result = await adminApi.getBookings({ page, limit: 200, ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }) });
          const items = (result as any)?.items ?? (result as any)?.data ?? (Array.isArray(result) ? result : []);
          allItems.push(...items);
          if (items.length < 200 || page >= ((result as any)?.totalPages ?? page)) break;
          page++;
        }
        return allItems;
      },
      columns: ['ID', 'Guest', 'Property', 'Check-in', 'Check-out', 'Amount (EGP)', 'Status', 'Created'],
      rowFn: (b: any) => [
        b.id,
        `${b.guest?.firstName ?? ''} ${b.guest?.lastName ?? ''}`.trim(),
        b.property?.title ?? '',
        b.checkIn ?? '',
        b.checkOut ?? '',
        b.totalAmount ?? 0,
        b.status ?? '',
        b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
      ],
    },
    {
      id: 'payouts',
      label: 'Payouts',
      icon: CreditCard,
      description: 'Host payout records with status, amounts, and bank info',
      color: 'from-emerald-600 to-emerald-700',
      fetchFn: async () => {
        const allItems: any[] = [];
        let page = 1;
        while (true) {
          const result = await adminApi.getPayouts({ page, limit: 200 });
          const items = (result as any)?.items ?? (result as any)?.data ?? (Array.isArray(result) ? result : []);
          allItems.push(...items);
          if (items.length < 200 || page >= ((result as any)?.totalPages ?? page)) break;
          page++;
        }
        return allItems;
      },
      columns: ['ID', 'Host', 'Amount (EGP)', 'Status', 'Method', 'Created'],
      rowFn: (p: any) => [
        p.id,
        `${p.host?.firstName ?? ''} ${p.host?.lastName ?? ''}`.trim(),
        p.amount ?? 0,
        p.status ?? '',
        p.method ?? '',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
      ],
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      description: 'All registered user accounts with roles and verification status',
      color: 'from-indigo-600 to-indigo-700',
      fetchFn: async () => {
        const allItems: any[] = [];
        let page = 1;
        while (true) {
          const result = await adminApi.getUsers({ page, limit: 200 });
          const items = result?.items ?? result?.data ?? (Array.isArray(result) ? result : []);
          allItems.push(...items);
          if (items.length < 200 || page >= (result?.totalPages ?? page)) break;
          page++;
        }
        return allItems;
      },
      columns: ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Active', 'ID Verified', 'Joined'],
      rowFn: (u: any) => [
        u.id,
        u.firstName ?? '',
        u.lastName ?? '',
        u.email ?? '',
        u.isAdmin ? 'admin' : (u.role ?? 'user'),
        u.isActive ? 'Yes' : 'No',
        u.isIdVerified ? 'Yes' : 'No',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      ],
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      description: 'All guest reviews with ratings, text, and moderation status',
      color: 'from-violet-600 to-violet-700',
      fetchFn: async () => {
        const allItems: any[] = [];
        let page = 1;
        while (true) {
          const result = await adminApi.getReviews({ page, limit: 200 });
          const items = result?.items ?? result?.data ?? (Array.isArray(result) ? result : []);
          allItems.push(...items);
          if (items.length < 200 || page >= (result?.totalPages ?? page)) break;
          page++;
        }
        return allItems;
      },
      columns: ['ID', 'Reviewer', 'Property', 'Rating', 'Comment', 'Flagged', 'Created'],
      rowFn: (r: any) => [
        r.id,
        `${r.guest?.firstName ?? ''} ${r.guest?.lastName ?? ''}`.trim(),
        r.property?.title ?? r.booking?.property?.title ?? '',
        r.overallRating ?? r.rating ?? '',
        r.comment ?? '',
        r.isFlagged ? 'Yes' : 'No',
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
      ],
    },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: Scale,
      description: 'All dispute records with status, type, and resolution details',
      color: 'from-rose-600 to-rose-700',
      fetchFn: async () => {
        const result = await adminApi.getExportData('disputes');
        const items = result?.data ?? result ?? [];
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('No dispute data returned');
        }
        return items;
      },
      columns: ['ID', 'Booking', 'Filed By', 'Against', 'Type', 'Status', 'Amount (EGP)', 'Created'],
      rowFn: (d: any) => [
        d.id,
        d.bookingId ?? '',
        `${d.filedBy?.firstName ?? ''} ${d.filedBy?.lastName ?? ''}`.trim(),
        `${d.against?.firstName ?? ''} ${d.against?.lastName ?? ''}`.trim(),
        d.type ?? d.reason ?? '',
        d.status ?? '',
        d.amount ?? 0,
        d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
      ],
    },
  ];

  async function handleExport(config: ExportConfig) {
    setLoadingId(config.id);
    try {
      const data = await config.fetchFn();
      const items = Array.isArray(data) ? data : [];
      if (items.length === 0) {
        toast('No data to export for this report', { icon: 'ℹ️' });
        return;
      }
      const rows = items.map(config.rowFn);
      const csv = toCsv(config.columns, rows);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadCsv(`oikivo-${config.id}-${dateStr}.csv`, csv);
      toast.success(`Exported ${items.length} ${config.label.toLowerCase()} records`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `Failed to export ${config.label}`);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Export</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Download platform data as CSV for analysis or finance reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-600">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Clear date filter"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: (s?.users?.total ?? 0) + (s?.bookings?.total ?? 0), sub: 'Users + Bookings' },
          { label: 'Total Revenue', value: `EGP ${(s?.revenue?.total ?? 0).toLocaleString()}`, sub: 'All-time platform' },
          { label: 'Total Bookings', value: s?.bookings?.total ?? 0, sub: 'All statuses' },
          { label: 'Total Users', value: s?.users?.total ?? 0, sub: 'Registered accounts' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Export Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {EXPORTS.map((config) => (
          <div
            key={config.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br', config.color)}>
                  <config.icon className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{config.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                </div>
              </div>
            </div>

            {/* Column preview */}
            <div className="rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-700/50 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Table className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Columns</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {config.columns.map((col) => (
                  <span key={col} className="rounded px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleExport(config)}
              disabled={loadingId !== null}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white transition-all',
                `bg-gradient-to-br ${config.color} hover:brightness-110`,
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {loadingId === config.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Client-side CSV generation</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All exports are generated directly in your browser from the existing admin API endpoints.
              No additional backend work is needed. Data is fetched with your current admin token and formatted into a CSV file for download.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
