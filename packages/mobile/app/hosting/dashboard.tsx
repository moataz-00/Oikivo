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
import {
  Calendar,
  List,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getImageUrl, formatDate, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Booking } from '@/types';

export default function HostingDashboardScreen() {
  const router = useRouter();
  const toggleHostMode = useAuthStore((s) => s.toggleHostMode);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isReady = isHydrated && !!accessToken;

  // ---------------------------------------------------------------------------
  // Fetch upcoming reservations
  // ---------------------------------------------------------------------------
  const { data: confirmedReservations = [], isLoading: loadingConfirmed } =
    useQuery({
      queryKey: ['hostReservations', 'confirmed'],
      queryFn: () => bookingsApi.getHostReservations('confirmed'),
      enabled: isReady,
    });

  // ---------------------------------------------------------------------------
  // Fetch pending reservations (for count)
  // ---------------------------------------------------------------------------
  const { data: pendingReservations = [] } = useQuery({
    queryKey: ['hostReservations', 'pending'],
    queryFn: () => bookingsApi.getHostReservations('pending'),
    enabled: isReady,
  });

  // ---------------------------------------------------------------------------
  // Switch back to guest mode
  // ---------------------------------------------------------------------------
  const handleBackToGuest = () => {
    toggleHostMode();
    router.replace('/(tabs)');
  };

  // ---------------------------------------------------------------------------
  // Reservation card
  // ---------------------------------------------------------------------------
  const renderReservationCard = ({ item }: { item: Booking }) => {
    const guestName = `${item.guest.firstName} ${item.guest.lastName}`;
    const guestAvatar = getImageUrl(item.guest.avatarUrl);
    const coverPhoto = item.property.photos?.[0]?.url;
    const imageUrl =
      getImageUrl(coverPhoto) ??
      'https://via.placeholder.com/200x120?text=No+Image';

    return (
      <View className="mr-4 bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ width: 280 }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 120 }}
          resizeMode="cover"
        />
        <View className="p-3.5">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {item.property.title}
          </Text>
          <View className="flex-row items-center mt-2">
            <Avatar uri={guestAvatar} name={guestName} size={28} />
            <Text className="text-sm text-gray-700 ml-2">{guestName}</Text>
          </View>
          <Text className="text-xs text-gray-500 mt-2">
            {formatDate(item.checkIn, 'MMM d')} -{' '}
            {formatDate(item.checkOut, 'MMM d, yyyy')}
          </Text>
          <Text className="text-sm font-semibold text-gray-900 mt-1">
            {formatPrice(item.totalAmount, item.currency)}
          </Text>
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
        <TouchableOpacity onPress={handleBackToGuest}>
          <ArrowLeft size={22} color="#222" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          Hosting Dashboard
        </Text>
        <View className="w-6" />
      </View>

      {/* Welcome */}
      <View className="px-6 pb-4">
        <Text className="text-base text-gray-600">
          Welcome back, {user?.firstName}!
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-6 mb-6 gap-3">
        <TouchableOpacity
          onPress={() => router.push('/hosting/reservations')}
          activeOpacity={0.8}
          className="flex-1 bg-yellow-50 border border-yellow-200 rounded-xl p-4 items-center"
        >
          <Clock size={24} color="#CA8A04" />
          <Text className="text-2xl font-bold text-yellow-700 mt-2">
            {pendingReservations.length}
          </Text>
          <Text className="text-xs text-yellow-600 mt-1 text-center">
            Pending Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/hosting/reservations')}
          activeOpacity={0.8}
          className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 items-center"
        >
          <CheckCircle size={24} color="#16A34A" />
          <Text className="text-2xl font-bold text-green-700 mt-2">
            {confirmedReservations.length}
          </Text>
          <Text className="text-xs text-green-600 mt-1 text-center">
            Upcoming Check-ins
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming reservations */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between px-6 mb-3">
          <Text className="text-lg font-semibold text-gray-900">
            Upcoming Reservations
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/hosting/reservations')}
          >
            <Text className="text-sm font-medium text-brand">See all</Text>
          </TouchableOpacity>
        </View>

        {loadingConfirmed ? (
          <View className="py-8">
            <Spinner size="small" />
          </View>
        ) : confirmedReservations.length === 0 ? (
          <View className="items-center py-8">
            <Calendar size={36} color="#717171" />
            <Text className="text-sm text-gray-500 mt-2">
              No upcoming reservations
            </Text>
          </View>
        ) : (
          <FlatList
            data={confirmedReservations.slice(0, 5)}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            renderItem={renderReservationCard}
          />
        )}
      </View>

      {/* Quick actions */}
      <View className="px-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/hosting/listings')}
          activeOpacity={0.8}
          className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"
        >
          <View className="w-10 h-10 rounded-full bg-brand/10 items-center justify-center">
            <List size={20} color="#4F46E5" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-gray-900">
              View Listings
            </Text>
            <Text className="text-sm text-gray-500">
              Manage your properties
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/hosting/listing/new')}
          activeOpacity={0.8}
          className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"
        >
          <View className="w-10 h-10 rounded-full bg-brand/10 items-center justify-center">
            <Plus size={20} color="#4F46E5" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-gray-900">
              Create Listing
            </Text>
            <Text className="text-sm text-gray-500">
              List a new property on Oikivo
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/hosting/regulations/egypt')}
          activeOpacity={0.8}
          className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"
        >
          <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center">
            <Text className="text-xl">🇪🇬</Text>
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-gray-900">
              Egypt Regulations
            </Text>
            <Text className="text-sm text-gray-500">
              Holiday Home License (MoTA)
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Back to guest mode */}
      <View className="px-6 mt-auto mb-6">
        <Button
          title="Switch to guest mode"
          variant="secondary"
          onPress={handleBackToGuest}
        />
      </View>
    </SafeAreaView>
  );
}
