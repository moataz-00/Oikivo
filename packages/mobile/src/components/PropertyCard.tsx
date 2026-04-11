import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Star } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl, formatPrice } from '@/lib/utils';
import type { PropertyListItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface PropertyCardProps {
  property: PropertyListItem;
  fullWidth?: boolean;
  onPress?: () => void;
}

export function PropertyCard({
  property,
  fullWidth = false,
  onPress,
}: PropertyCardProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const imageUrl =
    getImageUrl(property.coverPhoto) ??
    'https://via.placeholder.com/400x400?text=No+Image';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/rooms/${property.id}`);
    }
  };

  const handleFavorite = () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    // Wishlist toggle handled at a higher level or via wishlistsApi
  };

  const cardWidth = fullWidth ? SCREEN_WIDTH - 48 : CARD_WIDTH;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.95}
      style={{ width: cardWidth, marginBottom: 20 }}
    >
      {/* Image Container */}
      <View
        className="relative rounded-2xl overflow-hidden"
        style={{ aspectRatio: 1 }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Favorite Button */}
        <TouchableOpacity
          onPress={handleFavorite}
          activeOpacity={0.8}
          className="absolute top-2 right-2 w-8 h-8 items-center justify-center"
        >
          <Heart
            size={22}
            color="#fff"
            fill="transparent"
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Superhost Badge */}
        {property.isSuperhost ? (
          <View className="absolute top-2 left-2 bg-white rounded-full px-2 py-0.5">
            <Text className="text-xs font-semibold text-gray-800">
              Superhost
            </Text>
          </View>
        ) : null}
      </View>

      {/* Card Info */}
      <View className="mt-2 px-0.5">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-sm font-semibold text-gray-900 flex-1 mr-2"
            numberOfLines={1}
          >
            {property.city}, {property.country}
          </Text>

          {Number(property.avgRating) > 0 ? (
            <View className="flex-row items-center gap-0.5">
              <Star size={12} color="#222" fill="#222" />
              <Text className="text-sm text-gray-900">
                {Number(property.avgRating).toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
          {property.title}
        </Text>

        <Text className="text-sm text-gray-900 mt-1">
          <Text className="font-semibold">
            {formatPrice(property.pricePerNight, property.currency)}
          </Text>
          <Text className="text-gray-500"> / night</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}
