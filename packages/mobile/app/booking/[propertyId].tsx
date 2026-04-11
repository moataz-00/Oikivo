import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { propertiesApi, bookingsApi, priceApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  getImageUrl,
  formatPrice,
  formatDate,
  nightsBetween,
} from '@/lib/utils';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAlert } from '@/components/ui/AlertModal';
import { Minus, Plus } from 'lucide-react-native';

export default function BookingScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { alert, error: showError } = useAlert();
  const params = useLocalSearchParams<{
    propertyId: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>();

  const propertyId = parseInt(params.propertyId!, 10);

  // Default dates if not provided
  const defaultCheckIn = useMemo(
    () => format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    [],
  );
  const defaultCheckOut = useMemo(
    () => format(addDays(new Date(), 4), 'yyyy-MM-dd'),
    [],
  );

  const [checkIn] = useState(params.checkIn || defaultCheckIn);
  const [checkOut] = useState(params.checkOut || defaultCheckOut);
  const [guestsCount, setGuestsCount] = useState(
    parseInt(params.guests || '1', 10),
  );

  const nights = nightsBetween(checkIn, checkOut);

  // ---------------------------------------------------------------------------
  // Fetch property
  // ---------------------------------------------------------------------------
  const { data: property, isLoading: loadingProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.getProperty(propertyId),
    enabled: !isNaN(propertyId),
  });

  // ---------------------------------------------------------------------------
  // Fetch price breakdown
  // ---------------------------------------------------------------------------
  const { data: priceBreakdown, isLoading: loadingPrice } = useQuery({
    queryKey: ['priceBreakdown', propertyId, checkIn, checkOut, guestsCount],
    queryFn: () =>
      priceApi.getBreakdown({
        propertyId,
        checkIn,
        checkOut,
        guestsCount,
      }),
    enabled: !isNaN(propertyId) && nights > 0,
  });

  // ---------------------------------------------------------------------------
  // Create booking mutation
  // ---------------------------------------------------------------------------
  const createBookingMutation = useMutation({
    mutationFn: bookingsApi.createBooking,
    onSuccess: () => {
      alert({
        type: 'success',
        title: 'Booking Confirmed!',
        message: 'Your reservation has been successfully created.',
        buttons: [
          {
            text: 'View Trips',
            onPress: () => router.replace('/(tabs)/trips'),
          },
        ],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to create booking. Please try again.';
      showError('Booking Error', message);
    },
  });

  // ---------------------------------------------------------------------------
  // Confirm booking
  // ---------------------------------------------------------------------------
  const handleConfirm = useCallback(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    createBookingMutation.mutate({
      propertyId,
      checkIn,
      checkOut,
      guestsCount,
    });
  }, [isLoggedIn, router, propertyId, checkIn, checkOut, guestsCount, createBookingMutation]);

  // ---------------------------------------------------------------------------
  // Guest count controls
  // ---------------------------------------------------------------------------
  const maxGuests = property?.maxGuests ?? 10;

  const incrementGuests = () => {
    if (guestsCount < maxGuests) {
      setGuestsCount((prev) => prev + 1);
    }
  };

  const decrementGuests = () => {
    if (guestsCount > 1) {
      setGuestsCount((prev) => prev - 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loadingProperty) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Confirm booking" />
        <Spinner />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Confirm booking" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Property not found.</Text>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Price values (from API or local calculation)
  // ---------------------------------------------------------------------------
  const baseAmount =
    priceBreakdown?.baseAmount ?? property.pricePerNight * nights;
  const cleaningFee = priceBreakdown?.cleaningFee ?? property.cleaningFee ?? 0;
  const serviceFee =
    priceBreakdown?.serviceFee ??
    Math.round(baseAmount * (property.serviceFeePercent / 100));
  const taxes = priceBreakdown?.taxes ?? Math.round(baseAmount * 0.05);
  const total = priceBreakdown?.total ?? baseAmount + cleaningFee + serviceFee + taxes;
  const currency = priceBreakdown?.currency ?? property.currency;

  const coverPhoto =
    getImageUrl(
      property.photos?.[0]?.url ?? property.coverPhoto,
    ) ?? 'https://via.placeholder.com/200x120?text=No+Image';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Confirm booking" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ============================================================== */}
        {/* Property summary */}
        {/* ============================================================== */}
        <View className="flex-row items-center px-6 py-5 border-b border-gray-100">
          <Image
            source={{ uri: coverPhoto }}
            style={{ width: 100, height: 80, borderRadius: 8 }}
            resizeMode="cover"
          />
          <View className="flex-1 ml-4">
            <Text
              className="text-base font-semibold text-gray-900"
              numberOfLines={2}
            >
              {property.title}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {property.city}, {property.country}
            </Text>
          </View>
        </View>

        {/* ============================================================== */}
        {/* Dates */}
        {/* ============================================================== */}
        <View className="px-6 py-5 border-b border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Your trip
          </Text>

          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-sm font-medium text-gray-500">
                Check-in
              </Text>
              <Text className="text-base text-gray-900 mt-1">
                {formatDate(checkIn)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-medium text-gray-500">
                Checkout
              </Text>
              <Text className="text-base text-gray-900 mt-1">
                {formatDate(checkOut)}
              </Text>
            </View>
          </View>

          <Text className="text-sm text-gray-500">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </Text>
        </View>

        {/* ============================================================== */}
        {/* Guests */}
        {/* ============================================================== */}
        <View className="px-6 py-5 border-b border-gray-100">
          <Text className="text-sm font-medium text-gray-500 mb-2">
            Guests
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={decrementGuests}
              disabled={guestsCount <= 1}
              className={`w-10 h-10 rounded-full border items-center justify-center ${
                guestsCount <= 1
                  ? 'border-gray-200 opacity-40'
                  : 'border-gray-400'
              }`}
            >
              <Minus size={18} color="#222" />
            </TouchableOpacity>
            <Text className="mx-6 text-lg font-semibold text-gray-900 w-8 text-center">
              {guestsCount}
            </Text>
            <TouchableOpacity
              onPress={incrementGuests}
              disabled={guestsCount >= maxGuests}
              className={`w-10 h-10 rounded-full border items-center justify-center ${
                guestsCount >= maxGuests
                  ? 'border-gray-200 opacity-40'
                  : 'border-gray-400'
              }`}
            >
              <Plus size={18} color="#222" />
            </TouchableOpacity>
            <Text className="ml-4 text-sm text-gray-500">
              Max {maxGuests} guests
            </Text>
          </View>
        </View>

        {/* ============================================================== */}
        {/* Price breakdown */}
        {/* ============================================================== */}
        <View className="px-6 py-5">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Price details
          </Text>

          {loadingPrice ? (
            <View className="py-4">
              <Spinner size="small" />
            </View>
          ) : (
            <>
              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-gray-700">
                  {formatPrice(property.pricePerNight, currency)} x {nights}{' '}
                  {nights === 1 ? 'night' : 'nights'}
                </Text>
                <Text className="text-base text-gray-700">
                  {formatPrice(baseAmount, currency)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-gray-700">Cleaning fee</Text>
                <Text className="text-base text-gray-700">
                  {formatPrice(cleaningFee, currency)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-gray-700">Service fee</Text>
                <Text className="text-base text-gray-700">
                  {formatPrice(serviceFee, currency)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <Text className="text-base text-gray-700">Taxes</Text>
                <Text className="text-base text-gray-700">
                  {formatPrice(taxes, currency)}
                </Text>
              </View>

              <View className="h-px bg-gray-200 mb-4" />

              <View className="flex-row justify-between">
                <Text className="text-base font-bold text-gray-900">
                  Total
                </Text>
                <Text className="text-base font-bold text-gray-900">
                  {formatPrice(total, currency)}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ============================================================== */}
      {/* Confirm button */}
      {/* ============================================================== */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 pt-3 pb-8">
        <Button
          title="Confirm and reserve"
          onPress={handleConfirm}
          loading={createBookingMutation.isPending}
          disabled={nights <= 0}
          size="lg"
        />
      </View>
    </View>
  );
}
