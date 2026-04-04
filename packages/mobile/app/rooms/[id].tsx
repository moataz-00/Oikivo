import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Heart,
  Share2,
  Star,
  MapPin,
  Check,
  X,
} from 'lucide-react-native';
import { addDays, format } from 'date-fns';
import { propertiesApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl, formatPrice, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StarRating } from '@/components/StarRating';
import type { Property, Review, PropertyPhoto } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const propertyId = parseInt(id!, 10);

  // Default check-in/checkout dates for the reserve button
  const defaultCheckIn = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const defaultCheckOut = useMemo(() => format(addDays(new Date(), 4), 'yyyy-MM-dd'), []);

  // ---------------------------------------------------------------------------
  // Fetch property
  // ---------------------------------------------------------------------------
  const {
    data: property,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.getProperty(propertyId),
    enabled: !isNaN(propertyId),
  });

  // ---------------------------------------------------------------------------
  // Fetch reviews
  // ---------------------------------------------------------------------------
  const { data: reviewsData } = useQuery({
    queryKey: ['propertyReviews', propertyId],
    queryFn: () => reviewsApi.getPropertyReviews(propertyId, 1, 5),
    enabled: !isNaN(propertyId),
  });

  const reviews = reviewsData?.data ?? [];

  // ---------------------------------------------------------------------------
  // Image gallery scroll handler
  // ---------------------------------------------------------------------------
  const handleImageScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      setCurrentImageIndex(index);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Share handler
  // ---------------------------------------------------------------------------
  const handleShare = useCallback(async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out "${property.title}" on Sakan!`,
      });
    } catch {
      // ignore
    }
  }, [property]);

  // ---------------------------------------------------------------------------
  // Reserve handler
  // ---------------------------------------------------------------------------
  const handleReserve = useCallback(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    router.push(
      `/booking/${propertyId}?checkIn=${defaultCheckIn}&checkOut=${defaultCheckOut}&guests=1`,
    );
  }, [isLoggedIn, router, propertyId, defaultCheckIn, defaultCheckOut]);

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <Spinner />
      </View>
    );
  }

  if (isError || !property) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500 text-base">
          Failed to load property.
        </Text>
        <Button
          title="Go back"
          variant="secondary"
          onPress={() => router.back()}
          className="mt-4"
        />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const photos: PropertyPhoto[] =
    property.photos?.length > 0
      ? property.photos
      : [{ id: 0, url: '', caption: '', displayOrder: 0, isCover: true }];

  const hostName = `${property.host.firstName} ${property.host.lastName}`;
  const hostAvatar = getImageUrl(property.host.avatarUrl);
  const descriptionTruncated =
    property.description && property.description.length > 200;
  const displayDescription = showFullDescription
    ? property.description
    : property.description?.substring(0, 200);

  const displayedAmenities = property.amenities.slice(0, 6);
  const totalAmenities = property.amenities.length;

  // ---------------------------------------------------------------------------
  // Separator component
  // ---------------------------------------------------------------------------
  const Separator = () => <View className="h-px bg-gray-200 mx-6 my-5" />;

  // ---------------------------------------------------------------------------
  // Review card
  // ---------------------------------------------------------------------------
  const ReviewCard = ({ review }: { review: Review }) => {
    const reviewerName = `${review.reviewer.firstName} ${review.reviewer.lastName}`;
    const reviewerAvatar = getImageUrl(review.reviewer.avatarUrl);

    return (
      <View className="mr-4 bg-white border border-gray-200 rounded-xl p-4" style={{ width: 280 }}>
        <View className="flex-row items-center mb-2">
          <Avatar uri={reviewerAvatar} name={reviewerName} size={36} />
          <View className="ml-2 flex-1">
            <Text className="text-sm font-semibold text-gray-900">
              {reviewerName}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
        <StarRating rating={review.overallRating} size={12} />
        {review.comment && (
          <Text className="text-sm text-gray-700 mt-2" numberOfLines={4}>
            {review.comment}
          </Text>
        )}
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ================================================================ */}
        {/* Image Gallery */}
        {/* ================================================================ */}
        <View style={{ height: IMAGE_HEIGHT }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
          >
            {photos.map((photo, index) => {
              const imgUrl =
                getImageUrl(photo.url) ??
                'https://via.placeholder.com/600x400?text=No+Image';
              return (
                <Image
                  key={photo.id || index}
                  source={{ uri: imgUrl }}
                  style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                  resizeMode="cover"
                />
              );
            })}
          </ScrollView>

          {/* Image dots */}
          {photos.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
              {photos.map((_, i) => (
                <View
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
                    i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="absolute left-4 bg-white/90 w-9 h-9 rounded-full items-center justify-center shadow-sm"
            style={{ top: insets.top + 8 }}
          >
            <ChevronLeft size={20} color="#222" />
          </TouchableOpacity>

          {/* Share + Heart */}
          <View
            className="absolute right-4 flex-row gap-2"
            style={{ top: insets.top + 8 }}
          >
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              className="bg-white/90 w-9 h-9 rounded-full items-center justify-center shadow-sm"
            >
              <Share2 size={18} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!isLoggedIn) router.push('/auth/login');
              }}
              activeOpacity={0.8}
              className="bg-white/90 w-9 h-9 rounded-full items-center justify-center shadow-sm"
            >
              <Heart size={18} color="#222" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================================ */}
        {/* Title & Rating */}
        {/* ================================================================ */}
        <View className="px-6 pt-5">
          <Text className="text-2xl font-bold text-gray-900">
            {property.title}
          </Text>
          <View className="flex-row items-center mt-2">
            {property.avgRating > 0 && (
              <>
                <Star size={14} color="#222" fill="#222" />
                <Text className="text-sm font-semibold text-gray-900 ml-1">
                  {property.avgRating.toFixed(1)}
                </Text>
                <Text className="text-sm text-gray-500 ml-1">
                  ({property.reviewCount}{' '}
                  {property.reviewCount === 1 ? 'review' : 'reviews'})
                </Text>
                <Text className="text-gray-400 mx-2">-</Text>
              </>
            )}
            <MapPin size={14} color="#717171" />
            <Text className="text-sm text-gray-500 ml-1">
              {property.city}, {property.country}
            </Text>
          </View>
        </View>

        <Separator />

        {/* ================================================================ */}
        {/* Host info */}
        {/* ================================================================ */}
        <TouchableOpacity
          onPress={() => router.push(`/profile/${property.host.id}`)}
          activeOpacity={0.8}
          className="flex-row items-center px-6"
        >
          <Avatar uri={hostAvatar} name={hostName} size={48} />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Hosted by {hostName}
            </Text>
            {property.host.isSuperhost && (
              <Badge
                label="Superhost"
                variant="superhost"
                className="mt-1"
              />
            )}
          </View>
        </TouchableOpacity>

        <Separator />

        {/* ================================================================ */}
        {/* Description */}
        {/* ================================================================ */}
        {property.description && (
          <>
            <View className="px-6">
              <Text className="text-base text-gray-700 leading-6">
                {displayDescription}
                {descriptionTruncated && !showFullDescription && '...'}
              </Text>
              {descriptionTruncated && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2"
                >
                  <Text className="text-base font-semibold underline text-gray-900">
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Separator />
          </>
        )}

        {/* ================================================================ */}
        {/* Amenities */}
        {/* ================================================================ */}
        {property.amenities.length > 0 && (
          <>
            <View className="px-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                What this place offers
              </Text>
              <View className="flex-row flex-wrap">
                {displayedAmenities.map((amenity) => (
                  <View
                    key={amenity.id}
                    className="flex-row items-center w-1/2 mb-4"
                  >
                    <Text className="text-lg mr-2">{amenity.icon}</Text>
                    <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                      {amenity.name}
                    </Text>
                  </View>
                ))}
              </View>
              {totalAmenities > 6 && (
                <Button
                  title={`Show all ${totalAmenities} amenities`}
                  variant="secondary"
                  size="md"
                  className="mt-2"
                  onPress={() => {
                    // Expand all amenities inline
                    setShowFullDescription(true);
                  }}
                />
              )}
            </View>
            <Separator />
          </>
        )}

        {/* ================================================================ */}
        {/* Reviews */}
        {/* ================================================================ */}
        <View className="px-6">
          <View className="flex-row items-center mb-4">
            <Star size={18} color="#222" fill="#222" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              {property.avgRating > 0
                ? property.avgRating.toFixed(1)
                : 'No reviews yet'}
            </Text>
            {property.reviewCount > 0 && (
              <Text className="text-lg text-gray-500 ml-1">
                - {property.reviewCount}{' '}
                {property.reviewCount === 1 ? 'review' : 'reviews'}
              </Text>
            )}
          </View>

          {reviews.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ScrollView>
          )}
        </View>

        <Separator />

        {/* ================================================================ */}
        {/* Location */}
        {/* ================================================================ */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Where you will be
          </Text>
          <View className="bg-gray-100 rounded-xl h-40 items-center justify-center">
            <MapPin size={32} color="#FF385C" />
            <Text className="text-sm text-gray-600 mt-2">
              {property.city}, {property.country}
            </Text>
          </View>
        </View>

        <Separator />

        {/* ================================================================ */}
        {/* House rules */}
        {/* ================================================================ */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            House rules
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-gray-700">
                Check-in: After {property.checkInAfter}
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-gray-700">
                Checkout: Before {property.checkOutBefore}
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-gray-700">
                Max guests: {property.maxGuests}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              {property.allowsPets ? (
                <Check size={16} color="#008A05" />
              ) : (
                <X size={16} color="#C13515" />
              )}
              <Text className="text-sm text-gray-700 ml-2">
                {property.allowsPets ? 'Pets allowed' : 'No pets'}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              {property.allowsSmoking ? (
                <Check size={16} color="#008A05" />
              ) : (
                <X size={16} color="#C13515" />
              )}
              <Text className="text-sm text-gray-700 ml-2">
                {property.allowsSmoking ? 'Smoking allowed' : 'No smoking'}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              {property.allowsParties ? (
                <Check size={16} color="#008A05" />
              ) : (
                <X size={16} color="#C13515" />
              )}
              <Text className="text-sm text-gray-700 ml-2">
                {property.allowsParties
                  ? 'Parties/events allowed'
                  : 'No parties or events'}
              </Text>
            </View>
            <View className="flex-row items-center">
              {property.allowsChildren ? (
                <Check size={16} color="#008A05" />
              ) : (
                <X size={16} color="#C13515" />
              )}
              <Text className="text-sm text-gray-700 ml-2">
                {property.allowsChildren
                  ? 'Children welcome'
                  : 'Not suitable for children'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================================================================ */}
      {/* Sticky bottom bar */}
      {/* ================================================================ */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 flex-row items-center justify-between"
        style={{ paddingBottom: insets.bottom + 8, paddingTop: 12 }}
      >
        <View>
          <Text className="text-base">
            <Text className="font-bold">
              {formatPrice(property.pricePerNight, property.currency)}
            </Text>
            <Text className="text-gray-500"> / night</Text>
          </Text>
          <Text className="text-xs text-gray-500 underline mt-0.5">
            {formatDate(defaultCheckIn, 'MMM d')} -{' '}
            {formatDate(defaultCheckOut, 'MMM d')}
          </Text>
        </View>

        <Button
          title="Reserve"
          onPress={handleReserve}
          size="lg"
          className="px-10"
        />
      </View>
    </View>
  );
}
