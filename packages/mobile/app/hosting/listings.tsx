import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, MapPin } from 'lucide-react-native';
import { propertiesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getImageUrl } from '@/lib/utils';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { PropertyListItem, PropertyStatus } from '@/types';

const PAGE_LIMIT = 20;

function statusBadge(status: PropertyStatus | undefined) {
  switch (status) {
    case 'published':
      return { label: 'Published', variant: 'success' as const };
    case 'pending_review':
      return { label: 'Under Review', variant: 'info' as const };
    case 'archived':
      return { label: 'Archived', variant: 'error' as const };
    default:
      return { label: 'Draft', variant: 'warning' as const };
  }
}

export default function HostingListingsScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['hostListings'],
    queryFn: ({ pageParam = 1 }) =>
      propertiesApi.getHostListings(pageParam as number, PAGE_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.flatMap((p) => p.data ?? []).length;
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: isHydrated && !!accessToken,
  });

  const listings = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---------------------------------------------------------------------------
  // Listing card
  // ---------------------------------------------------------------------------
  const renderListingCard = ({ item }: { item: PropertyListItem & { status?: PropertyStatus } }) => {
    const imageUrl =
      getImageUrl(item.coverPhoto) ??
      'https://via.placeholder.com/400x200?text=No+Image';
    const badge = statusBadge(item.status);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/hosting/listing/${item.id}/edit`)}
        activeOpacity={0.9}
        className="mb-4 mx-6 bg-white rounded-xl overflow-hidden border border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-base font-semibold text-gray-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Badge label={badge.label} variant={badge.variant} />
          </View>

          <View className="flex-row items-center mt-1">
            <MapPin size={14} color="#717171" />
            <Text className="text-sm text-gray-500 ml-1">
              {item.city}, {item.country}
            </Text>
          </View>

          <View className="flex-row items-center mt-2">
            <Text className="text-sm text-gray-600">
              {item.bedrooms} bed{item.bedrooms !== 1 ? 'rooms' : 'room'} -{' '}
              {item.maxGuests} guest{item.maxGuests !== 1 ? 's' : ''}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-base font-semibold text-gray-900">
              ${item.pricePerNight} / night
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/hosting/listing/${item.id}/calendar`)
              }
              className="px-3 py-1.5 rounded-lg bg-gray-100"
            >
              <Text className="text-xs font-medium text-gray-700">
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Your Listings"
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/hosting/listing/new')}
          >
            <Plus size={22} color="#4F46E5" />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderListingCard}
          onRefresh={refetch}
          refreshing={isRefetching}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No listings yet
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                Create your first listing to start welcoming guests on Oikivo.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/hosting/listing/new')}
                className="bg-brand rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold text-base">
                  Create a listing
                </Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

export default function HostingListingsScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const {
    data: listings = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['hostListings'],
    queryFn: propertiesApi.getHostListings,
    enabled: isHydrated && !!accessToken,
  });

  // ---------------------------------------------------------------------------
  // Listing card
  // ---------------------------------------------------------------------------
  const renderListingCard = ({ item }: { item: PropertyListItem }) => {
    const imageUrl =
      getImageUrl(item.coverPhoto) ??
      'https://via.placeholder.com/400x200?text=No+Image';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/hosting/listing/${item.id}/edit`)}
        activeOpacity={0.9}
        className="mb-4 mx-6 bg-white rounded-xl overflow-hidden border border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-base font-semibold text-gray-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Badge
              label={item.instantBook ? 'published' : 'draft'}
              variant={item.instantBook ? 'success' : 'warning'}
            />
          </View>

          <View className="flex-row items-center mt-1">
            <MapPin size={14} color="#717171" />
            <Text className="text-sm text-gray-500 ml-1">
              {item.city}, {item.country}
            </Text>
          </View>

          <View className="flex-row items-center mt-2">
            <Text className="text-sm text-gray-600">
              {item.bedrooms} bed{item.bedrooms !== 1 ? 'rooms' : 'room'} -{' '}
              {item.maxGuests} guest{item.maxGuests !== 1 ? 's' : ''}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-base font-semibold text-gray-900">
              ${item.pricePerNight} / night
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/hosting/listing/${item.id}/calendar`)
              }
              className="px-3 py-1.5 rounded-lg bg-gray-100"
            >
              <Text className="text-xs font-medium text-gray-700">
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Your Listings"
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/hosting/listing/new')}
          >
            <Plus size={22} color="#4F46E5" />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderListingCard}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No listings yet
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                Create your first listing to start welcoming guests on Oikivo.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/hosting/listing/new')}
                className="bg-brand rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold text-base">
                  Create a listing
                </Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
