'use client';

import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistByToken } from '@/hooks/useWishlist';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Spinner } from '@/components/ui/Spinner';
import type { Property } from '@/types';

/**
 * Public shared wishlist view — accessible without authentication via a UUID token.
 * The backend endpoint GET /wishlists/share/:token requires no auth.
 */
export default function SharedWishlistPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('wishlists');
  const token = params.token as string;

  const { data: wishlist, isLoading, isError } = useWishlistByToken(token);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !wishlist) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <Heart className="h-14 w-14 text-neutral-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">{t('wishlistNotFound')}</h2>
        <p className="text-neutral-500 mb-6">{t('shareExpired')}</p>
        <Link
          href={`/${locale}/s`}
          className="inline-block rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          {t('startExploring')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 mb-3">
          <Heart className="h-3.5 w-3.5" />
          {t('sharedWishlist')}
        </div>
        <h1 className="text-3xl font-semibold text-neutral-900">{wishlist.name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {wishlist.count} {wishlist.count === 1 ? t('property') : t('properties')}
        </p>
      </div>

      {wishlist.properties && wishlist.properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {wishlist.properties.map((property: Property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <Heart className="h-12 w-12 text-neutral-200" />
          <p className="text-lg font-semibold text-neutral-700">{t('listEmpty')}</p>
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
