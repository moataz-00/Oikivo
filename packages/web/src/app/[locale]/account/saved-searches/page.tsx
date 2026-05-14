'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Bell, BellOff, Trash2, MapPin } from 'lucide-react';
import { savedSearchesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function SavedSearchesPage() {
  const t = useTranslations('search');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: savedSearches = [], isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => savedSearchesApi.getAll(),
    enabled: isLoggedIn,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => savedSearchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success(t('searchDeleted'));
    },
    onError: () => toast.error(t('deleteError')),
  });

  const toggleAlertMutation = useMutation({
    mutationFn: (id: number) => savedSearchesApi.toggleAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success(t('alertToggled'));
    },
  });

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Search className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t('savedSearches')}</h1>
          <p className="text-sm text-neutral-500">{t('savedSearchesDesc')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : savedSearches.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold text-neutral-900">{t('noSavedSearches')}</h2>
          <p className="text-sm text-neutral-500 mt-1">{t('noSavedSearchesDesc')}</p>
          <Link
            href={`/${locale}/s`}
            className="mt-4 inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition"
          >
            {t('startSearching')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedSearches.map((search: any) => {
            const filters = search.filters ?? {};
            const filterParts = [
              filters.city,
              filters.minPrice ? t('minPriceFrom', { price: filters.minPrice }) : null,
              filters.guests ? t('guestsCount', { count: filters.guests }) : null,
            ].filter(Boolean);
            const filterLabel = filterParts.length > 0 ? filterParts.join(' · ') : t('allFilters');

            return (
              <div
                key={search.id}
                className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <MapPin className="h-5 w-5 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 text-sm truncate">{search.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{filterLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAlertMutation.mutate(search.id)}
                    className={`rounded-lg p-2 transition-colors ${
                      search.alertEnabled
                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
                    }`}
                    title={search.alertEnabled ? t('disableAlerts') : t('enableAlerts')}
                  >
                    {search.alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(search.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-2 bg-neutral-50 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title={t('deleteSearch')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
