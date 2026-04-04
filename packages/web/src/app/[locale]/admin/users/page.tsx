'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, ShieldCheck, ShieldOff, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'guest', label: 'Guest' },
  { value: 'host', label: 'Host' },
  { value: 'admin', label: 'Admin' },
];

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', color)}>
      {children}
    </span>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, role],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined, role: role || undefined }),
  });

  const toggleActive = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const toggleAdmin = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const d = data as any;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone…"
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setRole(f.value); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                role === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (d?.items ?? []).map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 uppercase shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{user.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.isAdmin && <Badge color="bg-gray-800 text-gray-300">Admin</Badge>}
                          {user.isHost && <Badge color="bg-emerald-900/50 text-emerald-400">Host</Badge>}
                          {!user.isAdmin && !user.isHost && <Badge color="bg-gray-800 text-gray-400">Guest</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={user.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title={user.isActive ? 'Suspend user' : 'Activate user'}
                            onClick={() => toggleActive.mutate(user.id)}
                            disabled={toggleActive.isPending}
                            className={cn(
                              'rounded-lg p-1.5 transition-colors',
                              user.isActive ? 'text-red-400 hover:bg-red-900/30' : 'text-green-400 hover:bg-green-900/30',
                            )}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            title={user.isAdmin ? 'Revoke admin' : 'Grant admin'}
                            onClick={() => toggleAdmin.mutate(user.id)}
                            disabled={toggleAdmin.isPending}
                            className={cn(
                              'rounded-lg p-1.5 transition-colors',
                              user.isAdmin ? 'text-yellow-400 hover:bg-yellow-900/30' : 'text-gray-400 hover:bg-gray-700',
                            )}
                          >
                            {user.isAdmin ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {d?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{d?.total} total users</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-white">{page} / {d?.totalPages}</span>
              <button
                disabled={page === d?.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
