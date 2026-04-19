'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { UserCheck, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_COLORS = [
  'bg-red-900/30 text-red-400 border-red-500/30',
  'bg-amber-900/30 text-amber-400 border-amber-500/30',
  'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  'bg-blue-900/30 text-blue-400 border-blue-500/30',
  'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
];

const STAGE_BAR_COLORS = [
  'bg-red-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-emerald-500',
];

interface FunnelStage {
  stage: number;
  label: string;
  count: number;
  users: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    created_at: string;
    id_document_status: string;
  }>;
}

export default function HostOnboardingPage() {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-host-onboarding'],
    queryFn: () => adminApi.getHostOnboardingFunnel(),
  });

  const funnel: FunnelStage[] = (data as any)?.funnel ?? [];
  const maxCount = Math.max(...funnel.map((s) => s.count), 1);
  const totalUsers = funnel.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Onboarding Funnel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track where hosts are in the onboarding pipeline — from registration to first booking</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : funnel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <UserCheck className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm">No onboarding data available</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4">
            <Users className="h-5 w-5 text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-bold text-gray-900 dark:text-white">{totalUsers}</span> total users in pipeline</p>
            <div className="flex-1" />
            <div className="flex gap-1 h-3 w-64 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
              {funnel.map((s, i) => (
                <div
                  key={s.stage}
                  className={cn(STAGE_BAR_COLORS[i] ?? 'bg-gray-500', 'transition-all')}
                  style={{ width: totalUsers > 0 ? `${(s.count / totalUsers) * 100}%` : '0%' }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
            </div>
          </div>

          {/* Funnel stages */}
          <div className="space-y-3">
            {funnel.map((stage, i) => {
              const isExpanded = expandedStage === stage.stage;
              const pct = totalUsers > 0 ? ((stage.count / totalUsers) * 100).toFixed(1) : '0.0';
              const barW = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

              return (
                <div
                  key={stage.stage}
                  className={cn(
                    'rounded-xl border bg-white dark:bg-gray-900 overflow-hidden transition-colors',
                    STAGE_COLORS[i]?.split(' ').pop() ?? 'border-gray-200 dark:border-gray-800'
                  )}
                >
                  {/* Stage header */}
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : stage.stage)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div className={cn('flex items-center justify-center rounded-full h-8 w-8 text-xs font-bold', STAGE_COLORS[i] ?? '')}>
                      {stage.stage}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{stage.label}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', STAGE_BAR_COLORS[i] ?? 'bg-gray-500')}
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stage.count}</p>
                      <p className="text-xs text-gray-500">users</p>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />}
                  </button>

                  {/* Expanded users list */}
                  {isExpanded && stage.users.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-800">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            <th className="px-5 py-2">ID</th>
                            <th className="px-5 py-2">Name</th>
                            <th className="px-5 py-2">Email</th>
                            <th className="px-5 py-2">Phone</th>
                            <th className="px-5 py-2">ID Verification</th>
                            <th className="px-5 py-2">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {stage.users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="px-5 py-2 font-mono text-gray-500">#{u.id}</td>
                              <td className="px-5 py-2 text-gray-900 dark:text-white font-medium">{u.first_name} {u.last_name}</td>
                              <td className="px-5 py-2 text-gray-500">{u.email}</td>
                              <td className="px-5 py-2 text-gray-500">{u.phone ?? '—'}</td>
                              <td className="px-5 py-2">
                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                                  u.id_document_status === 'approved' ? 'bg-emerald-900/50 text-emerald-400'
                                  : u.id_document_status === 'pending' ? 'bg-amber-900/50 text-amber-400'
                                  : u.id_document_status === 'rejected' ? 'bg-red-900/50 text-red-400'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                                )}>
                                  {u.id_document_status ?? 'none'}
                                </span>
                              </td>
                              <td className="px-5 py-2 text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {stage.count > stage.users.length && (
                        <p className="px-5 py-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800">
                          Showing {stage.users.length} of {stage.count} users
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
