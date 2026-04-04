'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, Share } from 'lucide-react';
import Link from 'next/link';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

export default function WishlistDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('wishlists');
  const { isLoggedIn, hasHydrated } = useAuth();
  const wishlistId = Number(params.id);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: wishlist, isLoading } = useWishlist(wishlistId);
  const removeFromWishlist = useRemoveFromWishlist();

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-neutral-500">{t('wishlistNotFound')}</p>
        <Link href={`/${locale}/wishlists`} className="text-brand underline mt-4 inline-block">
          {t('backToWishlists')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/wishlists`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 flex-1">{wishlist.name}</h1>
        <button className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
          <Share className="h-4 w-4" />
          {t('shareList')}
        </button>
      </div>

      <p className="text-sm text-neutral-500 mb-8">
        {wishlist.count} {wishlist.count === 1 ? t('property') : t('properties')}
      </p>

      {wishlist.properties && wishlist.properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {wishlist.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <p className="text-lg font-semibold text-neutral-700">{t('listEmpty')}</p>
          <p className="text-neutral-500">{t('emptyList')}</p>
          <Link
            href={`/${locale}/s`}
            className="mt-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            {t('startExploring')}
          </Link>
        </div>
      )}
    </div>
  );
}
