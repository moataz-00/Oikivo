'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AlertCircle, RefreshCw, User, Building2, Calendar, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function InstapayRefundsPendingPage() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-instapay-refunds-pending'],
    queryFn: () => adminApi.getInstapayRefundsPending(),
  });

  const markRefunded = useMutation({
    mutationFn: (id: number) => adminApi.markInstapayRefunded(id),
    onSuccess: () => {
      toast.success('Booking marked as refunded. Guest has been notified by email.');
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-instapay-refunds-pending'] });
    },
    onError: () => {
      toast.error('Failed to mark refund. Please try again.');
      setConfirmingId(null);
    },
  });

  const bookings = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">InstaPay Refunds Pending</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cancelled bookings paid via InstaPay that require a manual transfer back to the guest.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Alert banner */}
      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Action Required</p>
          <p className="text-sm text-amber-400/80 mt-0.5">
            Each entry below requires a manual InstaPay transfer to the guest's registered account.
            Mark as refunded in the booking record once the transfer is complete.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-indigo-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-center">
          <p className="text-red-400 font-medium">Failed to load data. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/40">
            <DollarSign className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">All clear!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No pending InstaPay refunds at the moment.</p>
        </div>
      )}

      {!isLoading && !isError && bookings.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Summary badge */}
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              {bookings.length} pending
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {bookings[0]?.currency ?? 'EGP'}{' '}
                {bookings
                  .reduce((sum: number, b: any) => sum + Number(b.totalAmount ?? 0), 0)
                  .toFixed(2)}
              </span>
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Guest</th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Stay Dates</th>
                <th className="px-5 py-3">Refund Amount</th>
                <th className="px-5 py-3">Cancelled</th>
                <th className="px-5 py-3">Ref / Note</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {bookings.map((b: any) => (
                <tr key={b.id} className="bg-white dark:bg-gray-900 hover:bg-gray-800/60 transition-colors">
                  {/* Booking ID */}
                  <td className="px-5 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                    <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-white">#{b.id}</span>
                  </td>

                  {/* Guest */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-900/60">
                        <User className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white leading-tight">
                          {b.guest?.firstName ?? ''} {b.guest?.lastName ?? ''}
                        </p>
                        <p className="text-xs text-gray-500">{b.guest?.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Property */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300 leading-tight max-w-[180px] truncate">
                        {b.property?.title ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Stay dates */}
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-600" />
                      <span>{formatDate(b.checkIn)}</span>
                      <span className="text-gray-600">→</span>
                      <span>{formatDate(b.checkOut)}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-4">
                    <span className="font-bold text-amber-400 text-base">
                      {b.currency ?? 'EGP'} {Number(b.totalAmount ?? 0).toFixed(2)}
                    </span>
                  </td>

                  {/* Cancelled at */}
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    {formatDate(b.cancelledAt)}
                    {b.cancelledBy && (
                      <span className="ml-1 rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-gray-500">
                        by {b.cancelledBy}
                      </span>
                    )}
                  </td>

                  {/* Payment reference / note */}
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-[180px]">
                    {b.paymentReference && (
                      <p className="font-mono text-gray-600 dark:text-gray-300 truncate">{b.paymentReference}</p>
                    )}
                    {b.paymentNote && (
                      <p className="text-gray-500 truncate mt-0.5">{b.paymentNote}</p>
                    )}
                    {!b.paymentReference && !b.paymentNote && <span>—</span>}
                  </td>

                  {/* Mark Refunded action */}
                  <td className="px-5 py-4">
                    {confirmingId === b.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markRefunded.mutate(b.id)}
                          disabled={markRefunded.isPending}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                        >
                          {markRefunded.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(b.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-900/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-600 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Refunded
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
