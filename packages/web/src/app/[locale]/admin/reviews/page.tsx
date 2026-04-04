'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn('h-3 w-3', i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-600')}
        />
      ))}
      <span className="ml-1 text-xs text-gray-400">{value?.toFixed(1)}</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page],
    queryFn: () => adminApi.getReviews({ page, limit: 20 }),
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteId(null);
    },
  });

  const d = data as any;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-sm text-gray-400 mt-1">Moderate all guest reviews</p>
      </div>

      {/* Table */}
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
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (d?.items ?? []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          {r.reviewer?.firstName} {r.reviewer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{r.reviewer?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 line-clamp-1">{r.property?.title ?? '—'}</p>
                        <p className="text-xs text-gray-500">{r.property?.city}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating value={r.overallRating} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-xs text-gray-400">
                          {r.cleanlinessRating && <div>Clean: {r.cleanlinessRating}</div>}
                          {r.accuracyRating && <div>Accuracy: {r.accuracyRating}</div>}
                          {r.communicationRating && <div>Comm: {r.communicationRating}</div>}
                          {r.locationRating && <div>Location: {r.locationRating}</div>}
                          {r.valueRating && <div>Value: {r.valueRating}</div>}
                          {r.checkinRating && <div>Check-in: {r.checkinRating}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 line-clamp-3 max-w-xs">{r.comment}</p>
                        {r.hostReply && (
                          <p className="mt-1 text-xs text-gray-400 italic line-clamp-2">
                            Host: {r.hostReply}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {deleteId === r.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Delete?</span>
                              <button
                                onClick={() => deleteReview.mutate(r.id)}
                                disabled={deleteReview.isPending}
                                className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              title="Delete review"
                              onClick={() => setDeleteId(r.id)}
                              className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
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

        {d?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{d?.total} total reviews</span>
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
