import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react-native';
import { wishlistsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Wishlist } from '@/types';

export default function WishlistsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const {
    data: wishlists = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['wishlists'],
    queryFn: wishlistsApi.getWishlists,
    enabled: isLoggedIn,
  });

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Wishlists</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Heart size={48} color="#717171" />
          <Text className="text-lg font-semibold text-gray-900 mt-4">
            Log in to view your wishlists
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            You can create, view, and manage your wishlists once you have logged
            in.
          </Text>
          <Button
            title="Log in"
            onPress={() => router.push('/auth/login')}
            className="mt-6 w-full"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Wishlist card
  // ---------------------------------------------------------------------------
  const renderWishlistItem = ({ item }: { item: Wishlist }) => {
    const coverUrl =
      getImageUrl(item.coverPhoto) ??
      'https://via.placeholder.com/400x300?text=Wishlist';

    return (
      <TouchableOpacity activeOpacity={0.9} className="mb-6 px-6">
        <View className="rounded-xl overflow-hidden" style={{ height: 200 }}>
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
        <Text className="text-base font-semibold text-gray-900 mt-2">
          {item.name}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.itemCount} {item.itemCount === 1 ? 'saved' : 'saved'}
        </Text>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Wishlists</Text>
      </View>

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={wishlists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWishlistItem}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Heart size={48} color="#717171" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                Create your first wishlist
              </Text>
              <Text className="text-sm text-gray-500 mt-2 text-center">
                As you search, tap the heart icon to save your favorite places
                to a wishlist.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
