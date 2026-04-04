import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, Star } from 'lucide-react-native';
import { searchApi, categoriesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { SearchBar } from '@/components/SearchBar';
import type { Category, PropertyListItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch categories
  // ---------------------------------------------------------------------------
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: 1000 * 60 * 10,
  });

  // ---------------------------------------------------------------------------
  // Fetch properties
  // ---------------------------------------------------------------------------
  const {
    data: propertiesResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['properties', 'home', selectedCategory],
    queryFn: () =>
      searchApi.searchProperties({
        categoryId: selectedCategory ?? undefined,
        limit: 20,
      }),
  });

  const properties = propertiesResponse?.data ?? [];

  // ---------------------------------------------------------------------------
  // Category row
  // ---------------------------------------------------------------------------
  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const isActive = selectedCategory === item.id;
      return (
        <TouchableOpacity
          onPress={() => setSelectedCategory(isActive ? null : item.id)}
          activeOpacity={0.8}
          className={`items-center px-4 py-2.5 rounded-full border ${
            isActive
              ? 'bg-gray-900 border-gray-900'
              : 'bg-white border-gray-200'
          }`}
        >
          <Text className="text-base mb-0.5">{item.icon}</Text>
          <Text
            className={`text-xs font-medium ${
              isActive ? 'text-white' : 'text-gray-700'
            }`}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategory],
  );

  // ---------------------------------------------------------------------------
  // Property card
  // ---------------------------------------------------------------------------
  const renderPropertyCard = useCallback(
    ({ item }: { item: PropertyListItem }) => {
      const imageUrl =
        getImageUrl(item.coverPhoto) ??
        'https://via.placeholder.com/400x300?text=No+Image';

      return (
        <TouchableOpacity
          onPress={() => router.push(`/rooms/${item.id}`)}
          activeOpacity={0.95}
          className="mb-6 px-6"
        >
          {/* Image */}
          <View
            className="relative rounded-xl overflow-hidden"
            style={{ height: SCREEN_WIDTH - 48 }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />

            {/* Heart button */}
            <TouchableOpacity
              onPress={() => {
                if (!isLoggedIn) {
                  router.push('/auth/login');
                }
              }}
              activeOpacity={0.8}
              className="absolute top-3 right-3 w-9 h-9 items-center justify-center"
            >
              <Heart
                size={24}
                color="#fff"
                fill="transparent"
                strokeWidth={2}
              />
            </TouchableOpacity>

            {/* Superhost badge */}
            {item.isSuperhost && (
              <View className="absolute top-3 left-3 bg-white rounded-full px-2.5 py-1">
                <Text className="text-xs font-semibold text-gray-800">
                  Superhost
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="mt-2.5">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[15px] font-semibold text-gray-900 flex-1"
                numberOfLines={1}
              >
                {item.city}, {item.country}
              </Text>
              {item.avgRating > 0 && (
                <View className="flex-row items-center ml-2">
                  <Star size={13} color="#222" fill="#222" />
                  <Text className="text-sm text-gray-900 ml-1">
                    {item.avgRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-sm text-gray-500 mt-0.5"
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <Text className="text-[15px] mt-1">
              <Text className="font-semibold">
                {formatPrice(item.pricePerNight, item.currency)}
              </Text>
              <Text className="text-gray-500"> / night</Text>
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [isLoggedIn, router],
  );

  // ---------------------------------------------------------------------------
  // List header (search bar + categories)
  // ---------------------------------------------------------------------------
  const ListHeader = useCallback(
    () => (
      <View>
        {/* Search bar */}
        <View className="mt-3 mb-4">
          <SearchBar />
        </View>

        {/* Category filter */}
        {categories.length > 0 && (
          <FlatList
            data={categories}
            keyExtractor={(c) => c.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            className="mb-4"
            renderItem={renderCategoryItem}
          />
        )}
      </View>
    ),
    [categories, renderCategoryItem],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Logo header */}
      <View className="px-6 pt-2 pb-1">
        <Text className="text-2xl font-bold text-brand">Sakan</Text>
      </View>

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPropertyCard}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FF385C"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-24">
              <Text className="text-gray-500 text-base">
                No properties found
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
