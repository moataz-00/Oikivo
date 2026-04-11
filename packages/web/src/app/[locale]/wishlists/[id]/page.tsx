'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, Share, LayoutGrid, Star, Bed, Bath, Users, Maximize, Check, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { useCurrency } from '@/hooks/useCurrency';
import { getImageUrl } from '@/lib/utils';
import type { Property } from '@/types';

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
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const { formatPrice } = useCurrency();

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

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
        {wishlist.properties && wishlist.properties.length >= 2 && (
          <button
            onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              compareMode
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
        )}
        <button className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
          <Share className="h-4 w-4" />
          {t('shareList')}
        </button>
      </div>

      <p className="text-sm text-neutral-500 mb-8">
        {wishlist.count} {wishlist.count === 1 ? t('property') : t('properties')}
      </p>

      {wishlist.properties && wishlist.properties.length > 0 ? (
        <>
          {/* G7: Compare mode — select properties then show comparison table */}
          {compareMode && (
            <div className="mb-6">
              <p className="text-sm text-neutral-500 mb-3">
                Select 2–4 properties to compare ({selected.length}/4 selected)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {wishlist.properties.map((p: Property) => (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`relative rounded-xl border-2 p-2 text-left transition-all ${
                      selected.includes(p.id)
                        ? 'border-brand bg-brand/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {selected.includes(p.id) && (
                      <div className="absolute top-2 right-2 rounded-full bg-brand p-0.5 z-10">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 mb-2">
                      {p.images?.[0] && (
                        <img
                          src={getImageUrl(p.images[0].url)}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-neutral-900 truncate">{p.title}</p>
                  </button>
                ))}
              </div>

              {/* Comparison table */}
              {selected.length >= 2 && (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 bg-neutral-50 font-medium text-neutral-600 w-32">Feature</th>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return (
                            <th key={id} className="px-4 py-3 bg-neutral-50 text-center min-w-[150px]">
                              <p className="font-semibold text-neutral-900 truncate">{p.title}</p>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">Price/night</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return <td key={id} className="px-4 py-2.5 text-center font-semibold">{formatPrice(p.pricePerNight, p.currency)}</td>;
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">Rating</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return (
                            <td key={id} className="px-4 py-2.5 text-center">
                              {p.averageRating ? <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />{Number(p.averageRating).toFixed(1)}</span> : '—'}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">Bedrooms</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return <td key={id} className="px-4 py-2.5 text-center">{(p as any).bedrooms ?? '—'}</td>;
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">Bathrooms</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return <td key={id} className="px-4 py-2.5 text-center">{(p as any).bathrooms ?? '—'}</td>;
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">Max. guests</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return <td key={id} className="px-4 py-2.5 text-center">{p.maxGuests ?? '—'}</td>;
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">City</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return <td key={id} className="px-4 py-2.5 text-center">{(p as any).city ?? '—'}</td>;
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-neutral-600">Instant Book</td>
                        {selected.map((id) => {
                          const p = wishlist.properties.find((x: Property) => x.id === id)!;
                          return <td key={id} className="px-4 py-2.5 text-center">{(p as any).instantBook ? '⚡ Yes' : 'No'}</td>;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!compareMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {wishlist.properties.map((property: Property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </>
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
