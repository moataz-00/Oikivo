'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Star, Flag } from 'lucide-react';
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

export default function AdminConsultationReviewsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-consultation-reviews', page],
    queryFn: () => adminApi.getConsultationReviews({ page, limit: 20 }),
  });

  const toggleHiddenMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleConsultationReviewHidden(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-consultation-reviews'] }),
  });

  const d = data as any;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Consultation Reviews</h1>
        <p className="text-sm text-gray-400 mt-1">
          Moderate consultant reviews — hide inappropriate content
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reviewer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
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
                    <tr
                      key={r.id}
                      className={cn(
                        'transition-colors',
                        r.isHidden ? 'opacity-50 hover:opacity-70' : 'hover:bg-gray-800/50',
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          {r.reviewer?.firstName} {r.reviewer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{r.reviewer?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300">{r.consultant?.displayName ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating value={r.rating} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 line-clamp-3 max-w-xs">{r.comment ?? '—'}</p>
                        {r.consultantReply && (
                          <p className="mt-1 text-xs text-gray-400 italic line-clamp-2">
                            Consultant: {r.consultantReply}
                          </p>
                        )}
                        {r.isFlagged && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-950 px-2 py-0.5 text-xs text-red-400">
                            <Flag className="h-3 w-3" /> Flagged
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.isHidden ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-950 px-2 py-0.5 text-xs text-green-400">
                            <Eye className="h-3 w-3" /> Visible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => toggleHiddenMutation.mutate(r.id)}
                            disabled={toggleHiddenMutation.isPending}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50',
                              r.isHidden
                                ? 'bg-green-900/40 text-green-400 hover:bg-green-900/70'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                            )}
                          >
                            {r.isHidden ? (
                              <><Eye className="h-3.5 w-3.5" /> Unhide</>
                            ) : (
                              <><EyeOff className="h-3.5 w-3.5" /> Hide</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(d?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page {page} of {d?.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:border-gray-500 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(d.totalPages, p + 1))}
                disabled={page >= (d?.totalPages ?? 1)}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:border-gray-500 disabled:opacity-40 transition"
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
