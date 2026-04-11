'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Share2,
  Heart,
  MapPin,
  ShieldCheck,
  Award,
  ChevronLeft,
  Check,
  Copy,
  Facebook,
  Twitter,
  Send,
  Calendar,
  Clock,
  Banknote,
  Tag,
} from 'lucide-react';
import { PhotoGallery } from '@/components/property/PhotoGallery';
import { BookingWidget } from '@/components/property/BookingWidget';
import { DateRangePicker } from '@/components/property/DateRangePicker';
import { ReviewCard } from '@/components/property/ReviewCard';
import { StarRating } from '@/components/property/StarRating';
import { AmenitiesGrid } from '@/components/property/AmenitiesGrid';
import { AvailabilityCalendar } from '@/components/property/AvailabilityCalendar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { Separator } from '@/components/ui/Separator';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import { FadeIn, SlideIn, FloatIn, ScaleIn } from '@/components/ui/Motion';
import { propertiesApi, reviewsApi, messagesApi } from '@/lib/api';
import { getAvatarUrl, formatDate, formatRating, toFiniteNumber } from '@/lib/utils';
import { ContactHostModal } from '@/components/ui/ContactHostModal';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import type { ReviewStats } from '@/types';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/map/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-100 rounded-2xl flex items-center justify-center"><Spinner /></div>,
});

export default function PropertyDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const uuid = params.id as string;
  const t = useTranslations('property');
  const tCommon = useTranslations('common');

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [showMobileBooking, setShowMobileBooking] = useState(false);
  // Lifted date state — shared between the body calendar and the sidebar/mobile widget
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();

  const copyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', uuid],
    queryFn: () => propertiesApi.getPropertyByUuid(uuid),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000,      // cache for 5 min — property data rarely changes
    gcTime: 10 * 60 * 1000,        // keep in cache for 10 min
    refetchOnWindowFocus: false,    // no refetch on tab switch
  });

  const propertyId = property?.id;

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: () => reviewsApi.getPropertyReviews(propertyId!, 1, 100),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: reviewStatsData } = useQuery<ReviewStats>({
    queryKey: ['reviewStats', propertyId],
    queryFn: () => reviewsApi.getReviewStats(propertyId!),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  /* G16: Track recently viewed */
  const { trackView } = useRecentlyViewed();
  useEffect(() => {
    if (property) trackView(property);
  }, [property?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <FullPageSpinner />;

  if (error || !property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-neutral-500">Property not found.</p>
        <Link href={`/${locale}`} className="text-brand underline mt-4 inline-block">
          {tCommon('goHome')}
        </Link>
      </div>
    );
  }

  const avgRatingValue = toFiniteNumber(property.avgRating);
  const avgRatingText = formatRating(property.avgRating);

  const reviews = reviewsData?.items ?? [];
  const reviewStats = reviewStatsData ?? null;

  const spaceLabel: Record<string, string> = {
    entire_place: t('entirePlace'),
    private_room: t('privateRoom'),
    shared_room: t('sharedRoom'),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button (mobile) */}
      <Link
        href={`/${locale}/s`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-4 sm:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
        {tCommon('back')}
      </Link>

      {/* Title */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-2xl font-semibold text-neutral-900 leading-snug flex-1">
          {property.title}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors underline"
          >
            <Share2 className="h-4 w-4" />
            {t('shareWishlist')}
          </button>
        </div>
      </div>

      {/* Rating + location */}
      <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
        {avgRatingText !== null && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-neutral-900 text-neutral-900" />
            <span className="font-semibold">{avgRatingText}</span>
            <span className="text-neutral-500">·</span>
            <button className="text-neutral-700 underline hover:text-neutral-900">
              {property.reviewCount} {property.reviewCount === 1 ? t('review') : t('reviews')}
            </button>
          </div>
        )}
        {property.host?.isSuperhost && (
          <>
            <span className="text-neutral-400">·</span>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-brand" />
              <span className="font-medium">{t('superhost')}</span>
            </div>
          </>
        )}
        <span className="text-neutral-400">·</span>
        <button className="flex items-center gap-1 text-neutral-700 underline hover:text-neutral-900">
          <MapPin className="h-3.5 w-3.5" />
          {property.city}, {property.country}
        </button>
      </div>

      {/* Photo gallery */}
      <PhotoGallery images={property.images ?? []} title={property.title} />

      {/* Main content + sidebar */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: main info */}
        <FadeIn className="lg:col-span-2 space-y-8" delay={0.1}>
          {/* Space info */}
          <div className="flex items-start justify-between pb-8 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {spaceLabel[property.spaceType] ?? ''} {t('hostedBy', { name: property.host?.firstName })}
              </h2>
              <p className="text-neutral-500 mt-1">
                {property.maxGuests} {t('guests')} ·{' '}
                {property.bedrooms} {property.bedrooms === 1 ? t('bedroom') : t('bedrooms')} ·{' '}
                {property.beds} {property.beds === 1 ? t('bed') : t('beds')} ·{' '}
                {property.bathrooms} {property.bathrooms === 1 ? t('bathroom') : t('bathrooms')}
              </p>
            </div>
            <Avatar
              src={property.host?.avatarUrl ?? property.host?.avatar}
              firstName={property.host?.firstName}
              lastName={property.host?.lastName}
              size="lg"
            />
          </div>

          {/* Guest favourite badge */}
          {avgRatingValue !== null && avgRatingValue >= 4.8 && property.reviewCount >= 50 && (
            <ScaleIn>
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <div>
                <Star className="h-8 w-8 fill-brand text-brand" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">{t('guestFavourite')}</p>
                <p className="text-sm text-neutral-500">
                  {t('guestFavouriteDesc')}
                </p>
              </div>
              <div className="ml-auto text-center">
                <p className="text-2xl font-semibold text-neutral-900">{avgRatingText}</p>
                <StarRating rating={avgRatingValue ?? 0} size="sm" />
                <p className="text-xs text-neutral-500 mt-0.5">{t('reviewCount', { count: property.reviewCount })}</p>
              </div>
            </div>
            </ScaleIn>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">{t('description')}</h2>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line font-light">
              {property.description}
            </p>
          </div>

          <Separator />

          {/* Amenities */}
          <AmenitiesGrid amenities={property.amenities ?? []} />

          <Separator />

          {/* Date range picker — controlled, synced with booking widget */}
          <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {t('minNightsStay', { count: property.minNights })}
                </h2>
                {checkIn && checkOut && (
                  <button
                    onClick={() => setShowMobileBooking(true)}
                    className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors lg:hidden"
                  >
                    {t('bookTheseDates')}
                  </button>
                )}
              </div>
              <p className="text-sm text-neutral-500 mb-5">
                {t('selectDatesHint')}
              </p>
              <DateRangePicker
                propertyId={property.id}
                checkIn={checkIn}
                checkOut={checkOut}
                onSelect={(range) => {
                  setCheckIn(range.from);
                  setCheckOut(range.to);
                }}
                minNights={property.minNights}
              />
          </div>

          <Separator />

          {/* Availability overview */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">{t('availability')}</h2>
            <p className="text-sm text-neutral-500 mb-5">{t('availabilityDesc')}</p>
            <AvailabilityCalendar propertyId={property.id} />
          </div>

          {/* Reviews */}
          <div>
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-6">
              <Star className="h-5 w-5 fill-violet-500 text-violet-500" />
              <h2 className="text-xl font-semibold text-neutral-900">
                {reviews.length > 0
                  ? `${avgRatingText ?? '-'} · ${property.reviewCount} ${property.reviewCount === 1 ? t('review') : t('reviews')}`
                  : t('reviews')}
              </h2>
            </div>

            {reviews.length > 0 && (
              <>
                {/* Rating breakdown */}
                {reviewStats && (
                  <div className="rounded-2xl border border-indigo-50 bg-indigo-50/30 p-5 mb-8">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {[
                        { label: t('cleanliness'), value: reviewStats.cleanliness },
                        { label: t('accuracy'), value: reviewStats.accuracy },
                        { label: t('checkInRating'), value: reviewStats.checkIn },
                        { label: t('communication'), value: reviewStats.communication },
                        { label: t('locationRating'), value: reviewStats.location },
                        { label: t('value'), value: reviewStats.value },
                      ].filter(s => s.value > 0).map(({ label, value }, i) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <span className="text-sm text-neutral-600">{label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(value / 5) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-indigo-700 w-6 text-right">
                              {Number(value).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.slice(0, showAllReviews ? reviews.length : 6).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>

                {!showAllReviews && reviews.length > 6 && (
                  <button
                    onClick={() => setShowAllReviews(true)}
                    className="mt-6 rounded-xl border border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    {t('showAllReviews').replace('{count}', String(property.reviewCount))}
                  </button>
                )}
              </>
            )}

            {reviews.length === 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 py-10 px-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                    <Star className="h-7 w-7 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1">{t('noReviews')}</h3>
                <p className="text-sm text-neutral-500">{t('beFirstToReview')}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Map */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t('location')}</h2>
            <div className="h-64 rounded-2xl overflow-hidden">
              <MapView
                properties={[property]}
                center={{ lat: property.lat, lng: property.lng }}
                zoom={14}
              />
            </div>
            <p className="mt-3 text-sm text-neutral-500">{property.address}</p>
          </div>

          <Separator />

          {/* Host card */}
          {property.host && (
            <div>
              <div className="flex items-center gap-4 mb-5">
                <Link href={`/${locale}/profile/${property.host.profileUuid ?? property.host.id}`} className="rounded-full ring-2 ring-transparent hover:ring-brand transition-all">
                  <Avatar
                    src={property.host.avatarUrl ?? property.host.avatar}
                    firstName={property.host.firstName}
                    lastName={property.host.lastName}
                    size="xl"
                  />
                </Link>
                <div>
                  <Link href={`/${locale}/profile/${property.host.profileUuid ?? property.host.id}`} className="hover:underline">
                    <h2 className="text-xl font-semibold text-neutral-900">
                      {t('hostedBy', { name: `${property.host.firstName} ${property.host.lastName}` })}
                    </h2>
                  </Link>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {property.host.joinedAt
                      ? t('joinedIn', { year: new Date(property.host.joinedAt).getFullYear() })
                      : null}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm mb-5">
                {property.host.reviewCount !== undefined && property.host.reviewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-neutral-900 text-neutral-900" />
                    <span>{t('hostReviewCount', { count: property.host.reviewCount })}</span>
                  </div>
                )}
                {property.host.isIdentityVerified && (
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-neutral-600" />
                    <span>{t('identityVerified')}</span>
                  </div>
                )}
                {property.host.isSuperhost && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-brand" />
                    <span className="font-medium">{t('superhost')}</span>
                  </div>
                )}
              </div>

              {property.host.bio && (
                <p className="text-neutral-700 font-light leading-relaxed mb-5">
                  {property.host.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setContactOpen(true)}
                  className="rounded-xl border border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  {t('contactHost')}
                </button>
                <Link
                  href={`/${locale}/profile/${property.host.profileUuid ?? property.host.id}`}
                  className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
                >
                  {t('viewProfile')}
                </Link>
              </div>
              <ContactHostModal
                open={contactOpen}
                onOpenChange={setContactOpen}
                host={property.host}
                propertyId={property.id}
                listingTitle={property.title}
              />
            </div>
          )}

          {/* House rules */}
          {(property.houseRules || property.allowsSmoking !== undefined) && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t('houseRules')}</h2>

                {/* Boolean rule indicators */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {property.allowsSmoking === false && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">🚭 {t('noSmoking')}</span>
                  )}
                  {property.allowsParties === false && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">🎉 {t('noParties')}</span>
                  )}
                  {property.allowsChildren && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">👶 {t('suitableForChildren')}</span>
                  )}
                </div>

                {/* Text-based rules as chips */}
                {property.houseRules && typeof property.houseRules === 'string' && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.houseRules.split('\n').filter(Boolean).map((rule: string) => (
                      <span key={rule} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
                        {rule}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700">
                  {property.checkInTime && (
                    <div>
                      <p className="font-medium">
                        {t('checkInLabel')}
                      </p>
                      <p className="text-neutral-500">{property.checkInTime}</p>
                    </div>
                  )}
                  {property.checkOutTime && (
                    <div>
                      <p className="font-medium">
                        {t('checkOutLabel')}
                      </p>
                      <p className="text-neutral-500">{property.checkOutTime}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Cancellation */}
          {(() => {
            const policy = property.cancellationPolicy || 'flexible';
            const policyLabel = policy.charAt(0).toUpperCase() + policy.slice(1);
            const policyDetails: Record<string, { free: string; partial: string; none: string }> = {
              flexible: {
                free: t('flexFree'),
                partial: t('flexPartial'),
                none: t('flexNone'),
              },
              moderate: {
                free: t('modFree'),
                partial: t('modPartial'),
                none: t('modNone'),
              },
              strict: {
                free: t('strictFree'),
                partial: t('strictPartial'),
                none: t('strictNone'),
              },
            };
            const details = policyDetails[policy] ?? policyDetails.flexible;
            return (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t('cancellationPolicy')}</h2>
                  <p className="text-lg font-medium text-neutral-900 mb-3">{policyLabel}</p>
                  <ul className="space-y-2.5 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {details.free}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {details.partial}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {details.none}
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-neutral-400">{t('feesNonRefundable')}</p>
                </div>
              </>
            );
          })()}
        </FadeIn>

        {/* Right: booking widget */}
        <SlideIn className="hidden lg:block" direction="right" delay={0.2}>
          <BookingWidget
            property={property}
            checkIn={checkIn}
            checkOut={checkOut}
            onDatesChange={(from, to) => { setCheckIn(from); setCheckOut(to); }}
          />
        </SlideIn>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 bg-white/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between lg:hidden">
        <div>
          <p className="font-semibold text-neutral-900">
            {property.currency ?? 'EGP'} {property.price.toLocaleString()}{' '}
            <span className="font-light text-neutral-500">{t('perNightLabel')}</span>
          </p>
              {checkIn && checkOut ? (
                <p className="text-xs text-indigo-600 font-medium">
                  {t('nightsSelected', { count: Math.abs(Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)) })}
                </p>
              ) : avgRatingText !== null ? (
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
                  <span className="text-xs">{avgRatingText}</span>
                </div>
              ) : null}
        </div>
        <button
            onClick={() => setShowMobileBooking(true)}
            className="btn-brand rounded-xl px-6 py-3 text-sm font-semibold text-white">
          {checkIn && checkOut ? t('reserve') : t('selectDates')}
        </button>
      </div>

      {/* Mobile booking overlay */}
      {showMobileBooking && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileBooking(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-center mb-3">
              <div className="h-1 w-10 rounded-full bg-neutral-200" />
            </div>
            <BookingWidget
              property={property}
              checkIn={checkIn}
              checkOut={checkOut}
              onDatesChange={(from, to) => { setCheckIn(from); setCheckOut(to); }}
            />
          </div>
        </div>
      )}

      {/* Share modal */}
      <Modal
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={t('shareThisPlace')}
        variant="centered"
        className="max-w-sm"
      >
        <div className="space-y-3">
          {/* Copy link */}
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:border-neutral-900 transition-colors text-left group"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 group-hover:bg-neutral-200 transition-colors shrink-0">
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-neutral-700" />}
            </span>
            <div>
              <p className="font-medium text-neutral-900 text-sm">{copied ? t('linkCopied') : t('copyLink')}</p>
              <p className="text-xs text-neutral-500 truncate max-w-[200px]">{typeof window !== 'undefined' ? window.location.href : ''}</p>
            </div>
          </button>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent((property?.title ?? '') + '\n' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:border-green-500 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 shrink-0">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-green-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </span>
            <span className="font-medium text-neutral-900 text-sm">WhatsApp</span>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:border-blue-500 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 shrink-0">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-blue-600"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </span>
            <span className="font-medium text-neutral-900 text-sm">Facebook</span>
          </a>

          {/* X / Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(property?.title ?? '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:border-neutral-900 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 shrink-0">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-neutral-900"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </span>
            <span className="font-medium text-neutral-900 text-sm">X (Twitter)</span>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(property?.title ?? '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:border-sky-500 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 shrink-0">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-sky-500"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </span>
            <span className="font-medium text-neutral-900 text-sm">Telegram</span>
          </a>
        </div>
      </Modal>

      {/* All reviews modal removed — reviews now expand inline */}
    </div>
  );
}
