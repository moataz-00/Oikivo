import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getImageUrl, formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Booking } from '@/types';

const BADGE_VARIANT_MAP: Record<
  string,
  'success' | 'warning' | 'error' | 'info'
> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'error',
  declined: 'error',
};

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const router = useRouter();

  const coverPhoto = booking.property.photos?.[0]?.url;
  const imageUrl =
    getImageUrl(coverPhoto) ??
    'https://via.placeholder.com/400x200?text=No+Image';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/rooms/${booking.propertyId}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="mb-4 bg-white rounded-xl overflow-hidden border border-gray-100"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: 180 }}
        resizeMode="cover"
      />
      <View className="p-4">
        {/* Title + Status */}
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className="text-base font-semibold text-gray-900 flex-1 mr-2"
            numberOfLines={1}
          >
            {booking.property.title}
          </Text>
          <Badge
            label={booking.status}
            variant={BADGE_VARIANT_MAP[booking.status] ?? 'info'}
          />
        </View>

        {/* Location */}
        <Text className="text-sm text-gray-500">
          {booking.property.city}, {booking.property.country}
        </Text>

        {/* Dates */}
        <Text className="text-sm text-gray-600 mt-2">
          {formatDate(booking.checkIn, 'MMM d')} -{' '}
          {formatDate(booking.checkOut, 'MMM d, yyyy')}
        </Text>

        {/* Guests + Nights */}
        <View className="flex-row items-center mt-1">
          <Text className="text-sm text-gray-500">
            {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
          </Text>
          <Text className="text-gray-400 mx-1.5">-</Text>
          <Text className="text-sm text-gray-500">
            {booking.guestsCount}{' '}
            {booking.guestsCount === 1 ? 'guest' : 'guests'}
          </Text>
        </View>

        {/* Price */}
        <Text className="text-base font-semibold text-gray-900 mt-2">
          {formatPrice(booking.totalAmount, booking.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
