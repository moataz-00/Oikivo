'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Wallet, TrendingUp, Clock, CheckCircle2,
  ArrowDownToLine, ChevronRight, Banknote, BarChart3,
} from 'lucide-react';
import { payoutsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { cn, formatPrice } from '@/lib/utils';
import type { RequestPayoutPayload, EarningsResponse } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  available: 'text-emerald-700 bg-emerald-50',
  paid: 'text-gray-500 bg-gray-100',
  processing: 'text-blue-600 bg-blue-50',
  completed: 'text-emerald-700 bg-emerald-50',
  failed: 'text-red-600 bg-red-50',
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending:    'Requested',
  processing: 'Processing…',
  completed:  'Transferred ✓',
  failed:     'Failed',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex items-start gap-4">
      <div className={cn('rounded-xl p-2.5', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const t = useTranslations('hosting');
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold text-neutral-900 mb-4">{t('monthlyEarnings')}</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => {
          const height = Math.round((d.amount / max) * 100);
          const month = d.month.split('-')[1];
          const year = d.month.split('-')[0];
          const label = new Date(+year, +month - 1).toLocaleDateString('en', { month: 'short' });
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-neutral-400">
                {d.amount > 0 ? formatPrice(d.amount, 'EGP') : ''}
              </span>
              <div
                className="w-full rounded-t-md bg-indigo-600"
                style={{ height: `${Math.max(height, d.amount > 0 ? 4 : 2)}%` }}
              />
              <span className="text-xs text-neutral-500">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequestPayoutModal({
  maxAmount,
  onClose,
}: {
  maxAmount: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const t = useTranslations('hosting');
  const { register, handleSubmit, formState: { errors } } = useForm<RequestPayoutPayload>({
    defaultValues: { method: 'instapay' },
  });

  const mutation = useMutation({
    mutationFn: payoutsApi.requestPayout,
    onSuccess: () => {
      toast.success(t('payoutSubmitted'));
      qc.invalidateQueries({ queryKey: ['earnings'] });
      qc.invalidateQueries({ queryKey: ['payout-history'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t('payoutFailed'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-neutral-900">{t('requestPayout')}</h2>
        <p className="text-sm text-neutral-500 mt-1 mb-5">
          {t('availableBalanceLabel')}: <strong>{formatPrice(maxAmount, 'EGP')}</strong>
        </p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('amountLabel')}</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={maxAmount}
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 1, message: 'Minimum payout is EGP 1' },
                max: { value: maxAmount, message: `Maximum available: EGP ${maxAmount}` },
              })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('methodLabel')}</label>
            <select
              {...register('method', { required: true })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
            >
              <option value="instapay">InstaPay</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('accountDetailsLabel')}</label>
            <input
              type="text"
              placeholder={t('accountDetailsPlaceholder')}
              {...register('accountDetails', { required: 'Account details are required' })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            {errors.accountDetails && (
              <p className="text-red-500 text-xs mt-1">{errors.accountDetails.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('noteLabel')}</label>
            <input
              type="text"
              {...register('note')}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending || maxAmount <= 0}>
              {mutation.isPending ? <Spinner className="h-4 w-4" /> : t('submitRequest')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EarningsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, hasHydrated, isHost } = useAuth();
  const t = useTranslations('hosting');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data, isLoading } = useQuery<EarningsResponse>({
    queryKey: ['earnings'],
    queryFn: payoutsApi.getEarnings,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });

  const { data: payouts } = useQuery({
    queryKey: ['payout-history'],
    queryFn: payoutsApi.getPayoutHistory,
    enabled: isLoggedIn,
  });

  if (!hasHydrated || isLoading) return <FullPageSpinner />;

  const summary = data?.summary;
  const earnings = data?.earnings ?? [];
  const monthly = data?.monthly ?? [];

  return (
    <>
      {showModal && summary && (
        <RequestPayoutModal maxAmount={summary.available} onClose={() => setShowModal(false)} />
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{t('earningsTitle')}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t('earningsDesc')}</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            disabled={!summary || summary.available <= 0}
            className="flex items-center gap-2"
          >
            <ArrowDownToLine className="h-4 w-4" />
            {t('requestPayout')}
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Wallet} label={t('totalEarned')} value={formatPrice(summary?.total ?? 0, 'EGP')} color="bg-neutral-100 text-neutral-700" />
          <StatCard icon={CheckCircle2} label={t('availableBalance')} value={formatPrice(summary?.available ?? 0, 'EGP')} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Clock} label={t('pendingBalance')} value={formatPrice(summary?.pending ?? 0, 'EGP')} color="bg-amber-50 text-amber-600" />
          <StatCard icon={Banknote} label={t('paidOut')} value={formatPrice(summary?.paid ?? 0, 'EGP')} color="bg-gray-100 text-gray-600" />
        </div>

        {/* Commission note */}
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800 leading-relaxed">
          {t.rich('commissionNote', { strong: (chunks) => <strong>{chunks}</strong> })}
        </div>

        {/* Chart */}
        {monthly.length > 0 && <MonthlyChart data={monthly} />}

        {/* Per-property breakdown */}
        {earnings.length > 0 && (() => {
          const byProperty: Record<string, { title: string; total: number; count: number }> = {};
          for (const e of earnings) {
            const key = (e.booking as any)?.property?.title ?? `Booking #${e.bookingId}`;
            if (!byProperty[key]) byProperty[key] = { title: key, total: 0, count: 0 };
            byProperty[key].total += Number(e.amount);
            byProperty[key].count += 1;
          }
          const rows = Object.values(byProperty).sort((a, b) => b.total - a.total);
          const grandTotal = rows.reduce((s, r) => s + r.total, 0);
          return (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-neutral-500" />
                {t('revenueByProperty')}
              </h2>
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
                {rows.map((row) => {
                  const pct = grandTotal > 0 ? (row.total / grandTotal) * 100 : 0;
                  return (
                    <div key={row.title} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{row.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-400 shrink-0">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-neutral-900">{formatPrice(row.total, 'EGP')}</p>
                        <p className="text-xs text-neutral-400">{row.count} {row.count === 1 ? t('booking') : t('bookings')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Earnings list */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neutral-500" />
            {t('earningRecords')}
          </h2>
          {earnings.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
              <p className="text-neutral-500 text-sm">{t('noEarningsYet')}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {(e.booking as any)?.property?.title ?? `Booking #${e.bookingId}`}
                    </p>
                    <p className="text-xs text-neutral-400">{new Date(e.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[e.status])}>
                    {e.status}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 w-24 text-right shrink-0">
                    {formatPrice(e.amount, 'EGP')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout history */}
        {payouts && payouts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-neutral-500" />
              {t('payoutHistory')}
            </h2>
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">
                      {p.method.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-neutral-400">{p.accountDetails}</p>
                    <p className="text-xs text-neutral-400">
                      Requested: {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {p.processedAt && p.status === 'completed' && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Transferred: {new Date(p.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {p.status === 'pending' && (
                      <p className="text-xs text-amber-600">{t('pendingManualTransfer')}</p>
                    )}
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status])}>
                    {PAYOUT_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 w-24 text-right shrink-0">
                    {formatPrice(p.amount, 'EGP')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
