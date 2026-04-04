'use client';

import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function BookingStatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{count.toLocaleString()} <span className="text-gray-600">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
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
          <p className="text-lg font-bold text-white">EGP {(totalRevenue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-500">Total (12mo)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">EGP {(avgMonthly / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-500">Monthly Avg</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{totalBookings}</p>
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
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 whitespace-nowrap rounded-lg bg-gray-800 border border-gray-700 px-2.5 py-1.5 text-xs text-white shadow-xl">
                  <span className="font-semibold text-violet-300">EGP {d.revenue.toLocaleString()}</span>
                  <span className="text-gray-400">{d.bookings} bookings</span>
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

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(),
  });

  if (isLoading || chartLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-gray-800 rounded-lg w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-800 rounded-xl" />
          <div className="h-72 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const s = stats as any;
  const chartData = (chart ?? []) as { month: string; revenue: number; bookings: number }[];

  const totalBookings = s?.bookings?.total ?? 0;
  const conversionRate =
    s?.users?.total > 0
      ? ((totalBookings / s.users.total) * 100).toFixed(1)
      : '0.0';

  const cancellationRate =
    totalBookings > 0
      ? (((s?.bookings?.cancelled ?? 0) / totalBookings) * 100).toFixed(1)
      : '0.0';

  const completionRate =
    totalBookings > 0
      ? (((s?.bookings?.completed ?? 0) / totalBookings) * 100).toFixed(1)
      : '0.0';

  const avgBookingValue =
    totalBookings > 0
      ? Math.round((s?.revenue?.total ?? 0) / totalBookings)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform performance and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Booking Conversion"
          value={`${conversionRate}%`}
          sub="Bookings per registered user"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-700"
        />
        <MetricCard
          label="Avg. Booking Value"
          value={`EGP ${avgBookingValue.toLocaleString()}`}
          sub="Revenue ÷ total bookings"
          icon={DollarSign}
          gradient="bg-gradient-to-br from-violet-600 to-violet-700"
        />
        <MetricCard
          label="Cancellation Rate"
          value={`${cancellationRate}%`}
          sub={`${s?.bookings?.cancelled ?? 0} cancelled`}
          icon={XCircle}
          gradient="bg-gradient-to-br from-red-700 to-red-800"
        />
        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          sub={`${s?.bookings?.completed ?? 0} completed`}
          icon={Star}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
        />
      </div>

      {/* Revenue chart + Booking status breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue sparkline */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Revenue Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">12-month rolling — EGP</p>
            </div>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </div>
          <RevenueSparkline data={chartData} />
        </div>

        {/* Booking status breakdown */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Booking Status Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">All-time — {totalBookings.toLocaleString()} total bookings</p>
          </div>
          <div className="space-y-4">
            <BookingStatusBar label="Confirmed" count={s?.bookings?.confirmed ?? 0} total={totalBookings} color="bg-emerald-500" />
            <BookingStatusBar label="Completed" count={s?.bookings?.completed ?? 0} total={totalBookings} color="bg-blue-500" />
            <BookingStatusBar label="Pending" count={s?.bookings?.pending ?? 0} total={totalBookings} color="bg-amber-500" />
            <BookingStatusBar label="Cancelled" count={s?.bookings?.cancelled ?? 0} total={totalBookings} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Quick user breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Users"
          value={s?.users?.total ?? 0}
          sub={`+${s?.users?.newThisMonth ?? 0} this month`}
          icon={Users}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-700"
        />
        <MetricCard
          label="Active Hosts"
          value={s?.users?.hosts ?? 0}
          sub="Hosting at least 1 listing"
          icon={Building2}
          gradient="bg-gradient-to-br from-sky-600 to-sky-700"
        />
        <MetricCard
          label="Registered Guests"
          value={s?.users?.guests ?? 0}
          sub="Traveller accounts"
          icon={CalendarCheck}
          gradient="bg-gradient-to-br from-amber-600 to-amber-700"
        />
      </div>

      {/* Properties breakdown */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Property Listings</h2>
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
              <p className="text-2xl font-bold text-white">{item.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {((s?.properties?.published ?? 0) + (s?.properties?.draft ?? 0)) > 0 && (
          <div className="mt-4 h-2 rounded-full bg-gray-800 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${((s?.properties?.published ?? 0) / ((s?.properties?.published ?? 0) + (s?.properties?.draft ?? 1))) * 100}%` }}
            />
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${((s?.properties?.draft ?? 0) / ((s?.properties?.published ?? 0) + (s?.properties?.draft ?? 1))) * 100}%` }}
            />
          </div>
        )}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Published</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /><span className="text-xs text-gray-500">Draft</span></div>
        </div>
      </div>

      {/* Finance summary */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Revenue Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `EGP ${(s?.revenue?.total ?? 0).toLocaleString()}`, sub: 'All-time' },
            { label: 'This Month', value: `EGP ${(s?.revenue?.thisMonth ?? 0).toLocaleString()}`, sub: 'Current month' },
            { label: 'This Week', value: `EGP ${(s?.revenue?.thisWeek ?? 0).toLocaleString()}`, sub: 'Current week' },
            { label: 'Avg / Booking', value: `EGP ${avgBookingValue.toLocaleString()}`, sub: 'Per completed booking' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-base font-bold text-white mt-1">{item.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
