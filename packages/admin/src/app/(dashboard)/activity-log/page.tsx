'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ClipboardList, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, User, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const METHOD_COLORS: Record<string, string> = {
  POST:   'bg-emerald-900/50 text-emerald-400',
  PATCH:  'bg-amber-900/50 text-amber-400',
  PUT:    'bg-blue-900/50 text-blue-400',
  DELETE: 'bg-red-900/50 text-red-400',
};

const METHOD_FILTERS = ['All', 'POST', 'PATCH', 'PUT', 'DELETE'];

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function ActionBadge({ action }: { action: string }) {
  const firstToken = action.split(' ')[0] ?? '';
  const method = HTTP_METHODS.has(firstToken) ? firstToken : null;
  if (!method) {
    return <span className="text-xs text-gray-600 dark:text-gray-300">{action}</span>;
  }
  const color = METHOD_COLORS[method] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
  return (
    <span className="font-mono text-xs">
      <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 font-medium mr-1.5', color)}>
        {method}
      </span>
      <span className="text-gray-600 dark:text-gray-300">{action.slice(method.length + 1)}</span>
    </span>
  );
}

// FIX AD4: Structured diff view for audit log details
function DiffView({ data }: { data: Record<string, any> }) {
  // Check if data has "old" and "new" keys (structured diff)
  const hasOldNew = data && typeof data === 'object' && ('old' in data || 'new' in data || 'before' in data || 'after' in data);
  const hasChanges = data && typeof data === 'object' && 'changes' in data && typeof data.changes === 'object';

  if (hasOldNew) {
    const oldVal = data.old ?? data.before ?? {};
    const newVal = data.new ?? data.after ?? {};
    const allKeys = [...new Set([...Object.keys(oldVal), ...Object.keys(newVal)])];
    return (
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Changes (Old → New)</p>
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Old Value</th>
                <th className="px-3 py-2">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {allKeys.map((key) => {
                const o = oldVal[key];
                const n = newVal[key];
                const changed = JSON.stringify(o) !== JSON.stringify(n);
                return (
                  <tr key={key} className={changed ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                    <td className="px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300">{key}</td>
                    <td className={cn('px-3 py-1.5 font-mono', changed ? 'text-red-500 line-through' : 'text-gray-500')}>
                      {o !== undefined ? String(o) : '—'}
                    </td>
                    <td className={cn('px-3 py-1.5 font-mono', changed ? 'text-emerald-500 font-semibold' : 'text-gray-500')}>
                      {n !== undefined ? String(n) : '—'}
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

  if (hasChanges && typeof data.changes === 'object') {
    const changes = data.changes;
    const keys = Object.keys(changes);
    return (
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Changes</p>
        {data.reason && <p className="text-xs text-gray-500 mb-2">Reason: <span className="text-gray-300">{data.reason}</span></p>}
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {keys.map((key) => (
                <tr key={key}>
                  <td className="px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300">{key}</td>
                  <td className="px-3 py-1.5 font-mono text-gray-500">
                    {typeof changes[key] === 'object' ? JSON.stringify(changes[key]) : String(changes[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: render flat key-value pairs in a table instead of raw JSON
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payload Details</p>
      <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map(([key, val]) => (
              <tr key={key}>
                <td className="px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300">{key}</td>
                <td className="px-3 py-1.5 font-mono text-gray-500 whitespace-pre-wrap break-all">
                  {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState('All');
  const [adminFilter, setAdminFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-activity-log', page, methodFilter, adminFilter, fromDate, toDate],
    queryFn: () => adminApi.getActivityLog({
      page,
      limit: 50,
      method: methodFilter !== 'All' ? methodFilter : undefined,
      adminId: adminFilter ? (isNaN(parseInt(adminFilter, 10)) ? undefined : parseInt(adminFilter, 10)) : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];

  function exportCsv() {
    if (!items.length) return;
    const headers = ['Timestamp', 'Admin', 'Action', 'Entity', 'IP Address'];
    const rows = items.map((log: any) => [
      log.createdAt ? new Date(log.createdAt).toISOString() : '',
      log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : `#${log.adminId ?? ''}`,
      log.action ?? '',
      log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}` : '',
      log.ipAddress ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-page${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hasFilters = methodFilter !== 'All' || adminFilter || fromDate || toDate;

  const resetFilters = () => {
    setMethodFilter('All');
    setAdminFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Audit trail of all admin actions</p>
      </div>

      {/* AL-5: Export button */}
      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          disabled={!items.length}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1 flex-wrap">
          {METHOD_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => { setMethodFilter(m); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                methodFilter === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-600 text-xs">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              type="number"
              placeholder="Admin ID"
              value={adminFilter}
              onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
              className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="w-9" />
                {['Timestamp', 'Admin', 'Action', 'Entity', 'IP Address'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading
                ? [...Array(12)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : isError
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                        <p className="text-red-400 font-medium">Failed to load activity log</p>
                        <p className="text-gray-500 text-xs">Check your connection and try again</p>
                      </div>
                    </td>
                  </tr>
                )
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ClipboardList className="h-10 w-10 text-gray-600" />
                        <p className="text-gray-500">No activity recorded yet</p>
                      </div>
                    </td>
                  </tr>
                )
                : items.map((log: any) => {
                    const isExpanded = expandedId === log.id;
                    const hasPayload = log.payload || log.metadata || log.changes;
                    return (
                      <>
                        <tr key={log.id} className={cn('transition-colors', isExpanded ? 'bg-gray-800/60' : 'hover:bg-gray-800/50')}>
                          <td className="px-3 py-3">
                            {hasPayload && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                className="rounded p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {log.admin ? (
                              <div>
                                <p className="text-gray-900 dark:text-white text-xs font-medium">{log.admin.firstName} {log.admin.lastName}</p>
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
                              <span className="text-gray-600 dark:text-gray-300 text-xs">
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
                        {isExpanded && hasPayload && (
                          <tr className="bg-gray-50 dark:bg-gray-950/60">
                            <td colSpan={6} className="px-6 py-3">
                              <DiffView data={log.payload ?? log.metadata ?? log.changes ?? {}} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{d?.total} total entries</span>
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




