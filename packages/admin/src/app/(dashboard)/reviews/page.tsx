'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Star, Trash2, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const RATING_FILTERS = [
  { value: 0, label: 'All' },
  { value: 5, label: '★ 5' },
  { value: 4, label: '★ 4' },
  { value: 3, label: '★ 3' },
  { value: 2, label: '★ 1-2' },
];

function StarRating({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('h-3 w-3', i <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
      ))}
      <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">{score.toFixed(1)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const qc = useQueryClient();

  const ratingParam = ratingFilter === 0 ? undefined : ratingFilter === 2 ? undefined : ratingFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reviews', page, search, ratingFilter],
    queryFn: () => adminApi.getReviews({ page, limit: 20, search: search || undefined, rating: ratingParam }),
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      setConfirmDeleteId(null);
      toast.success('Review deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete review'),
  });

  const flagReview = useMutation({
    mutationFn: ({ id, flagged }: { id: number; flagged: boolean }) => adminApi.flagReview(id, flagged),
    onSuccess: (_, { flagged }) => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success(flagged ? 'Review flagged' : 'Flag removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Action failed'),
  });

  const d = data as any;
  const allItems: any[] = d?.items ?? [];

  // Client-side fallback for "1-2 stars" which can't be cleanly expressed as a min server filter
  const items = ratingFilter === 2
    ? allItems.filter((r: any) => (r.overallRating ?? 0) < 3)
    : allItems;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All guest reviews</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reviewer, property…"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72"
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
                ratingFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reviewer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub-ratings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : (items ?? []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => r.guest?.id && router.push(`/users/${r.guest.id}`)} className="text-left hover:underline disabled:cursor-default" disabled={!r.guest?.id}>
                          <p className="font-medium text-gray-900 dark:text-white">{r.guest?.firstName} {r.guest?.lastName}</p>
                          <p className="text-xs text-gray-500">{r.guest?.email}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => r.property?.id && router.push(`/properties/${r.property.id}`)} className="text-left hover:underline disabled:cursor-default" disabled={!r.property?.id}>
                          <p className="text-gray-900 dark:text-white line-clamp-1">{r.property?.title ?? '—'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.property?.city}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating score={r.overallRating ?? 0} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        {r.cleanlinessRating != null && <div>Clean: {r.cleanlinessRating}</div>}
                        {r.accuracyRating != null && <div>Accuracy: {r.accuracyRating}</div>}
                        {r.communicationRating != null && <div>Comm: {r.communicationRating}</div>}
                        {r.locationRating != null && <div>Location: {r.locationRating}</div>}
                        {r.checkInRating != null && <div>Check-in: {r.checkInRating}</div>}
                        {r.valueRating != null && <div>Value: {r.valueRating}</div>}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{r.comment}</p>
                        {r.hostReply && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">Host: {r.hostReply}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => flagReview.mutate({ id: r.id, flagged: !r.isFlagged })}
                            disabled={flagReview.isPending}
                            title={r.isFlagged ? 'Remove flag' : 'Flag review'}
                            className={cn(
                              'rounded-lg p-1.5 transition-colors disabled:opacity-50',
                              r.isFlagged
                                ? 'text-amber-400 hover:bg-amber-900/30'
                                : 'text-gray-500 hover:text-amber-400 hover:bg-amber-900/30',
                            )}
                          >
                            <Flag className="h-4 w-4" />
                          </button>
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
                                className="rounded px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
        {(d?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{ratingFilter === 2 ? `${items.length} filtered` : `${d?.total ?? 0} total`} reviews</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
        </div>
        )}
      </div>
    </div>
  );
}
