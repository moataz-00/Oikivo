'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Archive, Eye, FileEdit, CheckSquare, Square, X, MapPin, Star, Home, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── Confirm Modal ─────────────────────────────────────────────────────────── */
function ConfirmModal({
  title, message, confirmLabel, confirmClass, icon: Icon, onConfirm, onCancel, loading,
}: {
  title: string; message: React.ReactNode; confirmLabel: string; confirmClass: string;
  icon: React.ElementType; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-red-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={cn('flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50', confirmClass)}>
            <Icon className="h-4 w-4" />
            {loading ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-900/50 text-emerald-400',
  draft: 'bg-amber-900/50 text-amber-400',
  pending_review: 'bg-blue-900/50 text-blue-400',
  archived: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; uuid: string; title: string } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ id: number; uuid: string; title: string } | null>(null);

  const qc = useQueryClient();

  const deleteProperty = useMutation({
    mutationFn: (uuid: string) => adminApi.deletePropertyByUuid(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      setDeleteTarget(null);
      toast.success('Property deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete property'),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-properties', page, statusFilter, search],
    queryFn: () => adminApi.getProperties({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const updateStatus = useMutation({
    mutationFn: ({ uuid, status }: { uuid: string; status: 'draft' | 'published' | 'archived' | 'pending_review' }) =>
      adminApi.updatePropertyStatusByUuid(uuid, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      setArchiveTarget(null);
      toast.success(`Property set to ${status}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update status'),
  });

  const bulkStatus = useMutation({
    mutationFn: (status: 'draft' | 'published' | 'archived') =>
      adminApi.bulkPropertyStatus(selected, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      setSelected([]);
      toast.success('Bulk status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update'),
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
      <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load properties</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">The backend may be unavailable. Try refreshing the page.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage all listings · {d?.total ?? '—'} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, city…"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Search</button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); setSelected([]); }}
              className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-700 bg-indigo-900/30 px-4 py-3">
          <span className="text-sm text-indigo-300 font-medium">{selected.length} selected</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bulkStatus.mutate('published')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50">Publish</button>
            <button onClick={() => bulkStatus.mutate('draft')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-50">Set Draft</button>
            <button onClick={() => bulkStatus.mutate('archived')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50">Archive</button>
          </div>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleAll} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Host</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price/night</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Home className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">No properties found</p>
                      </div>
                    </td>
                  </tr>
                )
                : items.map((p: any) => {
                    const photo = p.photos?.[0];
                    const uuid = p.uuid;
                    return (
                      <tr
                        key={p.id}
                        className={cn('transition-colors cursor-pointer', selected.includes(p.id) ? 'bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50')}
                        onClick={() => uuid && router.push(`/properties/${uuid}`)}
                      >
                        <td className="px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleOne(p.id); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            {selected.includes(p.id) ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                              {photo
                                ? <img src={getUploadUrl(photo.url)} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                : <div className="h-full w-full flex items-center justify-center"><Home className="h-4 w-4 text-gray-400 dark:text-gray-600" /></div>}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[180px]">{p.title}{p.isFeatured ? ' ⭐' : ''}</p>
                              <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {p.host ? `${p.host.firstName} ${p.host.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            {[p.city, p.country].filter(Boolean).join(', ') || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 capitalize">
                          <div>{p.propertyKind ?? '—'}</div>
                          <div className="text-gray-400">{p.spaceType?.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                          {p.pricePerNight ? `EGP ${Number(p.pricePerNight).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-amber-400 text-sm">
                          {p.avgRating && Number(p.avgRating) > 0 ? `★ ${Number(p.avgRating).toFixed(1)}` : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button title="Open detail page" onClick={() => uuid && router.push(`/properties/${uuid}`)} className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-900/30 transition-colors">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            {p.status !== 'published' && uuid && (
                              <button title="Publish" onClick={() => updateStatus.mutate({ uuid, status: 'published' })} disabled={updateStatus.isPending} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/30 transition-colors disabled:opacity-40">
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {p.status !== 'draft' && uuid && (
                              <button title="Set to draft" onClick={() => updateStatus.mutate({ uuid, status: 'draft' })} disabled={updateStatus.isPending} className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-900/30 transition-colors disabled:opacity-40">
                                <FileEdit className="h-4 w-4" />
                              </button>
                            )}
                            {p.status !== 'archived' && uuid && (
                              <button title="Archive" onClick={() => setArchiveTarget({ id: p.id, uuid, title: p.title })} className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                            {uuid && (
                              <button title="Delete property" onClick={() => setDeleteTarget({ id: p.id, uuid, title: p.title })} className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/30 transition-colors">
                                <Trash2 className="h-4 w-4" />
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
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{d?.total} total properties</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Archive Confirm Modal */}
      {archiveTarget && (
        <ConfirmModal
          title="Archive Property"
          icon={Archive}
          message={<>Archive <strong className="text-gray-900 dark:text-white">"{archiveTarget.title}"</strong>? It will be hidden from guests but all data will be preserved.</>}
          confirmLabel="Archive"
          confirmClass="bg-gray-600 hover:bg-gray-500"
          loading={updateStatus.isPending}
          onConfirm={() => updateStatus.mutate({ uuid: archiveTarget.uuid, status: 'archived' })}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Property"
          icon={AlertTriangle}
          message={<>This will <strong className="text-red-400">permanently delete</strong> <strong className="text-gray-900 dark:text-white">"{deleteTarget.title}"</strong> and all associated data. This cannot be undone.</>}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          loading={deleteProperty.isPending}
          onConfirm={() => deleteProperty.mutate(deleteTarget.uuid)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

