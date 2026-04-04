'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  User,
  Home,
  AlertTriangle,
  ImageOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const QUEUE_TABS = [
  { value: 'draft', label: 'Pending Review', color: 'text-amber-400' },
  { value: 'published', label: 'Published', color: 'text-emerald-400' },
  { value: 'archived', label: 'Archived', color: 'text-gray-400' },
];

export default function ContentModerationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'draft' | 'published' | 'archived'>('draft');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-moderation', tab, page, search],
    queryFn: () =>
      adminApi.getProperties({ page, limit: 15, status: tab, search: search || undefined }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' }) =>
      adminApi.updatePropertyStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(
        status === 'published' ? 'Listing approved and published' :
        status === 'archived' ? 'Listing rejected and archived' :
        'Listing moved to draft',
      );
      setPreviewId(null);
      setRejectId(null);
      qc.invalidateQueries({ queryKey: ['admin-moderation'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Action failed'),
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];
  const previewProperty = items.find((p: any) => p.id === previewId);

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-white">Failed to load moderation queue</p>
        <p className="text-sm text-gray-400">The backend may be unavailable. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review property listings before they go public</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {QUEUE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value as any); setPage(1); }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.value
                ? `border-indigo-500 ${t.color}`
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        className="flex gap-2"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, city, host…"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <CheckCircle2 className="h-10 w-10 text-gray-700" />
          <p className="text-gray-400 font-medium">No listings in this queue</p>
          <p className="text-gray-600 text-sm">
            {tab === 'draft' ? 'No pending listings awaiting review.' : 'None found.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p: any) => {
            const coverImage = p.images?.[0] ?? null;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col"
              >
                {/* Cover image */}
                <div className="relative h-40 bg-gray-800">
                  {coverImage ? (
                    <img
                      src={getUploadUrl(coverImage)}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium border',
                      p.status === 'published' && 'bg-emerald-900/70 border-emerald-800/50 text-emerald-400',
                      p.status === 'draft' && 'bg-amber-900/70 border-amber-800/50 text-amber-400',
                      p.status === 'archived' && 'bg-gray-800 border-gray-700 text-gray-400',
                    )}
                  >
                    {p.status}
                  </span>
                  {p.images?.length > 1 && (
                    <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-gray-300">
                      +{p.images.length - 1} photos
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 p-4 space-y-2">
                  <h3 className="font-semibold text-white line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {p.city}{p.country ? `, ${p.country}` : ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <User className="h-3 w-3" />
                    {p.host?.firstName} {p.host?.lastName}
                    <span className="text-gray-600">·</span>
                    <span>{p.host?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Home className="h-3 w-3" />{p.propertyType ?? '—'}</span>
                    <span>{p.maxGuests ?? '—'} guests</span>
                    <span>EGP {Number(p.pricePerNight ?? 0).toLocaleString()}/night</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-800 p-3 flex gap-2">
                  <button
                    onClick={() => setPreviewId(previewId === p.id ? null : p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  {tab === 'draft' && (
                    <>
                      <button
                        onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                        disabled={updateStatus.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })}
                        disabled={updateStatus.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-800 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  {tab === 'published' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  )}
                  {tab === 'archived' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  )}
                </div>

                {/* Inline preview panel */}
                {previewId === p.id && (
                  <div className="border-t border-gray-700 bg-gray-950 p-4 text-sm space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Description</p>
                    <p className="text-gray-300 text-xs leading-relaxed line-clamp-6">
                      {p.description || <span className="text-gray-600 italic">No description provided</span>}
                    </p>
                    {p.amenities?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Amenities</p>
                        <div className="flex flex-wrap gap-1">
                          {p.amenities.map((a: any) => (
                            <span key={a.id ?? a} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300">
                              {a.name ?? a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.images?.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {p.images.slice(1).map((img: string, i: number) => (
                          <img
                            key={i}
                            src={getUploadUrl(img)}
                            alt=""
                            className="h-16 w-24 shrink-0 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{d?.total ?? 0} total listings</span>
        {d?.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-white">{page} / {d.totalPages}</span>
            <button
              disabled={page === d.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
