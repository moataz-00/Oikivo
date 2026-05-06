'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Receipt, CreditCard, Banknote, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

const paymentStatusConfig: Record<string, { icon: any; color: string; labelKey: string }> = {
  paid: { icon: CheckCircle2, color: 'text-green-600 bg-green-50', labelKey: 'statusPaid' },
  submitted: { icon: Clock, color: 'text-amber-600 bg-amber-50', labelKey: 'statusPending' },
  pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', labelKey: 'statusAwaitingPayment' },
  refunded: { icon: ArrowLeft, color: 'text-blue-600 bg-blue-50', labelKey: 'statusRefunded' },
  failed: { icon: XCircle, color: 'text-red-600 bg-red-50', labelKey: 'statusFailed' },
};

export default function PaymentHistoryPage() {
  const locale = useLocale();
  const t = useTranslations('account');
  const { formatPrice } = useCurrency();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: bookingsApi.getMyPaymentHistory,
  });

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/account`} className="rounded-full p-2 hover:bg-neutral-100 transition">
          {locale === 'ar' ? <ArrowRight className="h-5 w-5 text-neutral-700" /> : <ArrowLeft className="h-5 w-5 text-neutral-700" />}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('paymentHistory')}</h1>
          <p className="text-sm text-neutral-500">{t('paymentHistoryDesc')}</p>
        </div>
      </div>

      {(!payments || payments.length === 0) ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <Receipt className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">{t('noPayments')}</p>
          <p className="text-sm text-neutral-400 mt-1">{t('noPaymentsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((booking: any) => {
            const cfg = paymentStatusConfig[booking.paymentStatus as string] ?? paymentStatusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Link
                key={booking.id}
                href={`/${locale}/trips/${booking.bookingRef || booking.id}`}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition"
              >
                <div className={`rounded-xl p-2.5 ${cfg.color}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {booking.property?.title ?? `Booking #${booking.bookingRef}`}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {booking.checkIn} → {booking.checkOut}
                    {booking.paymentMethod && (
                      <span className="ms-2 inline-flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {booking.paymentMethod}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-bold text-neutral-900">
                    {formatPrice(booking.totalAmount, booking.currency)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(booking.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* Summary */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">{t('totalBookings')}</span>
              <span className="font-semibold text-neutral-900">{payments.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-neutral-600">{t('totalSpent')}</span>
              <span className="font-semibold text-neutral-900">
                {formatPrice(
                  payments.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
                  payments[0]?.currency ?? 'EGP'
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
