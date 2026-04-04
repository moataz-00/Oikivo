'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATING_FILTERS = [
  { value: 0, label: 'All' },
  { value: 5, label: '★ 5' },
  { value: 4, label: '★ 4+' },
  { value: 3, label: '★ 3+' },
  { value: 2, label: '★ 1-2' },
];

function StarRating({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('h-3 w-3', i <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
      ))}
      <span className="ml-1 text-xs text-gray-300">{score.toFixed(1)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reviews', page, search],
    queryFn: () => adminApi.getReviews({ page, limit: 20, search: search || undefined }),
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      setConfirmDeleteId(null);
    },
  });

  const d = data as any;
  const allItems: any[] = d?.items ?? [];

  const items = useMemo(() => {
    if (ratingFilter === 0) return allItems;
    if (ratingFilter === 2) return allItems.filter((r: any) => (r.overallRating ?? 0) < 3);
    return allItems.filter((r: any) => (r.overallRating ?? 0) >= ratingFilter);
  }, [allItems, ratingFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-sm text-gray-400 mt-1">All guest reviews</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reviewer, property…"
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Search</button>
        </form>
        <div className="flex gap-1">
          {RATING_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRatingFilter(f.value)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                ratingFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reviewer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sub-ratings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : (items ?? []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{r.guest?.firstName} {r.guest?.lastName}</p>
                        <p className="text-xs text-gray-500">{r.guest?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white line-clamp-1">{r.property?.title ?? '—'}</p>
                        <p className="text-xs text-gray-400">{r.property?.city}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating score={r.overallRating ?? 0} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 space-y-0.5">
                        {r.cleanlinessRating != null && <div>Clean: {r.cleanlinessRating}</div>}
                        {r.accuracyRating != null && <div>Accuracy: {r.accuracyRating}</div>}
                        {r.communicationRating != null && <div>Comm: {r.communicationRating}</div>}
                        {r.locationRating != null && <div>Location: {r.locationRating}</div>}
                        {r.checkInRating != null && <div>Check-in: {r.checkInRating}</div>}
                        {r.valueRating != null && <div>Value: {r.valueRating}</div>}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-gray-300 line-clamp-2">{r.comment}</p>
                        {r.hostReply && <p className="text-xs text-gray-400 mt-1 line-clamp-1">Host: {r.hostReply}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {confirmDeleteId === r.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteReview.mutate(r.id)}
                                disabled={deleteReview.isPending}
                                className="rounded px-2 py-1 text-xs font-medium bg-red-700 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(r.id)}
                              className="rounded p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
          <span>{d?.total ?? 0} total reviews</span>
          {d?.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
