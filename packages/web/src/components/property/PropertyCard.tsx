'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, Star, ChevronLeft, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getImageUrl, formatRating, toFiniteNumber } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useCheckWishlisted, useAddToWishlist, useRemoveFromWishlist, useWishlists, useCreateWishlist } from '@/hooks/useWishlist';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Property } from '@/types';
import 'swiper/css';
import 'swiper/css/pagination';

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

export function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const locale = useLocale();
  const t = useTranslations('property');
  const tWL = useTranslations('wishlists');
  const { isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  const { data: wishlistStatus } = useCheckWishlisted(property.id);
  const { data: wishlists } = useWishlists();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const createWishlist = useCreateWishlist();

  const isWishlisted = wishlistStatus?.isWishlisted ?? false;
  const wishlistId = wishlistStatus?.wishlistId;
  const avgRatingValue = toFiniteNumber(property.avgRating);
  const avgRatingText = formatRating(property.avgRating);

  const isGuestFavourite = avgRatingValue !== null && avgRatingValue >= 4.8 && property.reviewCount >= 50;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = `/${locale}/login`;
      return;
    }
    if (isWishlisted && wishlistId) {
      removeFromWishlist.mutate({ wishlistId, propertyId: property.id });
    } else {
      setWishlistModalOpen(true);
    }
  };

  const handleAddToExistingList = (wlId: number) => {
    addToWishlist.mutate({ wishlistId: wlId, propertyId: property.id });
    setWishlistModalOpen(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;
    const wl = await createWishlist.mutateAsync(newListName.trim());
    addToWishlist.mutate({ wishlistId: wl.id, propertyId: property.id });
    setWishlistModalOpen(false);
    setNewListName('');
  };

  const images = property.images ?? [];

  return (
    <>
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Photo carousel */}
        <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-neutral-100">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true, dynamicBullets: true }}
            onSwiper={(s) => { swiperRef.current = s; }}
            loop={images.length > 1}
            className="h-full w-full"
          >
            {images.length > 0 ? (
              images.slice(0, 5).map((img, idx) => (
                <SwiperSlide key={img.id}>
                  <Link href={`/${locale}/rooms/${property.uuid || property.id}`} className="block h-full w-full">
                    <Image
                      src={getImageUrl(img.url)}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      priority={priority && idx === 0}
                      loading={priority && idx === 0 ? 'eager' : 'lazy'}
                    />
                  </Link>
                </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <Link href={`/${locale}/rooms/${property.uuid || property.id}`} className="block h-full w-full">
                  <div className="h-full w-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400 text-sm">{t('noPhoto')}</span>
                  </div>
                </Link>
              </SwiperSlide>
            )}
          </Swiper>

          {/* Nav arrows */}
          <AnimatePresence>
            {isHovered && images.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); swiperRef.current?.slidePrev(); }}
                  className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  <ChevronLeft className="h-4 w-4 text-neutral-800" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); swiperRef.current?.slideNext(); }}
                  className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  <ChevronRight className="h-4 w-4 text-neutral-800" />
                </motion.button>
              </>
            )}
          </AnimatePresence>

          {/* Wishlist heart */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleHeartClick}
            className="absolute top-3 right-3 z-10"
            aria-label={isWishlisted ? tWL('removeFromWishlist') : tWL('saveToWishlist')}
          >
            <Heart
              className={cn(
                'h-[22px] w-[22px] drop-shadow-md transition-all duration-200',
                isWishlisted
                  ? 'fill-neutral-900 text-neutral-900 scale-110'
                  : 'fill-black/25 text-white hover:fill-black/40'
              )}
            />
          </motion.button>

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {isGuestFavourite && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {t('guestFavourite')}
              </span>
            )}
            {property.instantBook && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                <Zap className="h-3 w-3 fill-white" />
                {t('instant')}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <Link href={`/${locale}/rooms/${property.uuid || property.id}`} className="block mt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-neutral-900 truncate leading-snug">
                {property.city}, {property.country}
              </p>
              <p className="text-sm text-neutral-500 truncate mt-0.5 leading-snug">{property.title}</p>
              {property.reviewCount > 0 && avgRatingText && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t('reviewCount', { count: property.reviewCount })}
                </p>
              )}
              {/* G19: Cancellation policy chip */}
              {property.cancellationPolicy && (
                <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  {t('policyLabel', { policy: property.cancellationPolicy.charAt(0).toUpperCase() + property.cancellationPolicy.slice(1) })}
                </p>
              )}
            </div>
            {avgRatingText !== null && (
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
                <span className="text-sm font-semibold text-neutral-900">{avgRatingText}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-[15px]">
            <>
              <span className="font-semibold text-neutral-900">{formatPrice(property.price, property.currency ?? 'EGP')}</span>
              <span className="text-neutral-500 font-normal"> / {t('perNight')}</span>
            </>
          </p>
        </Link>
      </div>

      {/* Wishlist modal */}
      <Modal open={wishlistModalOpen} onOpenChange={setWishlistModalOpen} title={tWL('saveToWishlist')} variant="centered">
        <div className="space-y-3">
          {wishlists && wishlists.length > 0 && (
            <>
              <p className="text-sm text-neutral-500">{tWL('chooseExistingList')}</p>
              {wishlists.map((wl) => (
                <button
                  key={wl.id}
                  onClick={() => handleAddToExistingList(wl.id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 p-3 hover:border-neutral-900 transition-colors text-left"
                >
                  <div className="h-12 w-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                    {wl.coverImage && (
                      <Image src={getImageUrl(wl.coverImage)} alt={wl.name} width={48} height={48} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{wl.name}</p>
                    <p className="text-xs text-neutral-500">{tWL('countSaved', { count: wl.count })}</p>
                  </div>
                </button>
              ))}
              <div className="flex items-center gap-2 my-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs text-neutral-400">{tWL('orCreateNew')}</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
            </>
          )}
          <input
            type="text"
            placeholder={tWL('listNamePlaceholder')}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={handleCreateAndAdd}
            disabled={!newListName.trim() || createWishlist.isPending}
            className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            {createWishlist.isPending ? tWL('creating') : tWL('createAndSave')}
          </button>
        </div>
      </Modal>
    </>
  );
}
