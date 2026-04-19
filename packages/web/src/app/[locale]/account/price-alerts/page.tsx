'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Trash2, TrendingDown } from 'lucide-react';
import { priceAlertsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { useCurrency } from '@/hooks/useCurrency';
import Link from 'next/link';

export default function PriceAlertsPage() {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['price-alerts'],
    queryFn: () => priceAlertsApi.getMyAlerts(),
    enabled: isLoggedIn,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => priceAlertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      toast.success(t('alertDeleted') ?? 'Alert deleted');
    },
    onError: () => toast.error(t('deleteError') ?? 'Could not delete alert'),
  });

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <TrendingDown className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t('priceAlerts') ?? 'Price Alerts'}</h1>
          <p className="text-sm text-neutral-500">{t('priceAlertsDesc') ?? 'Get notified when prices drop on properties you\'re watching'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">💰</p>
          <h2 className="text-lg font-semibold text-neutral-900">{t('noPriceAlerts') ?? 'No price alerts'}</h2>
          <p className="text-sm text-neutral-500 mt-1">{t('noPriceAlertsDesc') ?? 'Set a target price on any property to get notified when the price drops.'}</p>
          <Link href={`/${locale}/s`} className="mt-4 inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition">
            {t('browseProperties') ?? 'Browse properties'}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-sm truncate">
                  {alert.property?.title ?? `Property #${alert.propertyId}`}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t('targetPrice') ?? 'Target'}: <span className="font-semibold text-green-700">{formatPrice(alert.targetPrice, 'EGP')}</span>
                  {alert.property?.price !== undefined && (
                    <span className="ml-2">
                      {t('currentPrice') ?? 'Current'}: {formatPrice(alert.property.price, 'EGP')}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(alert.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg p-2 bg-neutral-50 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                title="Delete alert"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
