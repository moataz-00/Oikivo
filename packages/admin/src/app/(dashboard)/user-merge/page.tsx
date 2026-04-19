'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ArrowLeftRight, Search, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function UserMergePage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [keepId, setKeepId] = useState<number | null>(null);
  const [mergeId, setMergeId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-duplicate-users', search],
    queryFn: () => adminApi.findDuplicateUsers(search),
    enabled: search.length >= 2,
  });

  const mergeMutation = useMutation({
    mutationFn: () => adminApi.mergeUsers(keepId!, mergeId!),
    onSuccess: (data: any) => {
      toast.success(data?.message ?? 'Users merged successfully');
      setKeepId(null);
      setMergeId(null);
      setConfirmOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to merge users'),
  });

  const items: any[] = users ?? [];

  const keepUser = items.find((u: any) => u.id === keepId);
  const mergeUser = items.find((u: any) => u.id === mergeId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Merge / Dedup</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Find and merge duplicate user accounts (e.g., email + Google registrations)</p>
      </div>

      <div className="rounded-xl border border-amber-900/40 bg-amber-900/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">Destructive action</p>
          <p className="text-xs text-gray-400 mt-0.5">Merging transfers all data (bookings, reviews, properties, messages) from the secondary account to the primary. The secondary account is deactivated. This cannot be undone.</p>
        </div>
      </div>

      {/* Search */}
      <form
        className="relative max-w-md"
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setKeepId(null); setMergeId(null); }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-10 pr-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </form>

      {/* Selection summary */}
      {(keepId || mergeId) && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Merge Selection</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className={cn('flex-1 rounded-lg border p-3', keepId ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-gray-300 dark:border-gray-700')}>
              <p className="text-xs text-emerald-400 font-medium mb-1">Primary (Keep)</p>
              {keepUser ? (
                <div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{keepUser.firstName} {keepUser.lastName}</p>
                  <p className="text-xs text-gray-500">{keepUser.email} · #{keepUser.id}</p>
                </div>
              ) : <p className="text-xs text-gray-500">Click a user row to select</p>}
            </div>
            <ArrowLeftRight className="h-5 w-5 text-gray-500 shrink-0" />
            <div className={cn('flex-1 rounded-lg border p-3', mergeId ? 'border-red-500/50 bg-red-900/10' : 'border-gray-300 dark:border-gray-700')}>
              <p className="text-xs text-red-400 font-medium mb-1">Secondary (Merge & Deactivate)</p>
              {mergeUser ? (
                <div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{mergeUser.firstName} {mergeUser.lastName}</p>
                  <p className="text-xs text-gray-500">{mergeUser.email} · #{mergeUser.id}</p>
                </div>
              ) : <p className="text-xs text-gray-500">Click another user row to select</p>}
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!keepId || !mergeId}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              Merge Users
            </button>
            <button
              onClick={() => { setKeepId(null); setMergeId(null); }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* User results */}
      {search && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Auth Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" /></td></tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <User className="h-10 w-10 text-gray-600" />
                          <p className="text-gray-500 text-sm">No users found</p>
                        </div>
                      </td>
                    </tr>
                  )
                : items.map((u: any) => {
                    const isKeep = keepId === u.id;
                    const isMerge = mergeId === u.id;
                    return (
                      <tr
                        key={u.id}
                        onClick={() => {
                          if (!keepId) setKeepId(u.id);
                          else if (keepId === u.id) setKeepId(null);
                          else if (!mergeId) setMergeId(u.id);
                          else if (mergeId === u.id) setMergeId(null);
                        }}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isKeep ? 'bg-emerald-900/20' : isMerge ? 'bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          #{u.id}
                          {isKeep && <span className="ml-1 text-emerald-400">(primary)</span>}
                          {isMerge && <span className="ml-1 text-red-400">(merge)</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white text-xs font-medium">{u.firstName} {u.lastName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{u.email}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.phone ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {u.email && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded px-1.5 py-0.5">Email</span>}
                            {u.googleId && <span className="text-xs bg-blue-900/30 text-blue-400 rounded px-1.5 py-0.5">Google</span>}
                            {u.appleId && <span className="text-xs bg-gray-700 text-gray-300 rounded px-1.5 py-0.5">Apple</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium',
                            u.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                          )}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {u.isHost && <span className="ml-1 text-xs bg-indigo-900/30 text-indigo-400 rounded px-1.5 py-0.5">Host</span>}
                          {u.isAdmin && <span className="ml-1 text-xs bg-amber-900/30 text-amber-400 rounded px-1.5 py-0.5">Admin</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmOpen && keepId && mergeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm User Merge</h2>
            <p className="text-sm text-gray-500 mb-4">
              All data from <strong className="text-red-400">#{mergeId} ({mergeUser?.firstName} {mergeUser?.lastName})</strong> will be transferred to <strong className="text-emerald-400">#{keepId} ({keepUser?.firstName} {keepUser?.lastName})</strong>.
              The secondary account will be deactivated. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => mergeMutation.mutate()}
                disabled={mergeMutation.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {mergeMutation.isPending ? 'Merging…' : 'Confirm Merge'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
