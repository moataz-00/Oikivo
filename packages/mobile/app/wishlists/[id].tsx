import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2 } from 'lucide-react-native';
import { wishlistsApi } from '@/lib/api';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Spinner } from '@/components/ui/Spinner';
import type { WishlistItem } from '@/types';

export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const wishlistId = parseInt(id!, 10);

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist', wishlistId],
    queryFn: () => wishlistsApi.getWishlist(wishlistId),
    enabled: !isNaN(wishlistId),
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: number) =>
      wishlistsApi.removeFromWishlist(wishlistId, propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist', wishlistId] });
      qc.invalidateQueries({ queryKey: ['wishlists'] });
    },
  });

  const items = wishlist?.items ?? [];

  const renderItem = ({ item }: { item: WishlistItem }) => {
    const p = item.property;
    const imageUrl =
      getImageUrl(p.coverPhoto) ??
      'https://via.placeholder.com/400x200?text=No+Image';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/rooms/${p.id}`)}
        activeOpacity={0.9}
        className="mb-5 mx-6 bg-white rounded-xl overflow-hidden border border-gray-100"
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-base font-semibold text-gray-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {p.city}, {p.country}
            </Text>
            {Number(p.avgRating) > 0 && (
              <View className="flex-row items-center">
                <Star size={13} color="#222" fill="#222" />
                <Text className="text-sm text-gray-900 ml-1">
                  {Number(p.avgRating).toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
            {p.title}
          </Text>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-[15px] font-semibold text-gray-900">
              {formatPrice(p.pricePerNight, p.currency)}{' '}
              <Text className="text-gray-500 font-normal">/ night</Text>
            </Text>
            <TouchableOpacity
              onPress={() => removeMutation.mutate(p.id)}
              hitSlop={8}
              className="p-1"
            >
              <Trash2 size={18} color="#C13515" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={wishlist?.name ?? 'Wishlist'} />

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Text className="text-base text-gray-500 text-center">
                No saved properties in this wishlist yet.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
