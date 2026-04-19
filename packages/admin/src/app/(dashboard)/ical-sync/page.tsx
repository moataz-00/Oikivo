'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ICalSourceAdmin } from '@/lib/api';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

function SyncStatusBadge({ status }: { status: ICalSourceAdmin['syncStatus'] }) {
  const map: Record<ICalSourceAdmin['syncStatus'], { label: string; classes: string; icon: React.ReactNode }> = {
    success: {
      label: 'Synced',
      classes: 'bg-emerald-900/40 border-emerald-800/50 text-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    syncing: {
      label: 'Syncing',
      classes: 'bg-blue-900/40 border-blue-800/50 text-blue-400',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    error: {
      label: 'Error',
      classes: 'bg-red-900/40 border-red-800/50 text-red-400',
      icon: <WifiOff className="h-3.5 w-3.5" />,
    },
    idle: {
      label: 'Idle',
      classes: 'bg-gray-100/60 dark:bg-zinc-800/60 border-zinc-700/50 text-gray-500 dark:text-zinc-400',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };
  const { label, classes, icon } = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', classes)}>
      {icon}
      {label}
    </span>
  );
}

function formatDate(val: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ICalSyncPage() {
  const queryClient = useQueryClient();
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());

  function copyUrl(id: number, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIds((s) => new Set(s).add(id));
      setTimeout(() => setCopiedIds((s) => { const n = new Set(s); n.delete(id); return n; }), 2000);
    });
  }

  const { data: sources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-ical-sources'],
    queryFn: () => adminApi.getIcalSources(),
    refetchInterval: 60_000,
  });

  const resyncMutation = useMutation({
    mutationFn: (id: number) => adminApi.syncIcalSource(id),
    onMutate: (id) => setSyncingIds((s) => new Set(s).add(id)),
    onSuccess: () => toast.success('iCal source synced'),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Sync failed'),
    onSettled: (_, __, id) => {
      setSyncingIds((s) => { const n = new Set(s); n.delete(id); return n; });
      queryClient.invalidateQueries({ queryKey: ['admin-ical-sources'] });
    },
  });

  const errorSources = sources.filter((s) => s.syncStatus === 'error');
  const successSources = sources.filter((s) => s.syncStatus === 'success');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">iCal Feed Monitor</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Track & manage all connected external calendar feeds across all properties.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 transition-colors hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-200 dark:hover:bg-zinc-700"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total feeds', value: sources.length, icon: Wifi, color: 'text-blue-400' },
          { label: 'Synced OK', value: successSources.length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'With errors', value: errorSources.length, icon: AlertTriangle, color: 'text-red-400' },
          {
            label: 'Properties',
            value: new Set(sources.map((s) => s.propertyId)).size,
            icon: Building2,
            color: 'text-amber-400',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-500 text-xs uppercase tracking-wide mb-2">
              <Icon className={cn('h-4 w-4', color)} />
              {label}
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-100/50 dark:bg-zinc-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Property</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Feed label / URL</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Last synced</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Error</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-zinc-500">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-400">
                  <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
                  Failed to load iCal sources.
                  <button onClick={() => refetch()} className="ml-2 text-indigo-400 hover:underline">Retry</button>
                </td>
              </tr>
            )}
            {!isLoading && !isError && sources.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-zinc-500">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 opacity-30" />
                  <p className="font-medium text-gray-500 dark:text-zinc-400">No iCal feeds connected</p>
                  <p className="mt-1 text-xs">Hosts can connect external calendars from their property calendar settings.</p>
                </td>
              </tr>
            )}
            {sources.map((source) => {
              const isSyncing = syncingIds.has(source.id);
              return (
                <tr key={source.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500 dark:text-zinc-500 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {source.property?.title ?? `Property #${source.propertyId}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">ID #{source.propertyId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 dark:text-zinc-200">{source.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-zinc-500 truncate max-w-[220px]" title={source.url}>
                        {source.url}
                      </p>
                      <button
                        onClick={() => copyUrl(source.id, source.url)}
                        title="Copy URL"
                        className="shrink-0 rounded p-0.5 text-gray-400 dark:text-zinc-600 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
                      >
                        {copiedIds.has(source.id) ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <SyncStatusBadge status={isSyncing ? 'syncing' : source.syncStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 text-xs">{formatDate(source.lastSyncedAt)}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {source.errorMessage ? (
                      <span className="text-xs text-red-400 line-clamp-2" title={source.errorMessage}>
                        {source.errorMessage}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={isSyncing}
                      onClick={() => resyncMutation.mutate(source.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-300 transition-colors hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                      {isSyncing ? 'Syncing…' : 'Resync'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
