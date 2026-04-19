'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, CalendarCheck, Users,
  Clock, BarChart3, Home, CheckCircle2,
  XCircle, AlertCircle, Banknote, Layers,
} from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { cn, formatPrice, getImageUrl } from '@/lib/utils';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex items-start gap-4">
      <div className={cn('rounded-xl p-2.5 shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 truncate">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Dual Bar Chart (revenue + bookings) ──────────────────────────────────────
function DualBarChart({
  data,
}: {
  data: Array<{ month: string; bookings: number; revenue: number }>;
}) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const maxBook = Math.max(...data.map((d) => d.bookings), 1);
  const t = useTranslations('hosting');

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900">Monthly Performance (12 months)</h3>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block" /> {t('revenue')}</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" /> {t('bookings')}</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-40 mt-2">
        {data.map((d) => {
          const revH = Math.round((d.revenue / maxRev) * 100);
          const bookH = Math.round((d.bookings / maxBook) * 100);
          const [, month] = d.month.split('-');
          const label = new Date(2000, Number(month) - 1).toLocaleDateString('en', { month: 'short' });
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5 group">
              <div className="relative w-full flex items-end justify-center gap-0.5" style={{ height: 128 }}>
                {/* revenue bar */}
                <div
                  className="w-[45%] rounded-t-md bg-indigo-600 transition-all duration-500 group-hover:opacity-80"
                  style={{ height: `${Math.max(revH, d.revenue > 0 ? 3 : 1)}%` }}
                  title={`EGP ${d.revenue.toLocaleString()}`}
                />
                {/* bookings bar */}
                <div
                  className="w-[45%] rounded-t-md bg-emerald-400 transition-all duration-500 group-hover:opacity-80"
                  style={{ height: `${Math.max(bookH, d.bookings > 0 ? 3 : 1)}%` }}
                  title={`${d.bookings} bookings`}
                />
              </div>
              <span className="text-[10px] text-neutral-400">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status Ring ──────────────────────────────────────────────────────────────
function StatusBreakdown({
  byStatus,
  total,
}: {
  byStatus: Record<string, number>;
  total: number;
}) {
  const t = useTranslations('hosting');
  const statuses = [
    { key: 'confirmed', label: 'Confirmed', color: 'bg-emerald-500', text: 'text-emerald-700' },
    { key: 'completed', label: 'Completed', color: 'bg-indigo-600', text: 'text-neutral-700' },
    { key: 'pending', label: 'Pending', color: 'bg-amber-400', text: 'text-amber-700' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400', text: 'text-red-700' },
    { key: 'declined', label: 'Declined', color: 'bg-neutral-300', text: 'text-neutral-600' },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold text-neutral-900 mb-4">{t('bookingStatus')}</h3>
      {total === 0 ? (
        <p className="text-sm text-neutral-400 py-6 text-center">No bookings yet</p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-4 w-full rounded-full overflow-hidden mb-4">
            {statuses.map(({ key, color }) => {
              const count = byStatus[key] ?? 0;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              return (
                <div key={key} className={cn(color, 'h-full')} style={{ width: `${pct}%` }} />
              );
            })}
          </div>
          <div className="space-y-2">
            {statuses.map(({ key, label, color, text }) => {
              const count = byStatus[key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', color)} />
                    <span className="text-neutral-600">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('font-medium', text)}>{count}</span>
                    <span className="text-xs text-neutral-400 w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Revenue Breakdown ────────────────────────────────────────────────────────
function RevenueBreakdown({
  base,
  cleaning,
  total,
}: {
  base: number;
  cleaning: number;
  total: number;
}) {
  const t = useTranslations('hosting');
  const items = [
    { label: 'Base rent', amount: base, color: 'bg-indigo-600' },
    { label: 'Cleaning fees', amount: cleaning, color: 'bg-neutral-500' },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold text-neutral-900 mb-4">{t('revenueBreakdown')}</h3>
      {total === 0 ? (
        <p className="text-sm text-neutral-400 py-6 text-center">No revenue yet</p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-4 w-full rounded-full overflow-hidden mb-4">
            {items.map(({ label, amount, color }) => {
              const pct = (amount / total) * 100;
              if (pct === 0) return null;
              return <div key={label} className={cn(color, 'h-full')} style={{ width: `${pct}%` }} />;
            })}
          </div>
          <div className="space-y-2.5">
            {items.map(({ label, amount, color }) => {
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', color)} />
                    <span className="text-neutral-600">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-neutral-900">{formatPrice(amount, 'EGP')}</span>
                    <span className="text-xs text-neutral-400 w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-900">Total</span>
            <span className="text-sm font-bold text-neutral-900">{formatPrice(total, 'EGP')}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HostAnalyticsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, isHost, hasHydrated } = useAuth();
  const t = useTranslations('hosting');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (!isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, locale, router]);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['host-analytics'],
    queryFn: bookingsApi.getHostAnalytics,
    enabled: hasHydrated && isLoggedIn && isHost,
    staleTime: 5 * 60 * 1000,
  });

  if (!hasHydrated || !isLoggedIn || !isHost) return <FullPageSpinner />;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t('analyticsTitle')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('analyticsDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/hosting/earnings`}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Earnings & Payouts
          </Link>
          <Link
            href={`/${locale}/hosting/reservations`}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            View Reservations
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !analytics ? (
        <div className="text-center py-20 text-neutral-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No analytics data available yet.</p>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* ── KPI Grid ── */}
          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {
                icon: DollarSign,
                label: 'Your Earnings',
                value: formatPrice(analytics.totals.revenue, 'EGP'),
                sub: 'Your share (excl. platform fees)',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: TrendingUp,
                label: 'This Month',
                value: formatPrice(analytics.totals.thisMonthRevenue, 'EGP'),
                sub: `${analytics.totals.thisMonthBookings} booking${analytics.totals.thisMonthBookings !== 1 ? 's' : ''}`,
                color: 'bg-neutral-100 text-neutral-700',
              },
              {
                icon: CalendarCheck,
                label: 'Total Bookings',
                value: analytics.totals.bookings,
                sub: `${analytics.totals.byStatus.confirmed ?? 0} confirmed`,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: CheckCircle2,
                label: 'Completion Rate',
                value: `${analytics.totals.completionRate}%`,
                sub: `${analytics.totals.byStatus.completed ?? 0} completed`,
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: Banknote,
                label: 'Avg. Booking Value',
                value: formatPrice(analytics.totals.avgBookingValue, 'EGP'),
                sub: 'Per confirmed / completed booking',
                color: 'bg-neutral-100 text-neutral-700',
              },
              {
                icon: Home,
                label: 'Total Nights Hosted',
                value: analytics.totals.nights,
                sub: `Across all bookings`,
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: AlertCircle,
                label: 'Pending',
                value: analytics.totals.byStatus.pending ?? 0,
                sub: 'Awaiting confirmation',
                color: 'bg-orange-50 text-orange-500',
              },
              {
                icon: XCircle,
                label: 'Cancelled',
                value: (analytics.totals.byStatus.cancelled ?? 0) + (analytics.totals.byStatus.declined ?? 0),
                sub: 'Cancelled or declined',
                color: 'bg-red-50 text-red-500',
              },
            ].map((kpi) => (
              <motion.div key={kpi.label} variants={fadeUp}>
                <KpiCard {...kpi} />
              </motion.div>
            ))}
          </motion.div>

          {/* ── Charts row ── */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DualBarChart data={analytics.monthly} />
            </div>
            <StatusBreakdown
              byStatus={analytics.totals.byStatus}
              total={analytics.totals.bookings}
            />
          </motion.div>

          {/* ── Revenue breakdown ── */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueBreakdown
              base={analytics.totals.baseRevenue}
              cleaning={analytics.totals.cleaningFees}
              total={analytics.totals.revenue}
            />

            {/* Top metrics */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-semibold text-neutral-900 mb-4">Revenue Metrics</h3>
              {[
                { label: 'Total base rent earned', value: formatPrice(analytics.totals.baseRevenue, 'EGP'), icon: Banknote, color: 'bg-neutral-100 text-neutral-700' },
                { label: 'Cleaning fees collected', value: formatPrice(analytics.totals.cleaningFees, 'EGP'), icon: Layers, color: 'bg-neutral-100 text-neutral-600' },
                { label: 'Total nights booked', value: `${analytics.totals.nights} nights`, icon: Clock, color: 'bg-amber-50 text-amber-600' },
                { label: 'Avg. nights per booking', value: analytics.totals.bookings > 0 ? `${(analytics.totals.nights / analytics.totals.bookings).toFixed(1)} nights` : '—', icon: Users, color: 'bg-teal-50 text-teal-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-neutral-600">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Per-property breakdown ── */}
          {analytics.byProperty.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">Performance by Listing</h3>
                  <span className="text-xs text-neutral-400">{analytics.byProperty.length} listing{analytics.byProperty.length > 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-neutral-50">
                  {analytics.byProperty.map((row, idx) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors"
                    >
                      {/* Position */}
                      <span className="text-xl font-bold text-neutral-200 w-6 shrink-0 text-center">
                        {idx + 1}
                      </span>

                      {/* Property image */}
                      <div className="relative h-11 w-14 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                        {row.image ? (
                          <Image
                            src={getImageUrl(row.image)}
                            alt={row.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-lg">🏠</div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{row.title}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{row.bookings} booking{row.bookings !== 1 ? 's' : ''} · {row.nights} night{row.nights !== 1 ? 's' : ''}</p>
                        {(row as any).impressions > 0 && (
                          <p className="text-xs text-neutral-400">
                            {(row as any).impressions.toLocaleString()} impression{(row as any).impressions !== 1 ? 's' : ''}
                            {(row as any).views > 0 ? (
                              <span className="ml-1 text-blue-500 font-medium">
                                · {(((row as any).views / (row as any).impressions) * 100).toFixed(1)}% CTR
                              </span>
                            ) : null}
                          </p>
                        )}
                        {(row as any).views != null && (
                          <p className="text-xs text-neutral-400">
                            {(row as any).views.toLocaleString()} view{(row as any).views !== 1 ? 's' : ''}
                            {(row as any).views > 0 ? (
                              <span className="ml-1 text-indigo-500 font-medium">
                                · {((row.bookings / (row as any).views) * 100).toFixed(1)}% booking conv.
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>

                      {/* Revenue */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-neutral-900">{formatPrice(row.revenue, 'EGP')}</p>
                        <p className="text-xs text-neutral-400">
                          {analytics.totals.revenue > 0 ? `${Math.round((row.revenue / analytics.totals.revenue) * 100)}% of total` : '—'}
                        </p>
                      </div>

                      {/* Revenue bar */}
                      <div className="hidden sm:block w-20 h-1.5 rounded-full bg-neutral-100 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${analytics.totals.revenue > 0 ? (row.revenue / analytics.totals.revenue) * 100 : 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
