'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Archive, Eye, FileEdit, CheckSquare, Square, X, MapPin, Users, Bed, Bath, Star, DollarSign, Calendar, Home, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── Property Detail Modal ───────────────────────────────────────────────── */

function PropertyDetailModal({ propertyId, onClose }: { propertyId: number; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-property-detail', propertyId],
    queryFn: () => adminApi.getPropertyDetail(propertyId),
    enabled: !!propertyId,
  });

  const p = data as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-gray-800/80 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="space-y-4 p-6 animate-pulse">
            <div className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="h-6 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Failed to load property</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">The backend may be unavailable. Try again later.</p>
          </div>
        ) : p ? (
          <div className="space-y-6">
            {/* Photos */}
            {(p.photos?.length ?? 0) > 0 && (
              <div className="flex gap-1 overflow-x-auto rounded-t-2xl">
                {p.photos.slice(0, 5).map((photo: any, i: number) => (
                  <img
                    key={photo.id ?? i}
                    src={getUploadUrl(photo.url)}
                    alt=""
                    className={cn('h-52 object-cover', i === 0 ? 'flex-[2]' : 'flex-1')}
                  />
                ))}
              </div>
            )}

            <div className="space-y-5 px-6 pb-6">
              {/* Title & Status */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{p.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.city}{p.country ? `, ${p.country}` : ''}
                    {p.address && <span className="text-gray-600">• {p.address}</span>}
                  </div>
                </div>
                <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                  {p.status}
                </span>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: DollarSign, label: 'Price/night', value: `EGP ${p.pricePerNight?.toLocaleString() ?? '—'}`, color: 'text-emerald-400' },
                  { icon: Star, label: 'Rating', value: p.avgRating ? `★ ${Number(p.avgRating).toFixed(1)} (${p.reviewCount ?? 0})` : 'No reviews', color: 'text-amber-400' },
                  { icon: Calendar, label: 'Bookings', value: p.bookingCount ?? p.totalBookings ?? '—', color: 'text-indigo-400' },
                  { icon: Home, label: 'Type', value: p.propertyType ?? p.type ?? '—', color: 'text-sky-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-3 text-center">
                    <item.icon className={cn('h-4 w-4 mx-auto mb-1', item.color)} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  { label: 'Host', value: p.host ? `${p.host.firstName} ${p.host.lastName}` : '—' },
                  { label: 'Host Email', value: p.host?.email ?? '—' },
                  { label: 'Max Guests', value: p.maxGuests ?? '—' },
                  { label: 'Bedrooms', value: p.bedrooms ?? '—' },
                  { label: 'Bathrooms', value: p.bathrooms ?? '—' },
                  { label: 'Min Stay', value: p.minStay ? `${p.minStay} nights` : '—' },
                  { label: 'Max Stay', value: p.maxStay ? `${p.maxStay} nights` : '—' },
                  { label: 'Instant Book', value: p.instantBooking ? 'Yes' : 'No' },
                  { label: 'Created', value: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—' },
                  { label: 'Updated', value: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {p.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{p.description}</p>
                </div>
              )}

              {/* Amenities */}
              {(p.amenities?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {p.amenities.map((a: any) => (
                      <span key={a.id ?? a.name} className="rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300">
                        {a.name ?? a.title ?? a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {p.houseRules && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">House Rules</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{p.houseRules}</p>
                </div>
              )}

              {/* Cancellation Policy */}
              {p.cancellationPolicy && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cancellation Policy</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{p.cancellationPolicy}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">Property not found.</div>
        )}
      </div>
    </div>
  );
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-900/50 text-emerald-400',
  draft: 'bg-amber-900/50 text-amber-400',
  archived: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const router = useRouter();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const qc = useQueryClient();

  const deleteProperty = useMutation({
    mutationFn: (id: number) => adminApi.deleteProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete property'),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-properties', page, statusFilter, search],
    queryFn: () => adminApi.getProperties({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' }) =>
      adminApi.updatePropertyStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      qc.invalidateQueries({ queryKey: ['admin-property-detail', id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update status'),
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
      <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load properties</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">The backend may be unavailable. Try refreshing the page.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all listings on the platform</p>
      </div>

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
        <div className="flex gap-1">
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

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-700 bg-indigo-900/30 px-4 py-3">
          <span className="text-sm text-indigo-300 font-medium">{selected.length} selected</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bulkStatus.mutate('published')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">Publish</button>
            <button onClick={() => bulkStatus.mutate('draft')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-700 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">Set Draft</button>
            <button onClick={() => bulkStatus.mutate('archived')} disabled={bulkStatus.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Archive</button>
          </div>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Clear</button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleAll} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
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
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : items.map((p: any) => {
                    const photo = p.photos?.[0];
                    return (
                      <tr key={p.id} className={cn('transition-colors cursor-pointer', selected.includes(p.id) ? 'bg-indigo-900/20' : 'hover:bg-gray-800/50')} onClick={() => setDetailId(p.id)}>
                        <td className="px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleOne(p.id); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {selected.includes(p.id) ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                              {photo
                                ? <img src={getUploadUrl(photo.url)} alt="" className="h-full w-full object-cover" />
                                : <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.title}</p>
                              <p className="text-xs text-gray-500">#{p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.host?.firstName} {p.host?.lastName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.city}{p.country ? `, ${p.country}` : ''}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize text-xs">{p.propertyType ?? p.type ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">EGP {p.pricePerNight?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-amber-400">{p.avgRating ? `★ ${Number(p.avgRating).toFixed(1)}` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button title="Open detail page" onClick={() => router.push(`/properties/${p.id}`)} className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-900/30 transition-colors">
                              <ExternalLink className="h-4 w-4" />
                            </button>
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
                              <button title="Archive" onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })} disabled={updateStatus.isPending} className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                            <button title="Delete property" onClick={() => setDeleteConfirmId(p.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/30 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
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

      {/* Property Detail Modal */}
      {detailId && <PropertyDetailModal propertyId={detailId} onClose={() => setDetailId(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Property</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action is <strong className="text-gray-900 dark:text-white">permanent</strong> and cannot be undone. All associated data will be removed.</p>
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setDeleteConfirmId(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => deleteProperty.mutate(deleteConfirmId)}
                disabled={deleteProperty.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteProperty.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
