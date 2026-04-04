'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, apiClient, BACKEND_BASE } from '@/lib/api';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Users,
  Building2,
  CalendarCheck,
  CreditCard,
  Clock,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
        ok
          ? 'bg-emerald-900/40 border-emerald-800/50 text-emerald-400'
          : 'bg-red-900/40 border-red-800/50 text-red-400',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
      {label}: {ok ? 'Online' : 'Offline'}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-lg', color)}>
        <Icon className="h-4.5 w-4.5 h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function SystemHealthPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastChecked, setLastChecked] = useState(new Date());

  // Primary API health check via dashboard endpoint
  const { data: dashData, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ['system-health-dash', refreshKey],
    queryFn: async () => {
      const start = performance.now();
      const data = await adminApi.getDashboard();
      const latency = Math.round(performance.now() - start);
      return { data, latency };
    },
    retry: 1,
    staleTime: 0,
  });

  // Dedicated system-health endpoint (if it exists)
  const { data: healthData, isError: healthError } = useQuery({
    queryKey: ['system-health-endpoint', refreshKey],
    queryFn: () => adminApi.getSystemHealth(),
    retry: 0,
    staleTime: 0,
  });

  const apiOnline = !dashError;
  const dbOnline = apiOnline && !!dashData;
  const latency = dashData?.latency ?? null;
  const stats = dashData?.data ?? {};

  const totalUsers = (stats.totalUsers ?? 0) + (stats.totalHosts ?? 0);
  const totalProperties = stats.totalProperties ?? 0;
  const totalBookings = stats.totalBookings ?? 0;
  const pendingPayouts = stats.pendingPayouts ?? 0;

  function refresh() {
    setRefreshKey((k) => k + 1);
    setLastChecked(new Date());
  }

  const overallHealth = apiOnline && dbOnline;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Real-time status of backend services
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={dashLoading}
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', dashLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div
        className={cn(
          'flex items-center gap-4 rounded-xl border p-5',
          overallHealth
            ? 'border-emerald-800/50 bg-emerald-900/20'
            : 'border-red-800/50 bg-red-900/20',
        )}
      >
        {dashLoading ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
        ) : overallHealth ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="h-6 w-6 text-red-400 shrink-0" />
        )}
        <div>
          <p className={cn('font-semibold', overallHealth ? 'text-emerald-300' : 'text-red-300')}>
            {dashLoading
              ? 'Checking system status…'
              : overallHealth
              ? 'All systems operational'
              : 'One or more services are down'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Last checked: {lastChecked.toLocaleTimeString()}
            {latency != null && ` · API latency: ${latency}ms`}
          </p>
        </div>
      </div>

      {/* Service status row */}
      <div className="flex flex-wrap gap-3">
        <StatusPill ok={apiOnline} label="REST API" />
        <StatusPill ok={dbOnline} label="Database" />
        <StatusPill ok={apiOnline} label="Auth Service" />
        {healthData && (
          <>
            {(healthData as any).storage != null && (
              <StatusPill ok={(healthData as any).storage === 'ok'} label="File Storage" />
            )}
            {(healthData as any).queue != null && (
              <StatusPill ok={(healthData as any).queue === 'ok'} label="Job Queue" />
            )}
          </>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={dashLoading ? '—' : totalUsers.toLocaleString()}
          sub={`${stats.totalHosts ?? 0} hosts · ${stats.totalGuests ?? 0} guests`}
          color="bg-indigo-900/50 text-indigo-400"
        />
        <MetricCard
          icon={Building2}
          label="Properties"
          value={dashLoading ? '—' : totalProperties.toLocaleString()}
          sub={`${stats.publishedProperties ?? 0} published`}
          color="bg-violet-900/50 text-violet-400"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Total Bookings"
          value={dashLoading ? '—' : totalBookings.toLocaleString()}
          sub={`${stats.activeBookings ?? 0} active`}
          color="bg-sky-900/50 text-sky-400"
        />
        <MetricCard
          icon={CreditCard}
          label="Pending Payouts"
          value={dashLoading ? '—' : pendingPayouts.toLocaleString()}
          sub={pendingPayouts > 0 ? 'Requires attention' : 'All processed'}
          color={pendingPayouts > 0 ? 'bg-amber-900/50 text-amber-400' : 'bg-emerald-900/50 text-emerald-400'}
        />
      </div>

      {/* Technical info */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* API info */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-white">API Server</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">Base URL</dt>
              <dd className="text-gray-200 font-mono text-xs truncate max-w-[200px]">{BACKEND_BASE}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Status</dt>
              <dd className={apiOnline ? 'text-emerald-400' : 'text-red-400'}>
                {dashLoading ? 'Checking…' : apiOnline ? 'Reachable' : 'Unreachable'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Response time</dt>
              <dd className={cn(
                'font-medium',
                latency == null ? 'text-gray-500' :
                latency < 200 ? 'text-emerald-400' :
                latency < 600 ? 'text-amber-400' :
                'text-red-400',
              )}>
                {dashLoading ? '…' : latency != null ? `${latency}ms` : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Auth</dt>
              <dd className="text-gray-200 text-xs">JWT Bearer (localStorage)</dd>
            </div>
          </dl>
        </div>

        {/* Connectivity checks */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-white">Connectivity</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Dashboard endpoint', ok: !dashError, loading: dashLoading },
              { label: 'Database (via API)', ok: !dashError && dashData != null, loading: dashLoading },
              { label: 'System health endpoint', ok: !healthError, loading: false },
            ].map((check) => (
              <div key={check.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{check.label}</span>
                {check.loading ? (
                  <span className="text-xs text-gray-600">Checking…</span>
                ) : (
                  <span className={cn('flex items-center gap-1 text-xs font-medium', check.ok ? 'text-emerald-400' : 'text-red-400')}>
                    {check.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {check.ok ? 'OK' : 'Failed'}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Checked at {lastChecked.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health data from dedicated endpoint if available */}
      {healthData && Object.keys(healthData as object).length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Backend Health Details</h2>
          <pre className="text-xs text-gray-400 bg-gray-950 rounded-lg p-4 overflow-x-auto leading-relaxed">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
