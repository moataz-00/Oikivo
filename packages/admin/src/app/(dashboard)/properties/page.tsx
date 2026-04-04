'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Archive, Eye, FileEdit, CheckSquare, Square } from 'lucide-react';
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

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-properties', page, statusFilter, search],
    queryFn: () => adminApi.getProperties({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' }) =>
      adminApi.updatePropertyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });

  const bulkStatus = useMutation({
    mutationFn: (status: 'draft' | 'published' | 'archived') =>
      adminApi.bulkPropertyStatus(selected, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      setSelected([]);
    },
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];
  const allIds = items.map((p: any) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id: number) => selected.includes(id));

  function toggleOne(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelected(allSelected ? [] : allIds);
  }

  if (isError) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold text-white">Failed to load properties</p>
      <p className="text-sm text-gray-400">The backend may be unavailable. Try refreshing the page.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Properties</h1>
        <p className="text-sm text-gray-400 mt-1">Manage all listings on the platform</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, city…"
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Search</button>
        </form>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); setSelected([]); }}
              className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-700 bg-indigo-900/30 px-4 py-3">
          <span className="text-sm text-indigo-300 font-medium">{selected.length} selected</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bulkStatus.mutate('published')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">Publish</button>
            <button onClick={() => bulkStatus.mutate('draft')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-700 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">Set Draft</button>
            <button onClick={() => bulkStatus.mutate('archived')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50">Archive</button>
          </div>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-gray-400 hover:text-white transition-colors">Clear</button>
        </div>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-white transition-colors">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Host</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price/night</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : items.map((p: any) => {
                    const photo = p.photos?.[0];
                    return (
                      <tr key={p.id} className={cn('transition-colors', selected.includes(p.id) ? 'bg-indigo-900/20' : 'hover:bg-gray-800/50')}>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleOne(p.id)} className="text-gray-400 hover:text-white transition-colors">
                            {selected.includes(p.id) ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                              {photo
                                ? <img src={getUploadUrl(photo.url)} alt="" className="h-full w-full object-cover" />
                                : <div className="h-full w-full bg-gray-700" />}
                            </div>
                            <div>
                              <p className="font-medium text-white line-clamp-1">{p.title}</p>
                              <p className="text-xs text-gray-500">#{p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{p.host?.firstName} {p.host?.lastName}</td>
                        <td className="px-4 py-3 text-gray-300">{p.city}{p.country ? `, ${p.country}` : ''}</td>
                        <td className="px-4 py-3 text-gray-400 capitalize text-xs">{p.propertyType ?? p.type ?? '—'}</td>
                        <td className="px-4 py-3 text-white">EGP {p.pricePerNight?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-amber-400">{p.avgRating ? `★ ${Number(p.avgRating).toFixed(1)}` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-700 text-gray-400')}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {p.status !== 'published' && (
                              <button title="Publish" onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })} disabled={updateStatus.isPending} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/30 transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {p.status !== 'draft' && (
                              <button title="Set to draft" onClick={() => updateStatus.mutate({ id: p.id, status: 'draft' })} disabled={updateStatus.isPending} className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-900/30 transition-colors">
                                <FileEdit className="h-4 w-4" />
                              </button>
                            )}
                            {p.status !== 'archived' && (
                              <button title="Archive" onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })} disabled={updateStatus.isPending} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 transition-colors">
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
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
