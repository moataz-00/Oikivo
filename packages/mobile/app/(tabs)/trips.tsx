import React, { useState } from 'react';
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
import { Calendar } from 'lucide-react-native';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl, formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { Booking, BookingStatus } from '@/types';

type TripTab = 'upcoming' | 'past' | 'cancelled';

const TAB_STATUS_MAP: Record<TripTab, string> = {
  upcoming: 'confirmed',
  past: 'completed',
  cancelled: 'cancelled',
};

const BADGE_VARIANT_MAP: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'error',
  declined: 'error',
};

export default function TripsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');

  const {
    data: bookings = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['myTrips', activeTab],
    queryFn: () => bookingsApi.getMyTrips(TAB_STATUS_MAP[activeTab]),
    enabled: isLoggedIn,
  });

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-6 pb-4 bg-indigo-50 border-b border-indigo-100">
          <Text className="text-2xl font-bold text-gray-900">Trips</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center">
            <Calendar size={28} color="#4F46E5" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mt-4">
            Log in to view your trips
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            Once you book a trip, it will appear here.
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
  // Segment tabs
  // ---------------------------------------------------------------------------
  const tabs: { key: TripTab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // ---------------------------------------------------------------------------
  // Booking card
  // ---------------------------------------------------------------------------
  const renderBookingCard = ({ item }: { item: Booking }) => {
    const coverPhoto = item.property.photos?.[0]?.url;
    const imageUrl =
      getImageUrl(coverPhoto) ??
      'https://via.placeholder.com/400x200?text=No+Image';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        className="mb-5 mx-6 bg-white rounded-xl overflow-hidden border border-indigo-100"
        style={{
          shadowColor: '#4338CA',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 180 }}
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-base font-semibold text-gray-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {item.property.title}
            </Text>
            <Badge
              label={item.status}
              variant={BADGE_VARIANT_MAP[item.status] ?? 'info'}
            />
          </View>
          <Text className="text-sm text-gray-500">
            {item.property.city}, {item.property.country}
          </Text>
          <Text className="text-sm text-gray-600 mt-2">
            {formatDate(item.checkIn, 'MMM d')} -{' '}
            {formatDate(item.checkOut, 'MMM d, yyyy')}
          </Text>
          <Text className="text-base font-semibold text-gray-900 mt-2">
            {formatPrice(item.totalAmount, item.currency)}
          </Text>
          {item.status === 'completed' && (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/reviews/write?bookingId=${item.id}&propertyId=${item.property.id}`,
                )
              }
              className="mt-3 bg-brand rounded-lg py-2 px-4 self-start"
            >
              <Text className="text-white text-sm font-semibold">
                Write a review
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-6 pb-3 bg-indigo-50 border-b border-indigo-100">
        <Text className="text-2xl font-bold text-gray-900">Trips</Text>
      </View>

      {/* Segment tabs */}
      <View className="flex-row px-6 mt-4 mb-4 gap-2">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
            className={`px-4 py-2 rounded-full border ${
              activeTab === tab.key
                ? 'bg-brand border-brand'
                : 'bg-white border-indigo-100'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.key ? 'text-white' : 'text-gray-700'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBookingCard}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center">
                <Calendar size={28} color="#4F46E5" />
              </View>
              <Text className="text-base text-gray-500 mt-4 text-center">
                {activeTab === 'upcoming'
                  ? 'No upcoming trips. Start exploring to plan your next adventure!'
                  : activeTab === 'past'
                    ? 'No past trips yet.'
                    : 'No cancelled trips.'}
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
