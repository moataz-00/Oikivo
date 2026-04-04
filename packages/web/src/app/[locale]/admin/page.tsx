'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  Users,
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  LogIn,
  LogOut,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value?.toLocaleString()}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function RevenueChart({ data }: { data: { month: string; revenue: number; bookings: number }[] }) {
  if (!data?.length) return <p className="text-gray-500 text-sm">No revenue data yet.</p>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-32 mt-4">
      {data.map((d) => (
        <div key={d.month} className="group flex-1 flex flex-col items-center gap-1">
          <div className="relative w-full">
            <div
              className="w-full rounded-sm bg-violet-600 hover:bg-violet-700 transition-colors cursor-default"
              style={{ height: `${Math.max((d.revenue / max) * 96, 4)}px` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-gray-700 px-2 py-1 text-xs text-white shadow">
              EGP {d.revenue.toLocaleString()}<br />{d.bookings} bookings
            </div>
          </div>
          <span className="text-[10px] text-gray-500 rotate-45 origin-left">{d.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const { data: chart } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(),
  });

  if (statsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const s = stats as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Platform overview at a glance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={s?.users?.total ?? 0} sub={`${s?.users?.newThisMonth ?? 0} this month`} icon={Users} accent="bg-indigo-600" />
        <StatCard label="Active Hosts" value={s?.users?.hosts ?? 0} sub={`${s?.users?.newThisWeek ?? 0} new this week`} icon={TrendingUp} accent="bg-emerald-600" />
        <StatCard label="Published Listings" value={s?.properties?.published ?? 0} sub={`${s?.properties?.draft ?? 0} drafts`} icon={Building2} accent="bg-sky-600" />
        <StatCard label="Total Bookings" value={s?.bookings?.total ?? 0} sub={`${s?.bookings?.pending ?? 0} pending`} icon={CalendarCheck} accent="bg-amber-600" />
        <StatCard label="Total Revenue" value={`EGP ${(s?.revenue?.total ?? 0).toLocaleString()}`} sub={`EGP ${(s?.revenue?.thisMonth ?? 0).toLocaleString()} this month`} icon={DollarSign} accent="bg-violet-600" />
        <StatCard label="Confirmed" value={s?.bookings?.confirmed ?? 0} sub={`${s?.bookings?.completed ?? 0} completed`} icon={ArrowUpRight} accent="bg-teal-600" />
        <StatCard label="Today Check-ins" value={s?.bookings?.todayCheckIns ?? 0} icon={LogIn} accent="bg-orange-600" />
        <StatCard label="Today Check-outs" value={s?.bookings?.todayCheckOuts ?? 0} icon={LogOut} accent="bg-pink-600" />
      </div>

      {/* Revenue Chart + Recent Bookings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-base font-semibold text-white">Revenue (last 12 months)</h2>
          <RevenueChart data={chart as any} />
        </div>

        {/* Recent Bookings */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {(s?.recentBookings ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">
                    {b.guest?.firstName} {b.guest?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{b.property?.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-medium">EGP {b.totalAmount?.toLocaleString()}</p>
                  <span
                    className={cn('text-xs px-2 py-0.5 rounded-full', {
                      'bg-amber-900/50 text-amber-400': b.status === 'pending',
                      'bg-emerald-900/50 text-emerald-400': b.status === 'confirmed' || b.status === 'completed',
                      'bg-red-900/50 text-red-400': b.status === 'cancelled',
                    })}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
            {!s?.recentBookings?.length && (
              <p className="text-gray-500 text-sm">No bookings yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{s?.properties?.draft ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Draft Listings</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{s?.bookings?.cancelled ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Cancelled Bookings</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">EGP {(s?.revenue?.thisWeek ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Revenue This Week</p>
        </div>
      </div>
    </div>
  );
}
