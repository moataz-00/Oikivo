'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const METHOD_COLORS: Record<string, string> = {
  POST:   'bg-emerald-900/50 text-emerald-400',
  PATCH:  'bg-amber-900/50 text-amber-400',
  PUT:    'bg-blue-900/50 text-blue-400',
  DELETE: 'bg-red-900/50 text-red-400',
};

const METHOD_FILTERS = ['All', 'POST', 'PATCH', 'PUT', 'DELETE'];

function ActionBadge({ action }: { action: string }) {
  const method = action.split(' ')[0] ?? '';
  const color = METHOD_COLORS[method] ?? 'bg-gray-700 text-gray-400';
  return (
    <span className="font-mono text-xs">
      <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 font-medium mr-1.5', color)}>
        {method}
      </span>
      <span className="text-gray-300">{action.slice(method.length + 1)}</span>
    </span>
  );
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity-log', page],
    queryFn: () => adminApi.getActivityLog({ page, limit: 50 }),
  });

  const d = data as any;
  const allItems: any[] = d?.items ?? [];

  const items = useMemo(
    () => methodFilter === 'All'
      ? allItems
      : allItems.filter((log) => log.action?.startsWith(methodFilter)),
    [allItems, methodFilter],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-sm text-gray-400 mt-1">Audit trail of all admin actions</p>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {METHOD_FILTERS.map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              methodFilter === m ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                {['Timestamp', 'Admin', 'Action', 'Entity', 'IP Address'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(12)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ClipboardList className="h-10 w-10 text-gray-600" />
                        <p className="text-gray-500">No activity recorded yet</p>
                      </div>
                    </td>
                  </tr>
                )
                : items.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.admin ? (
                        <div>
                          <p className="text-white text-xs font-medium">{log.admin.firstName} {log.admin.lastName}</p>
                          <p className="text-gray-500 text-xs">{log.admin.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">#{log.adminId ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      {log.entityType ? (
                        <span className="text-gray-300 text-xs">
                          {log.entityType}
                          {log.entityId && <span className="text-gray-500"> #{log.entityId}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                      {log.ipAddress ?? '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {d?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{d?.total} total entries</span>
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




