'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { propertiesApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { HostReviewCard } from '@/components/hosting/HostReviewCard';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';

export default function HostReviewsPage() {
  const t = useTranslations('hosting');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, hasHydrated, user } = useAuth();

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: properties = [] } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => propertiesApi.getMyProperties(),
    enabled: isLoggedIn,
  });

  // Fetch reviews for all host properties
  const { data: allReviews = [], isLoading } = useQuery({
    queryKey: ['host-reviews', properties.map((p: any) => p.id)],
    queryFn: async () => {
      const results = await Promise.all(
        properties.map((p: any) =>
          reviewsApi.getPropertyReviews(p.id, 1, 100).then((res) =>
            res.items.map((r: any) => ({ ...r, property: { id: p.id, title: p.title } })),
          ),
        ),
      );
      return results.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: properties.length > 0,
  });

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  const unreplied = allReviews.filter((r: any) => !r.hostReply);
  const replied = allReviews.filter((r: any) => r.hostReply);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <Star className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t('guestReviews') ?? 'Guest Reviews'}</h1>
          <p className="text-sm text-neutral-500">{t('guestReviewsDesc') ?? 'Read and reply to reviews from your guests'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : allReviews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">⭐</p>
          <h2 className="text-lg font-semibold text-neutral-900">{t('noReviewsYet') ?? 'No reviews yet'}</h2>
          <p className="text-sm text-neutral-500 mt-1">{t('noReviewsYetDesc') ?? 'Reviews from your guests will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {unreplied.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-amber-700 mb-4 flex items-center gap-2">
                💬 {t('awaitingReply') ?? 'Awaiting your reply'} ({unreplied.length})
              </h2>
              <div className="space-y-4">
                {unreplied.map((review: any) => (
                  <HostReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
          {replied.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-neutral-500 mb-4">
                ✅ {t('repliedReviews') ?? 'Replied'} ({replied.length})
              </h2>
              <div className="space-y-4">
                {replied.map((review: any) => (
                  <HostReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
