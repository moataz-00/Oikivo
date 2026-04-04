import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Shield,
  Calendar,
} from 'lucide-react-native';
import { usersApi, reviewsApi, searchApi } from '@/lib/api';
import { getImageUrl, formatDate, formatPrice } from '@/lib/utils';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/Button';
import type { User, PropertyListItem } from '@/types';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = parseInt(id!, 10);

  // ---------------------------------------------------------------------------
  // Fetch user profile
  // ---------------------------------------------------------------------------
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: () => usersApi.getPublicProfile(userId),
    enabled: !isNaN(userId),
  });

  // ---------------------------------------------------------------------------
  // Fetch user's listings (if they are a host)
  // ---------------------------------------------------------------------------
  const { data: listingsData } = useQuery({
    queryKey: ['userListings', userId],
    queryFn: () =>
      searchApi.searchProperties({ query: undefined, limit: 10 }),
    enabled: !isNaN(userId) && !!profile?.isHost,
  });

  const listings = listingsData?.data ?? [];

  // ---------------------------------------------------------------------------
  // Loading / Error
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Profile" />
        <Spinner />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Profile" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-base">
            Failed to load profile.
          </Text>
          <Button
            title="Go back"
            variant="secondary"
            onPress={() => router.back()}
            className="mt-4"
          />
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const avatarUri = getImageUrl(profile.avatarUrl);
  const memberSince = formatDate(profile.createdAt, 'MMMM yyyy');

  // ---------------------------------------------------------------------------
  // Listing card (horizontal)
  // ---------------------------------------------------------------------------
  const renderListingCard = ({ item }: { item: PropertyListItem }) => {
    const imageUrl =
      getImageUrl(item.coverPhoto) ??
      'https://via.placeholder.com/200x120?text=No+Image';

    return (
      <View
        className="mr-4 bg-white border border-gray-200 rounded-xl overflow-hidden"
        style={{ width: 240 }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 140 }}
          resizeMode="cover"
        />
        <View className="p-3">
          <Text
            className="text-sm font-semibold text-gray-900"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color="#717171" />
            <Text className="text-xs text-gray-500 ml-1">
              {item.city}, {item.country}
            </Text>
          </View>
          {item.avgRating > 0 && (
            <View className="flex-row items-center mt-1">
              <Star size={11} color="#222" fill="#222" />
              <Text className="text-xs text-gray-900 ml-1">
                {item.avgRating.toFixed(1)}
              </Text>
              <Text className="text-xs text-gray-500 ml-1">
                ({item.reviewCount})
              </Text>
            </View>
          )}
          <Text className="text-sm font-semibold text-gray-900 mt-1">
            {formatPrice(item.pricePerNight, item.currency)}{' '}
            <Text className="text-xs text-gray-500 font-normal">/ night</Text>
          </Text>
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile header */}
        <View className="items-center px-6 pt-4 pb-6">
          <Avatar uri={avatarUri} name={fullName} size={96} />
          <Text className="text-2xl font-bold text-gray-900 mt-4">
            {fullName}
          </Text>

          {profile.isSuperhost && (
            <Badge
              label="Superhost"
              variant="superhost"
              className="mt-2"
            />
          )}

          <Text className="text-sm text-gray-500 mt-2">
            Member since {memberSince}
          </Text>
        </View>

        {/* Verification badges */}
        <View className="px-6 pb-4">
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Verified information
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {profile.isEmailVerified && (
                <View className="flex-row items-center">
                  <Shield size={14} color="#16A34A" />
                  <Text className="text-sm text-gray-700 ml-1.5">Email</Text>
                </View>
              )}
              {profile.isPhoneVerified && (
                <View className="flex-row items-center">
                  <Shield size={14} color="#16A34A" />
                  <Text className="text-sm text-gray-700 ml-1.5">Phone</Text>
                </View>
              )}
              {profile.isIdVerified && (
                <View className="flex-row items-center">
                  <Shield size={14} color="#16A34A" />
                  <Text className="text-sm text-gray-700 ml-1.5">
                    Identity
                  </Text>
                </View>
              )}
              {!profile.isEmailVerified &&
                !profile.isPhoneVerified &&
                !profile.isIdVerified && (
                  <Text className="text-sm text-gray-500">
                    No verifications yet
                  </Text>
                )}
            </View>
          </View>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View className="px-6 pb-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              About
            </Text>
            <Text className="text-sm text-gray-700 leading-5">
              {profile.bio}
            </Text>
          </View>
        ) : null}

        {/* Stats */}
        <View className="flex-row px-6 pb-6 gap-4">
          <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
            <Calendar size={20} color="#FF385C" />
            <Text className="text-sm text-gray-500 mt-1">Joined</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {formatDate(profile.createdAt, 'yyyy')}
            </Text>
          </View>
          {profile.isHost && (
            <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
              <Star size={20} color="#FF385C" />
              <Text className="text-sm text-gray-500 mt-1">Status</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {profile.isSuperhost ? 'Superhost' : 'Host'}
              </Text>
            </View>
          )}
        </View>

        {/* Listings (if host) */}
        {profile.isHost && listings.length > 0 && (
          <View className="pb-4">
            <Text className="text-lg font-semibold text-gray-900 px-6 mb-3">
              {fullName}'s listings
            </Text>
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              renderItem={renderListingCard}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
