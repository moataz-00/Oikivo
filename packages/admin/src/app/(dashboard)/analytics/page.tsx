'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  TrendingUp,
  Users,
  Building2,
  CalendarCheck,
  DollarSign,
  BarChart3,
  Star,
  XCircle,
  GraduationCap,
  Wallet,
  Receipt,
  PiggyBank,
  Plus,
  Trash2,
  Pencil,
  ArrowDownRight,
  CreditCard,
  Filter,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function egp(n: number, currency = 'EGP'): string {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function methodLabel(m: string): string {
  const map: Record<string, string> = {
    'opay-card': 'OPay (Card)',
    card: 'OPay (Card)',
    instapay: 'InstaPay',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    stripe: 'Stripe',
    wallet: 'Wallet',
    unknown: 'Unknown',
  };
  return map[m] ?? m.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Reusable Components ─────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', gradient)}>
          <Icon className="h-5 w-5 text-gray-900 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

function BookingStatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const p = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{count.toLocaleString()} <span className="text-gray-600">({p}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function RevenueSparkline({ data }: { data: { month: string; revenue: number; bookings: number }[] }) {
  if (!data?.length) return <p className="text-gray-500 text-sm mt-4">No data yet.</p>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0);
  const avgMonthly = Math.round(totalRevenue / data.length);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">EGP {(totalRevenue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-500">Total (12mo)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">EGP {(avgMonthly / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-500">Monthly Avg</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totalBookings}</p>
          <p className="text-xs text-gray-500">Bookings (12mo)</p>
        </div>
      </div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const heightPct = Math.max((d.revenue / max) * 100, 4);
          const isLast = i === data.length - 1;
          return (
            <div key={d.month} className="group flex-1 flex flex-col items-center justify-end h-full gap-1">
              <div className="relative w-full" style={{ height: `${heightPct}%` }}>
                <div
                  className={cn(
                    'w-full h-full rounded-t-sm transition-colors cursor-default',
                    isLast
                      ? 'bg-gradient-to-t from-indigo-700 to-indigo-400'
                      : 'bg-gradient-to-t from-violet-800 to-violet-600 hover:from-violet-700 hover:to-violet-400',
                  )}
                />
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 whitespace-nowrap rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white shadow-xl">
                  <span className="font-semibold text-violet-300">EGP {d.revenue.toLocaleString()}</span>
                  <span className="text-gray-500 dark:text-gray-400">{d.bookings} bookings</span>
                </div>
              </div>
              <span className={cn('text-[10px]', isLast ? 'text-indigo-400 font-semibold' : 'text-gray-600')}>
                {d.month.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass, bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-2', bold ? 'font-medium' : '')}>
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={valueClass ?? 'text-gray-900 dark:text-white'}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color, sub }: { icon: React.ElementType; title: string; color: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', color)}>
        <Icon className="h-4 w-4 text-gray-900 dark:text-white" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Payment Method Breakdown ─────────────────────────────────────────────── */

function PaymentMethodBreakdown({
  title,
  data,
  totalColor,
}: {
  title: string;
  data: Record<string, { count: number; revenue: number; gatewayFee: number }> | undefined;
  totalColor: string;
}) {
  if (!data || Object.keys(data).length === 0) return null;

  const entries = Object.entries(data).sort((a, b) => b[1].revenue - a[1].revenue);
  const totalGateway = entries.reduce((s, [, v]) => s + v.gatewayFee, 0);
  const totalCount = entries.reduce((s, [, v]) => s + v.count, 0);

  return (
    <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-3">
      <p className={cn('text-xs font-semibold uppercase tracking-wide', totalColor)}>{title}</p>
      <div className="text-sm space-y-3">
        {entries.map(([method, v]) => (
          <div key={method} className="rounded-lg bg-white/60 dark:bg-gray-900/60 border border-gray-700/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5">
                {method === 'opay-card' || method === 'card' ? (
                  <CreditCard className="h-3.5 w-3.5 text-sky-400" />
                ) : method === 'instapay' ? (
                  <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <DollarSign className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                )}
                {methodLabel(method)}
              </span>
              <span className="text-xs text-gray-500">{v.count} transactions</span>
            </div>
            <Row label="Revenue" value={egp(v.revenue)} />
            <Row
              label={
                method === 'opay-card' || method === 'card'
                  ? 'OPay fee (2.25% + 2 EGP each)'
                  : method === 'instapay'
                    ? 'Pay-in fee'
                    : 'Gateway fee'
              }
              value={v.gatewayFee > 0 ? `−${egp(v.gatewayFee)}` : 'Free'}
              valueClass={v.gatewayFee > 0 ? 'text-amber-400' : 'text-emerald-400'}
            />
            <Row label="Net after gateway" value={egp(v.revenue - v.gatewayFee)} valueClass="text-emerald-400" bold />
          </div>
        ))}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-2 space-y-1">
          <Row label={`Total (${totalCount} transactions)`} value={egp(entries.reduce((s, [, v]) => s + v.revenue, 0))} bold />
          <Row label="Total gateway fees" value={`−${egp(totalGateway)}`} valueClass="text-amber-400" />
        </div>
      </div>
    </div>
  );
}

/* ─── Expenses Section ─────────────────────────────────────────────────────── */

function ExpensesSection() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: '', date: new Date().toISOString().slice(0, 10) });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', category: '', date: '' });

  const { data: expenses } = useQuery({
    queryKey: ['admin-expenses'],
    queryFn: () => adminApi.getExpenses({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) throw new Error('Amount must be greater than zero');
      return adminApi.createExpense({ ...form, amount });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-expenses'] });
      qc.invalidateQueries({ queryKey: ['admin-financial'] });
      setForm({ description: '', amount: '', category: '', date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      toast.success('Expense added');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to add expense'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { description?: string; amount?: number; category?: string; date?: string } }) =>
      adminApi.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-expenses'] });
      qc.invalidateQueries({ queryKey: ['admin-financial'] });
      setEditId(null);
      toast.success('Expense updated');
    },
    onError: () => toast.error('Failed to update expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-expenses'] });
      qc.invalidateQueries({ queryKey: ['admin-financial'] });
      toast.success('Expense deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete expense'),
  });

  const startEdit = (e: { id: number; description: string; amount: number | string; category?: string; date: string }) => {
    setEditId(e.id);
    setEditForm({ description: e.description, amount: String(e.amount), category: e.category ?? '', date: e.date });
    setShowForm(false);
  };

  const saveEdit = () => {
    if (!editId) return;
    updateMutation.mutate({ id: editId, data: { description: editForm.description, amount: parseFloat(editForm.amount) || 0, category: editForm.category || undefined, date: editForm.date } });
  };

  const items = (expenses as any)?.items ?? [];
  const totalExpenses = items.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader icon={Receipt} title="Expenses" color="bg-red-700" sub={items.length > 0 ? `Total: ${egp(totalExpenses)}` : undefined} />
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Expense
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-800/60 p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Amount (EGP)"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Category (optional)"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.description || !form.amount || createMutation.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Save Expense
          </button>
        </div>
      )}

      {/* Inline edit form */}
      {editId !== null && (
        <div className="rounded-lg border border-indigo-700/50 bg-indigo-900/20 p-4 space-y-3">
          <p className="text-xs font-medium text-indigo-300">Editing expense</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Description"
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Amount (EGP)"
              value={editForm.amount}
              onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Category"
              value={editForm.category}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={!editForm.description || !editForm.amount || updateMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditId(null)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((e: any) => (
                <tr key={e.id} className={cn('border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/30', editId === e.id && 'bg-indigo-900/10')}>
                  <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{e.date}</td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{e.description}</td>
                  <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{e.category || '—'}</td>
                  <td className="py-2 pr-4 text-right text-red-400 font-medium">{egp(parseFloat(e.amount))}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => editId === e.id ? setEditId(null) : startEdit(e)}
                        className="text-gray-600 hover:text-indigo-400 transition-colors"
                        title="Edit expense"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(e.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No expenses recorded yet.</p>
      )}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard', fromDate, toDate],
    queryFn: () => adminApi.getDashboard({ from: fromDate || undefined, to: toDate || undefined }),
  });

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(),
  });

  const { data: financial, isError: financialError } = useQuery({
    queryKey: ['admin-financial', fromDate, toDate],
    queryFn: () => adminApi.getFinancialAnalytics({ from: fromDate || undefined, to: toDate || undefined }),
  });

  const { data: enhanced } = useQuery({
    queryKey: ['admin-enhanced', fromDate, toDate],
    queryFn: () => adminApi.getEnhancedAnalytics({ from: fromDate || undefined, to: toDate || undefined }),
  });
  const enh = enhanced as any;

  if (isLoading || chartLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded-lg w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const s = stats as any;
  const f = financial as any;
  const chartData = (chart ?? []) as { month: string; revenue: number; bookings: number }[];

  const totalBookings = s?.bookings?.total ?? 0;
  const conversionRate = (s?.users?.total ?? 0) > 0 ? ((totalBookings / s.users.total) * 100).toFixed(1) : '0.0';
  const cancellationRate =
    totalBookings > 0 ? (((s?.bookings?.cancelled ?? 0) / totalBookings) * 100).toFixed(1) : '0.0';
  const completionRate =
    totalBookings > 0 ? (((s?.bookings?.completed ?? 0) / totalBookings) * 100).toFixed(1) : '0.0';
  const avgBookingValue = totalBookings > 0 ? Math.round((s?.revenue?.total ?? 0) / totalBookings) : 0;

  return (
    <div className="space-y-8">
      {/* Header + Date Filter */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform performance, financials & profit tracking</p>
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
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Clear filter"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ PROFIT OVERVIEW ═══════════════════════════════════════════════════ */}
      {financialError && (
        <div className="rounded-xl border border-red-900/40 bg-red-900/20 px-4 py-4 flex items-center gap-3 text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">Failed to load financial analytics. The backend may be unavailable.</p>
        </div>
      )}
      {f && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <SectionHeader icon={PiggyBank} title="Profit Overview" color="bg-emerald-700" sub="All fees, costs, and net profit" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Platform Fees" value={egp(f.profit?.totalPlatformFees ?? 0)} sub="Guest + consultant commissions" icon={Wallet} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" />
            <MetricCard label="Gateway Costs" value={egp(f.profit?.totalGatewayCosts ?? 0)} sub="OPay: 2.25% + 2 EGP per txn" icon={CreditCard} gradient="bg-gradient-to-br from-orange-600 to-orange-700" />
            <MetricCard label="Payout Costs" value={egp(f.profit?.totalPayoutCosts ?? 0)} sub="InstaPay: 0.1% (min 0.50, max 20)" icon={ArrowDownRight} gradient="bg-gradient-to-br from-amber-600 to-amber-700" />
            <MetricCard label="Expenses" value={egp(f.profit?.totalExpenses ?? 0)} sub="Manual expense entries" icon={Receipt} gradient="bg-gradient-to-br from-red-600 to-red-700" />
            <MetricCard
              label="Net Profit"
              value={egp(f.profit?.netProfit ?? 0)}
              sub="Fees − Gateway − Payouts − Expenses"
              icon={TrendingUp}
              gradient={
                (f.profit?.netProfit ?? 0) >= 0
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                  : 'bg-gradient-to-br from-red-600 to-red-700'
              }
            />
          </div>

          {/* Profit formula */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Profit Calculation</p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
              <span className="text-emerald-400">{egp(f.profit?.totalPlatformFees ?? 0)}</span>
              <span className="text-gray-500">−</span>
              <span className="text-amber-400">{egp(f.profit?.totalGatewayCosts ?? 0)}</span>
              <span className="text-gray-500">−</span>
              <span className="text-amber-400">{egp(f.profit?.totalPayoutCosts ?? 0)}</span>
              <span className="text-gray-500">−</span>
              <span className="text-red-400">{egp(f.profit?.totalExpenses ?? 0)}</span>
              <span className="text-gray-500">=</span>
              <span className={cn('font-bold', (f.profit?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {egp(f.profit?.netProfit ?? 0)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Platform Fees − Gateway Costs (OPay) − Payout Costs (InstaPay) − Expenses = Net Profit</p>
          </div>
        </div>
      )}

      {/* ═══ HOST SECTION — PROPERTY ANALYTICS ═════════════════════════════════ */}
      {f && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
          <SectionHeader icon={Building2} title="Host Section — Property Analytics" color="bg-sky-700" sub="Property booking revenue, fees & payouts" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Hosts" value={f.hosts?.totalHosts ?? 0} sub="Active host accounts" icon={Users} gradient="bg-gradient-to-br from-sky-600 to-sky-700" />
            <MetricCard label="Properties" value={f.hosts?.totalProperties ?? 0} sub="Listed properties" icon={Building2} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
            <MetricCard label="Paid Bookings" value={f.property?.paidBookings ?? 0} sub={`of ${f.property?.totalBookings ?? 0} total`} icon={CalendarCheck} gradient="bg-gradient-to-br from-violet-600 to-violet-700" />
            <MetricCard label="Gross Revenue" value={egp(f.property?.grossRevenue ?? 0)} sub="Total paid booking value" icon={DollarSign} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" />
          </div>

          {/* Revenue detail + Payment Method Breakdown */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-3">
              <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide">Revenue Breakdown</p>
              <div className="text-sm space-y-1.5">
                <Row label="Gross revenue (all paid bookings)" value={egp(f.property?.grossRevenue ?? 0)} />
                <Row label="Platform fee earned (guest service fee)" value={egp(f.property?.platformFees ?? 0)} valueClass="text-emerald-400" />
                <Row label="Host commission (0% default)" value={egp(0)} valueClass="text-gray-500" />
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 space-y-1.5">
                  <Row label="OPay gateway fees" value={`−${egp(f.property?.gatewayFees ?? 0)}`} valueClass="text-amber-400" />
                  <Row label="Refunds issued" value={egp(f.property?.refunds ?? 0)} valueClass="text-red-400" />
                  <Row label="Refunded bookings" value={`${f.property?.refundedBookings ?? 0}`} valueClass="text-red-400" />
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                  <Row label="Net property profit" value={egp((f.property?.platformFees ?? 0) - (f.property?.gatewayFees ?? 0))} valueClass="text-emerald-400" bold />
                </div>
              </div>
            </div>

            <PaymentMethodBreakdown title="Property — Payment Methods" data={f.property?.byPaymentMethod} totalColor="text-sky-400" />
          </div>

          {/* Payout details for hosts */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Host Payouts</p>
            <div className="text-sm space-y-1.5">
              <Row label="Total host payouts" value={egp(f.payouts?.hostPayouts ?? 0)} />
              <Row label="InstaPay payout fees (0.1%, min 0.50, max 20 EGP)" value={`−${egp(f.payouts?.hostPayoutFees ?? 0)}`} valueClass="text-amber-400" />
              <Row label="Net paid to hosts" value={egp((f.payouts?.hostPayouts ?? 0) - (f.payouts?.hostPayoutFees ?? 0))} valueClass="text-emerald-400" bold />
            </div>
          </div>

          {/* Top Hosts */}
          {(f.hosts?.topHosts?.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Hosts by Revenue</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                    <th className="py-2 pr-4">Host</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4 text-right">Properties</th>
                    <th className="py-2 pr-4 text-right">Bookings</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {f.hosts.topHosts.map((h: any) => (
                    <tr key={h.id} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{h.name}</td>
                      <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{h.email}</td>
                      <td className="py-2 pr-4 text-right text-gray-500 dark:text-gray-400">{h.properties}</td>
                      <td className="py-2 pr-4 text-right text-gray-500 dark:text-gray-400">{h.bookings}</td>
                      <td className="py-2 text-right text-emerald-400 font-medium">{egp(h.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ CONSULTANT SECTION ═══════════════════════════════════════════════ */}
      {f && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
          <SectionHeader icon={GraduationCap} title="Consultant Section — Consultation Analytics" color="bg-violet-700" sub="Consultation booking revenue, fees & payouts" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Consultants" value={f.consultants?.totalConsultants ?? 0} sub="Active accounts" icon={GraduationCap} gradient="bg-gradient-to-br from-violet-600 to-violet-700" />
            <MetricCard label="Paid Consultations" value={f.consultation?.paidBookings ?? 0} sub={`of ${f.consultation?.totalBookings ?? 0} total`} icon={CalendarCheck} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
            <MetricCard label="Gross Revenue" value={egp(f.consultation?.grossRevenue ?? 0)} sub="Total consultation value" icon={DollarSign} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" />
            <MetricCard label="Platform Fees" value={egp(f.consultation?.platformFees ?? 0)} sub="10% from consultant" icon={Wallet} gradient="bg-gradient-to-br from-amber-600 to-amber-700" />
          </div>

          {/* Revenue detail + Payment Method Breakdown */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-3">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Revenue Breakdown</p>
              <div className="text-sm space-y-1.5">
                <Row label="Gross revenue (all paid consultations)" value={egp(f.consultation?.grossRevenue ?? 0)} />
                <Row label="Platform fee earned (consultant commission)" value={egp(f.consultation?.platformFees ?? 0)} valueClass="text-emerald-400" />
                <Row label="User service fee (0% default)" value={egp(0)} valueClass="text-gray-500" />
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 space-y-1.5">
                  <Row label="OPay gateway fees" value={`−${egp(f.consultation?.gatewayFees ?? 0)}`} valueClass="text-amber-400" />
                  <Row label="Refunds issued" value={egp(f.consultation?.refunds ?? 0)} valueClass="text-red-400" />
                  <Row label="Refunded bookings" value={`${f.consultation?.refundedBookings ?? 0}`} valueClass="text-red-400" />
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                  <Row label="Net consultation profit" value={egp((f.consultation?.platformFees ?? 0) - (f.consultation?.gatewayFees ?? 0))} valueClass="text-emerald-400" bold />
                </div>
              </div>
            </div>

            <PaymentMethodBreakdown title="Consultation — Payment Methods" data={f.consultation?.byPaymentMethod} totalColor="text-violet-400" />
          </div>

          {/* Consultant Payouts */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Consultant Payouts</p>
            <div className="text-sm space-y-1.5">
              <Row label="Total consultant payouts" value={egp(f.payouts?.consultantPayouts ?? 0)} />
              <Row label="InstaPay payout fees (0.1%, min 0.50, max 20 EGP)" value={`−${egp(f.payouts?.consultantPayoutFees ?? 0)}`} valueClass="text-amber-400" />
              <Row label="Net paid to consultants" value={egp((f.payouts?.consultantPayouts ?? 0) - (f.payouts?.consultantPayoutFees ?? 0))} valueClass="text-emerald-400" bold />
            </div>
          </div>

          {/* Top Consultants */}
          {(f.consultants?.topConsultants?.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Consultants by Revenue</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                    <th className="py-2 pr-4">Consultant</th>
                    <th className="py-2 pr-4">Specialization</th>
                    <th className="py-2 pr-4 text-right">Bookings</th>
                    <th className="py-2 pr-4 text-right">Revenue</th>
                    <th className="py-2 text-right">Platform Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {f.consultants.topConsultants.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">{c.name}</td>
                      <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{c.specialization || '—'}</td>
                      <td className="py-2 pr-4 text-right text-gray-500 dark:text-gray-400">{c.bookings}</td>
                      <td className="py-2 pr-4 text-right text-emerald-400 font-medium">{egp(c.revenue)}</td>
                      <td className="py-2 text-right text-violet-400">{egp(c.platformFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ PLATFORM INSIGHTS (ENHANCED ANALYTICS) ════════════════════════════ */}
      {enh && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
          <SectionHeader icon={TrendingUp} title="Platform Insights" color="bg-violet-700" sub="Advanced KPIs, top listings & booking patterns" />

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Avg. Booking Duration"
              value={enh.avgBookingDuration != null ? `${Number(enh.avgBookingDuration).toFixed(1)} nights` : '—'}
              sub="Average nights per booking"
              icon={CalendarCheck}
              gradient="bg-gradient-to-br from-indigo-600 to-indigo-700"
            />
            <MetricCard
              label="Repeat Guest Rate"
              value={enh.repeatGuestRate != null ? `${Number(enh.repeatGuestRate).toFixed(1)}%` : '—'}
              sub="Guests with 2+ bookings"
              icon={Users}
              gradient="bg-gradient-to-br from-violet-600 to-violet-700"
            />
            <MetricCard
              label="Consultations"
              value={enh.consultations?.total ?? 0}
              sub={`${enh.consultations?.completed ?? 0} completed`}
              icon={GraduationCap}
              gradient="bg-gradient-to-br from-sky-600 to-sky-700"
            />
            <MetricCard
              label="Consultation Revenue"
              value={egp(enh.consultations?.revenue ?? 0)}
              sub="From paid consultations"
              icon={DollarSign}
              gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
            />
          </div>

          {/* Top properties + Bookings by city */}
          <div className="grid lg:grid-cols-2 gap-4">
            {(enh.topProperties?.length ?? 0) > 0 && (
              <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">Top Properties by Bookings</p>
                <div className="space-y-2">
                  {enh.topProperties.slice(0, 5).map((p: any, i: number) => (
                    <div key={p.id ?? i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{p.title ?? p.name ?? `#${p.id}`}</span>
                      <span className="text-gray-500 shrink-0 ml-2">{p.bookingCount ?? p.count} bookings</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(enh.bookingsByCity?.length ?? 0) > 0 && (
              <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide mb-3">Bookings by City</p>
                <div className="space-y-2">
                  {enh.bookingsByCity.slice(0, 5).map((c: any, i: number) => (
                    <div key={c.city ?? i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{c.city ?? 'Unknown'}</span>
                      <span className="text-gray-500">{c.bookingCount ?? c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top cancellation reasons */}
          {(enh.topCancellationReasons?.length ?? 0) > 0 && (
            <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">Top Cancellation Reasons</p>
              <div className="flex flex-wrap gap-2">
                {enh.topCancellationReasons.slice(0, 8).map((r: any, i: number) => (
                  <span key={i} className="rounded-full bg-red-900/30 border border-red-900/50 px-3 py-1 text-xs text-red-300">
                    {r.reason ?? r} {r.count != null && <span className="text-red-500">({r.count})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ GATEWAY FEE REFERENCE ═════════════════════════════════════════════ */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
        <SectionHeader icon={CreditCard} title="Gateway Fee Reference" color="bg-gray-200 dark:bg-gray-700" sub="Fixed costs from payment providers — not configurable" />
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide">OPay (Card Pay-in)</p>
            <div className="text-sm space-y-1">
              <Row label="Fee" value="2.25% + EGP 2" valueClass="text-amber-400" />
              <Row label="Refund fee" value="Free" valueClass="text-emerald-400" />
            </div>
          </div>
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">InstaPay (Pay-in)</p>
            <div className="text-sm space-y-1">
              <Row label="Fee" value="Free" valueClass="text-emerald-400" />
            </div>
          </div>
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">InstaPay (Payout)</p>
            <div className="text-sm space-y-1">
              <Row label="Fee" value="0.1% of amount" valueClass="text-amber-400" />
              <Row label="Min" value="EGP 0.50" valueClass="text-gray-500 dark:text-gray-400" />
              <Row label="Max" value="EGP 20" valueClass="text-gray-500 dark:text-gray-400" />
              <Row label="Limit per txn" value="EGP 70,000" valueClass="text-gray-500 dark:text-gray-400" />
              <Row label="Daily limit/bank" value="EGP 120,000" valueClass="text-gray-500 dark:text-gray-400" />
              <Row label="Monthly limit/bank" value="EGP 400,000" valueClass="text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPI CARDS ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Booking Conversion" value={`${conversionRate}%`} sub="Bookings per user" icon={TrendingUp} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
        <MetricCard label="Avg. Booking Value" value={`EGP ${avgBookingValue.toLocaleString()}`} sub="Revenue ÷ bookings" icon={DollarSign} gradient="bg-gradient-to-br from-violet-600 to-violet-700" />
        <MetricCard label="Cancellation Rate" value={`${cancellationRate}%`} sub={`${s?.bookings?.cancelled ?? 0} cancelled`} icon={XCircle} gradient="bg-gradient-to-br from-red-700 to-red-800" />
        <MetricCard label="Completion Rate" value={`${completionRate}%`} sub={`${s?.bookings?.completed ?? 0} completed`} icon={Star} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" />
      </div>

      {/* ═══ REVENUE CHART + BOOKING STATUS ═══════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">12-month rolling — EGP</p>
            </div>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </div>
          <RevenueSparkline data={chartData} />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Booking Status Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">All-time — {totalBookings.toLocaleString()} total</p>
          </div>
          <div className="space-y-4">
            <BookingStatusBar label="Confirmed" count={s?.bookings?.confirmed ?? 0} total={totalBookings} color="bg-emerald-500" />
            <BookingStatusBar label="Completed" count={s?.bookings?.completed ?? 0} total={totalBookings} color="bg-blue-500" />
            <BookingStatusBar label="Pending" count={s?.bookings?.pending ?? 0} total={totalBookings} color="bg-amber-500" />
            <BookingStatusBar label="Cancelled" count={s?.bookings?.cancelled ?? 0} total={totalBookings} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* ═══ USERS & PROPERTIES ═══════════════════════════════════════════════ */}
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard label="Total Users" value={s?.users?.total ?? 0} sub={`+${s?.users?.newThisMonth ?? 0} this month`} icon={Users} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
        <MetricCard label="Active Hosts" value={s?.users?.hosts ?? 0} sub="Hosting at least 1 listing" icon={Building2} gradient="bg-gradient-to-br from-sky-600 to-sky-700" />
        <MetricCard label="Registered Guests" value={s?.users?.guests ?? 0} sub="Traveller accounts" icon={CalendarCheck} gradient="bg-gradient-to-br from-amber-600 to-amber-700" />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Property Listings</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Published', value: s?.properties?.published ?? 0, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
            { label: 'Draft', value: s?.properties?.draft ?? 0, color: 'bg-amber-500', textColor: 'text-amber-400' },
            { label: 'Total', value: (s?.properties?.published ?? 0) + (s?.properties?.draft ?? 0), color: 'bg-indigo-500', textColor: 'text-indigo-400' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full mb-2', `${item.color}/20`)}>
                <Building2 className={cn('h-6 w-6', item.textColor)} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ EXPENSES ═════════════════════════════════════════════════════════ */}
      <ExpensesSection />

      {/* ═══ MONTHLY BREAKDOWN ═════════════════════════════════════════════════ */}
      {f?.monthly && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <SectionHeader icon={BarChart3} title="Monthly Breakdown" color="bg-indigo-700" />
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Property Bookings</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4 text-right">Bookings</th>
                    <th className="py-2 pr-4 text-right">Revenue</th>
                    <th className="py-2 text-right">Platform Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {(f.monthly.property ?? []).map((m: any) => (
                    <tr key={m.month} className="border-b border-gray-200/50 dark:border-gray-800/50">
                      <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{m.month}</td>
                      <td className="py-2 pr-4 text-right text-gray-900 dark:text-white">{m.bookings}</td>
                      <td className="py-2 pr-4 text-right text-gray-900 dark:text-white">{egp(m.revenue)}</td>
                      <td className="py-2 text-right text-emerald-400">{egp(m.platformFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Consultation Bookings</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4 text-right">Bookings</th>
                    <th className="py-2 pr-4 text-right">Revenue</th>
                    <th className="py-2 text-right">Platform Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {(f.monthly.consultation ?? []).map((m: any) => (
                    <tr key={m.month} className="border-b border-gray-200/50 dark:border-gray-800/50">
                      <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{m.month}</td>
                      <td className="py-2 pr-4 text-right text-gray-900 dark:text-white">{m.bookings}</td>
                      <td className="py-2 pr-4 text-right text-gray-900 dark:text-white">{egp(m.revenue)}</td>
                      <td className="py-2 text-right text-emerald-400">{egp(m.platformFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADDITIONAL INSIGHTS ═══════════════════════════════════════════════ */}
      <EnhancedAnalyticsSection />
    </div>
  );
}

/* ─── Enhanced Analytics ───────────────────────────────────────────────────── */

function EnhancedAnalyticsSection() {
  const { data: enhanced } = useQuery({
    queryKey: ['admin-enhanced-analytics'],
    queryFn: () => adminApi.getEnhancedAnalytics(),
  });

  const e = enhanced as any;
  if (!e) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <SectionHeader icon={BarChart3} title="Additional Insights" color="bg-gray-200 dark:bg-gray-700" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Avg Stay" value={`${(e.avgBookingDuration ?? 0).toFixed(1)} nights`} sub="Average booking duration" icon={CalendarCheck} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
        <MetricCard label="Repeat Guests" value={`${(e.repeatGuestRate ?? 0).toFixed(1)}%`} sub="Guests with 2+ bookings" icon={Users} gradient="bg-gradient-to-br from-sky-600 to-sky-700" />
        <MetricCard label="Consultations" value={e.consultations?.total ?? 0} sub={`${e.consultations?.completed ?? 0} completed`} icon={GraduationCap} gradient="bg-gradient-to-br from-violet-600 to-violet-700" />
        <MetricCard label="Consultation Revenue" value={egp(e.consultations?.revenue ?? 0)} sub="From paid consultations" icon={DollarSign} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {(e.topProperties?.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Properties</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">City</th>
                  <th className="py-2 pr-4 text-right">Bookings</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {e.topProperties.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-200/50 dark:border-gray-800/50">
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{p.title}</td>
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{p.city}</td>
                    <td className="py-2 pr-4 text-right text-gray-500 dark:text-gray-400">{p.bookings}</td>
                    <td className="py-2 text-right text-emerald-400">{egp(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(e.bookingsByCity?.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Bookings by City</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 text-xs">
                  <th className="py-2 pr-4">City</th>
                  <th className="py-2 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {e.bookingsByCity.map((c: any) => (
                  <tr key={c.city} className="border-b border-gray-200/50 dark:border-gray-800/50">
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{c.city || 'Unknown'}</td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{c.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(e.revenueByPaymentMethod?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Revenue by Payment Method</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {e.revenueByPaymentMethod.map((m: any) => (
              <div key={m.method} className="rounded-lg bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{methodLabel(m.method || 'Unknown')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{egp(m.revenue)}</p>
                <p className="text-xs text-gray-500">{m.count} transactions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(e.topCancellationReasons?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Cancellation Reasons</p>
          <div className="space-y-2">
            {e.topCancellationReasons.map((r: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{r.reason}</span>
                <span className="text-gray-500 dark:text-gray-400">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
