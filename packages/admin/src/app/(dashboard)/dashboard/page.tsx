'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
  Users,
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  LogIn,
  LogOut,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  CalendarRange,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Date range helpers ────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

const PRESETS = [
  { label: 'Today', getDates: () => { const d = toDateStr(new Date()); return { from: d, to: d }; } },
  { label: '7D', getDates: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 6); return { from: toDateStr(from), to: toDateStr(to) }; } },
  { label: 'MTD', getDates: () => { const now = new Date(); return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: toDateStr(now) }; } },
  { label: '30D', getDates: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 29); return { from: toDateStr(from), to: toDateStr(to) }; } },
  { label: '90D', getDates: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 89); return { from: toDateStr(from), to: toDateStr(to) }; } },
] as const;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
          {trend && (
            <p className={cn('mt-2 text-xs font-medium', trend.positive ? 'text-emerald-400' : 'text-red-400')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity', gradient)} />
    </div>
  );
}

function ActionCard({
  label,
  count,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  accent: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900 px-5 py-4 hover:border-indigo-600/50 hover:bg-gray-800/60 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-xl">{count}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function RevenueChart({ data }: { data: { month: string; revenue: number; bookings: number }[] }) {
  if (!data?.length) return <p className="text-gray-500 text-sm mt-4">No revenue data yet.</p>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const maxLabel = `EGP ${Math.round(max / 1000)}k`;

  return (
    <div className="mt-4">
      <div className="flex items-end gap-2 h-36 relative">
        <div className="flex flex-col justify-between text-[10px] text-gray-600 h-full pr-1 shrink-0 text-right">
          <span>{maxLabel}</span>
          <span>EGP {Math.round(max / 2000)}k</span>
          <span>0</span>
        </div>
        <div className="flex items-end gap-1 flex-1 h-full">
          {data.map((d) => {
            const heightPct = Math.max((d.revenue / max) * 100, 3);
            return (
              <div key={d.month} className="group flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div className="relative w-full flex items-end justify-end" style={{ height: '100%' }}>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-violet-700 to-violet-500 hover:from-indigo-600 hover:to-violet-400 transition-colors cursor-default"
                    style={{ height: `${heightPct}%` }}
                  />
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 whitespace-nowrap rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-white shadow-xl">
                    <span className="font-semibold text-violet-300">EGP {d.revenue.toLocaleString()}</span>
                    <span className="text-gray-400">{d.bookings} bookings</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-600">{d.month.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  confirmed: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  completed: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  cancelled: 'bg-red-900/40 text-red-400 border border-red-800/50',
  declined: 'bg-gray-800 text-gray-400',
};

export default function DashboardPage() {
  const [activePreset, setActivePreset] = useState<string>('MTD');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateRange = useMemo(() => {
    if (activePreset === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    const preset = PRESETS.find((p) => p.label === activePreset);
    return preset ? preset.getDates() : PRESETS[2].getDates(); // default MTD
  }, [activePreset, customFrom, customTo]);

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', dateRange.from, dateRange.to],
    queryFn: () => adminApi.getDashboard(dateRange),
  });

  const { data: chart } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between">
          <div className="h-7 bg-gray-800 rounded-lg w-40" />
          <div className="h-8 bg-gray-800 rounded-lg w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const s = stats as any;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timezone = typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

  const period = s?.period;
  const periodLabel = activePreset === 'custom' ? `${customFrom} – ${customTo}` : activePreset;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {dateStr}
              <span className="ml-2 text-xs text-gray-600">{timezone}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </button>
            <Link
              href="/analytics"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
          <CalendarRange className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-500 font-medium">Period:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setActivePreset(p.label)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                activePreset === p.label
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setActivePreset('custom')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              activePreset === 'custom'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
            )}
          >
            Custom
          </button>
          {activePreset === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-gray-600 text-xs">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Needs Attention banner */}
      {(s?.pendingActions?.openDisputes > 0 ||
        s?.pendingActions?.pendingPayouts > 0 ||
        s?.pendingActions?.pendingIdVerifications > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Needs Attention</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {s?.pendingActions?.openDisputes > 0 && (
              <ActionCard
                label="Open Disputes"
                count={s.pendingActions.openDisputes}
                icon={AlertTriangle}
                accent="bg-red-700"
                href="/disputes"
              />
            )}
            {s?.pendingActions?.pendingPayouts > 0 && (
              <ActionCard
                label="Pending Payouts"
                count={s.pendingActions.pendingPayouts}
                icon={CreditCard}
                accent="bg-amber-700"
                href="/payouts"
              />
            )}
            {s?.pendingActions?.pendingIdVerifications > 0 && (
              <ActionCard
                label="ID Reviews Pending"
                count={s.pendingActions.pendingIdVerifications}
                icon={ShieldAlert}
                accent="bg-indigo-700"
                href="/host-verification"
              />
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={s?.users?.total ?? 0}
          sub={period ? `${period.newUsers} joined (${periodLabel})` : `${s?.users?.newThisMonth ?? 0} joined this month`}
          icon={Users}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-700"
          trend={period?.newUsers > 0 ? { value: `${period.newUsers} new`, positive: true } : undefined}
        />
        <StatCard
          label="Active Hosts"
          value={s?.users?.hosts ?? 0}
          sub={`${s?.users?.newThisWeek ?? 0} new this week`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
        />
        <StatCard
          label="Published Listings"
          value={s?.properties?.published ?? 0}
          sub={`${s?.properties?.draft ?? 0} in draft`}
          icon={Building2}
          gradient="bg-gradient-to-br from-sky-600 to-sky-700"
        />
        <StatCard
          label="Bookings"
          value={period?.bookings ?? s?.bookings?.total ?? 0}
          sub={period ? `${period.confirmedBookings} confirmed (${periodLabel})` : `${s?.bookings?.pending ?? 0} pending`}
          icon={CalendarCheck}
          gradient="bg-gradient-to-br from-amber-600 to-amber-700"
        />
        <StatCard
          label="Total Revenue"
          value={`EGP ${(s?.revenue?.total ?? 0).toLocaleString()}`}
          sub={period ? `EGP ${(period.revenue ?? 0).toLocaleString()} (${periodLabel})` : `EGP ${(s?.revenue?.thisMonth ?? 0).toLocaleString()} this month`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-violet-600 to-violet-700"
          trend={{ value: `EGP ${(s?.revenue?.thisWeek ?? 0).toLocaleString()} this week`, positive: true }}
        />
        <StatCard
          label="Confirmed Bookings"
          value={s?.bookings?.confirmed ?? 0}
          sub={`${s?.bookings?.completed ?? 0} completed`}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-teal-600 to-teal-700"
        />
        <StatCard
          label="Today Check-ins"
          value={s?.bookings?.todayCheckIns ?? 0}
          icon={LogIn}
          gradient="bg-gradient-to-br from-orange-600 to-orange-700"
        />
        <StatCard
          label="Today Check-outs"
          value={s?.bookings?.todayCheckOuts ?? 0}
          icon={LogOut}
          gradient="bg-gradient-to-br from-pink-600 to-pink-700"
        />
      </div>

      {/* Charts + Recent Bookings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Revenue Trend</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 12 months — EGP</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-violet-900/30 border border-violet-800/30 px-2.5 py-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
              <span className="text-xs text-violet-400 font-medium">Monthly Revenue</span>
            </div>
          </div>
          <RevenueChart data={(chart ?? []) as any} />
        </div>

        {/* Recent Bookings */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Bookings</h2>
            <Link
              href="/bookings"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {(s?.recentBookings ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-2 text-sm py-2 border-b border-gray-800/60 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                    {b.guest?.firstName?.[0]}{b.guest?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-sm">{b.guest?.firstName} {b.guest?.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{b.property?.title}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-semibold text-sm">EGP {b.totalAmount?.toLocaleString()}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_STYLES[b.status] ?? STATUS_STYLES.declined)}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
            {!s?.recentBookings?.length && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BookOpen className="h-8 w-8 text-gray-700" />
                <p className="text-gray-500 text-sm">No bookings yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            <p className="text-xs text-gray-500">Draft Listings</p>
          </div>
          <p className="text-2xl font-bold text-white">{s?.properties?.draft ?? 0}</p>
          <p className="text-xs text-gray-600 mt-1">Awaiting publish</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-gray-600" />
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
          <p className="text-2xl font-bold text-white">{s?.bookings?.cancelled ?? 0}</p>
          <p className="text-xs text-gray-600 mt-1">Booking cancellations</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <p className="text-xs text-gray-500">Revenue This Week</p>
          </div>
          <p className="text-2xl font-bold text-white">EGP {(s?.revenue?.thisWeek ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-600" />
            <p className="text-xs text-gray-500">Total Guests</p>
          </div>
          <p className="text-2xl font-bold text-white">{s?.users?.guests ?? 0}</p>
          <p className="text-xs text-gray-600 mt-1">Registered travellers</p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: '/users', label: 'Users', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-900/30 border-indigo-800/30' },
            { href: '/properties', label: 'Properties', icon: Building2, color: 'text-sky-400', bg: 'bg-sky-900/30 border-sky-800/30' },
            { href: '/bookings', label: 'Bookings', icon: CalendarCheck, color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800/30' },
            { href: '/payouts', label: 'Payouts', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800/30' },
            { href: '/disputes', label: 'Disputes', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/30 border-red-800/30' },
            { href: '/analytics', label: 'Analytics', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-900/30 border-violet-800/30' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-3.5 hover:brightness-125 transition-all group',
                item.bg,
              )}
            >
              <item.icon className={cn('h-5 w-5', item.color)} />
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
