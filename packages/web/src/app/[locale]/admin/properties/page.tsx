'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Archive, Eye, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-900/50 text-emerald-400',
  draft: 'bg-amber-900/50 text-amber-400',
  archived: 'bg-gray-700 text-gray-400',
};

export default function AdminPropertiesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', page, statusFilter, search],
    queryFn: () => adminApi.getProperties({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' }) =>
      adminApi.updatePropertyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });

  const d = data as any;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Properties</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all listings on the platform</p>
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
              placeholder="Search title, city…"
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white',
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Host</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price/night</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (d?.items ?? []).map((p: any) => {
                    const photo = p.photos?.[0];
                    return (
                      <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                              {photo ? (
                                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gray-700" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white line-clamp-1">{p.title}</p>
                              <p className="text-xs text-gray-500">#{p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {p.host?.firstName} {p.host?.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{p.city}{p.country ? `, ${p.country}` : ''}</td>
                        <td className="px-4 py-3 text-white">EGP {p.pricePerNight?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-amber-400">
                          {p.avgRating ? `★ ${Number(p.avgRating).toFixed(1)}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-700 text-gray-400')}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {p.status !== 'published' && (
                              <button
                                title="Publish"
                                onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                                disabled={updateStatus.isPending}
                                className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/30 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {p.status !== 'draft' && (
                              <button
                                title="Set to draft"
                                onClick={() => updateStatus.mutate({ id: p.id, status: 'draft' })}
                                disabled={updateStatus.isPending}
                                className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-900/30 transition-colors"
                              >
                                <FileEdit className="h-4 w-4" />
                              </button>
                            )}
                            {p.status !== 'archived' && (
                              <button
                                title="Archive"
                                onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })}
                                disabled={updateStatus.isPending}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 transition-colors"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {d?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{d?.total} total properties</span>
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
