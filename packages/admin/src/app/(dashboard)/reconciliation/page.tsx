'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PieChart, Calendar, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('rounded-lg p-2', color)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function fmt(n: number) {
  return `EGP ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReconciliationPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-financial-reconciliation', fromDate, toDate],
    queryFn: () => adminApi.getFinancialAnalytics({ from: fromDate || undefined, to: toDate || undefined }),
  });

  const d = data as any;

  const propGross = d?.property?.grossRevenue ?? 0;
  const consultGross = d?.consultation?.grossRevenue ?? 0;
  const totalCollected = propGross + consultGross;

  const propFees = d?.property?.platformFees ?? 0;
  const consultFees = d?.consultation?.platformFees ?? 0;
  const totalPlatformFees = propFees + consultFees;

  const hostPayouts = d?.payouts?.hostPayouts ?? 0;
  const consultPayouts = d?.payouts?.consultantPayouts ?? 0;
  const totalPaidOut = hostPayouts + consultPayouts;

  const propRefunds = d?.property?.refunds ?? 0;
  const consultRefunds = d?.consultation?.refunds ?? 0;
  const totalRefunds = propRefunds + consultRefunds;

  const totalGatewayCosts = d?.profit?.totalGatewayCosts ?? 0;
  const totalPayoutCosts = d?.profit?.totalPayoutCosts ?? 0;
  const totalExpenses = d?.profit?.totalExpenses ?? 0;
  const netProfit = d?.profit?.netProfit ?? 0;

  const propByMethod = d?.property?.byPaymentMethod ?? {};
  const consultByMethod = d?.consultation?.byPaymentMethod ?? {};

  // Merge payment method breakdowns
  const allMethods = new Set([...Object.keys(propByMethod), ...Object.keys(consultByMethod)]);
  const methodBreakdown = [...allMethods].map((method) => {
    const p = propByMethod[method] ?? { count: 0, revenue: 0, gatewayFee: 0 };
    const c = consultByMethod[method] ?? { count: 0, revenue: 0, gatewayFee: 0 };
    return {
      method,
      count: p.count + c.count,
      revenue: p.revenue + c.revenue,
      gatewayFee: p.gatewayFee + c.gatewayFee,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reconciliation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total collected vs paid out vs platform earnings vs pending</p>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-gray-500" />
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white" />
        <span className="text-gray-500 text-xs">to</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Top-level KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Collected" value={fmt(totalCollected)} sub={`${d?.property?.paidBookings ?? 0} prop + ${d?.consultation?.paidBookings ?? 0} consult bookings`} icon={DollarSign} color="bg-emerald-900/30 text-emerald-400" />
            <StatCard label="Total Paid Out" value={fmt(totalPaidOut)} sub={`Hosts: ${fmt(hostPayouts)} · Consultants: ${fmt(consultPayouts)}`} icon={ArrowUpRight} color="bg-blue-900/30 text-blue-400" />
            <StatCard label="Total Refunds" value={fmt(totalRefunds)} sub={`${d?.property?.refundedBookings ?? 0} prop + ${d?.consultation?.refundedBookings ?? 0} consult refunds`} icon={ArrowDownRight} color="bg-red-900/30 text-red-400" />
            <StatCard label="Net Platform Profit" value={fmt(netProfit)} sub="After gateway fees, payout fees, expenses" icon={TrendingUp} color={netProfit >= 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'} />
          </div>

          {/* Profit breakdown */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Profit & Loss Breakdown</h2>
            <div className="space-y-2">
              {[
                { label: 'Platform Service Fees (Property)', value: propFees, positive: true },
                { label: 'Platform Service Fees (Consultations)', value: consultFees, positive: true },
                { label: 'Gateway Processing Costs', value: totalGatewayCosts, positive: false },
                { label: 'Payout Processing Costs', value: totalPayoutCosts, positive: false },
                { label: 'Operating Expenses', value: totalExpenses, positive: false },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{row.label}</span>
                  <span className={cn('text-sm font-medium', row.positive ? 'text-emerald-400' : 'text-red-400')}>
                    {row.positive ? '+' : '-'} {fmt(row.value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300 dark:border-gray-600">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Profit</span>
                <span className={cn('text-lg font-bold', netProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {fmt(netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue by payment method */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue by Payment Gateway</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Gateway</th>
                  <th className="px-5 py-3 text-right">Transactions</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">Gateway Fees</th>
                  <th className="px-5 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {methodBreakdown.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No transaction data</td></tr>
                ) : methodBreakdown.map((m) => (
                  <tr key={m.method} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white text-xs capitalize">{m.method}</td>
                    <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-300 text-xs">{m.count}</td>
                    <td className="px-5 py-3 text-right text-gray-900 dark:text-white text-xs font-medium">{fmt(m.revenue)}</td>
                    <td className="px-5 py-3 text-right text-red-400 text-xs">-{fmt(m.gatewayFee)}</td>
                    <td className="px-5 py-3 text-right text-emerald-400 text-xs font-medium">{fmt(m.revenue - m.gatewayFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly trend */}
          {(d?.monthly?.property?.length > 0 || d?.monthly?.consultation?.length > 0) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Revenue Trend</h2>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3">Month</th>
                    <th className="px-5 py-3 text-right">Prop Revenue</th>
                    <th className="px-5 py-3 text-right">Prop Fees</th>
                    <th className="px-5 py-3 text-right">Consult Revenue</th>
                    <th className="px-5 py-3 text-right">Consult Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(d?.monthly?.property ?? []).map((m: any) => {
                    const cm = (d?.monthly?.consultation ?? []).find((c: any) => c.month === m.month);
                    return (
                      <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-5 py-3 text-gray-900 dark:text-white text-xs font-medium">{m.month}</td>
                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-300 text-xs">{fmt(m.revenue)}</td>
                        <td className="px-5 py-3 text-right text-emerald-400 text-xs">{fmt(m.platformFees)}</td>
                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-300 text-xs">{fmt(cm?.revenue ?? 0)}</td>
                        <td className="px-5 py-3 text-right text-emerald-400 text-xs">{fmt(cm?.platformFees ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Top hosts & consultants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top 10 Hosts by Revenue</h2>
              <div className="space-y-2">
                {(d?.hosts?.topHosts ?? []).map((h: any, i: number) => (
                  <div key={h.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                      <div>
                        <p className="text-xs text-gray-900 dark:text-white font-medium">{h.name}</p>
                        <p className="text-xs text-gray-500">{h.properties} props · {h.bookings} bookings</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">{fmt(h.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top 10 Consultants by Revenue</h2>
              <div className="space-y-2">
                {(d?.consultants?.topConsultants ?? []).map((c: any, i: number) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                      <div>
                        <p className="text-xs text-gray-900 dark:text-white font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.bookings} bookings</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">{fmt(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
