import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getImageUrl, formatDate, formatPrice } from '@/lib/utils';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAlert } from '@/components/ui/AlertModal';
import type { Booking } from '@/types';

type ReservationTab = 'pending' | 'confirmed' | 'completed' | 'cancelled';

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

export default function HostReservationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReservationTab>('pending');
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { success, error: showError, confirm } = useAlert();

  // ---------------------------------------------------------------------------
  // Fetch reservations
  // ---------------------------------------------------------------------------
  const {
    data: reservations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['hostReservations', activeTab],
    queryFn: () => bookingsApi.getHostReservations(activeTab),
    enabled: isHydrated && !!accessToken,
  });

  // ---------------------------------------------------------------------------
  // Confirm mutation
  // ---------------------------------------------------------------------------
  const confirmMutation = useMutation({
    mutationFn: bookingsApi.confirmBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostReservations'] });
      success('Success', 'Reservation has been confirmed.');
    },
    onError: () => {
      showError('Error', 'Failed to confirm reservation. Please try again.');
    },
  });

  // ---------------------------------------------------------------------------
  // Decline mutation
  // ---------------------------------------------------------------------------
  const declineMutation = useMutation({
    mutationFn: bookingsApi.declineBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostReservations'] });
      success('Declined', 'Reservation has been declined.');
    },
    onError: () => {
      showError('Error', 'Failed to decline reservation. Please try again.');
    },
  });

  // ---------------------------------------------------------------------------
  // Handle confirm
  // ---------------------------------------------------------------------------
  const handleConfirm = (booking: Booking) => {
    confirm(
      'Confirm Reservation',
      `Confirm reservation for ${booking.guest.firstName} ${booking.guest.lastName}?`,
      () => confirmMutation.mutate(booking.id),
      { confirmText: 'Confirm', cancelText: 'Cancel' },
    );
  };

  // ---------------------------------------------------------------------------
  // Handle decline
  // ---------------------------------------------------------------------------
  const handleDecline = (booking: Booking) => {
    confirm(
      'Decline Reservation',
      `Are you sure you want to decline this reservation?`,
      () => declineMutation.mutate(booking.id),
      { confirmText: 'Decline', cancelText: 'Cancel', destructive: true },
    );
  };

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const tabs: { key: ReservationTab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // ---------------------------------------------------------------------------
  // Reservation card
  // ---------------------------------------------------------------------------
  const renderReservationCard = ({ item }: { item: Booking }) => {
    const guestName = `${item.guest.firstName} ${item.guest.lastName}`;
    const guestAvatar = getImageUrl(item.guest.avatarUrl);
    const coverPhoto = item.property.photos?.[0]?.url;
    const imageUrl =
      getImageUrl(coverPhoto) ??
      'https://via.placeholder.com/400x200?text=No+Image';

    return (
      <View
        className="mb-4 mx-6 bg-white rounded-xl overflow-hidden border border-gray-100"
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
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />
        <View className="p-4">
          {/* Property title + badge */}
          <View className="flex-row items-center justify-between mb-2">
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

          {/* Guest info */}
          <View className="flex-row items-center mb-2">
            <Avatar uri={guestAvatar} name={guestName} size={32} />
            <View className="ml-2">
              <Text className="text-sm font-medium text-gray-900">
                {guestName}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.guestsCount}{' '}
                {item.guestsCount === 1 ? 'guest' : 'guests'}
              </Text>
            </View>
          </View>

          {/* Dates */}
          <Text className="text-sm text-gray-600">
            {formatDate(item.checkIn, 'MMM d')} -{' '}
            {formatDate(item.checkOut, 'MMM d, yyyy')}
          </Text>

          {/* Price */}
          <Text className="text-base font-semibold text-gray-900 mt-2">
            {formatPrice(item.totalAmount, item.currency)}
          </Text>

          {/* Actions for pending */}
          {item.status === 'pending' && (
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                onPress={() => handleDecline(item)}
                disabled={declineMutation.isPending}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl border border-gray-300"
              >
                <XCircle size={16} color="#717171" />
                <Text className="text-sm font-semibold text-gray-700 ml-1.5">
                  Decline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleConfirm(item)}
                disabled={confirmMutation.isPending}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl bg-brand"
              >
                <CheckCircle size={16} color="#fff" />
                <Text className="text-sm font-semibold text-white ml-1.5">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Reservations" />

      {/* Tabs */}
      <View className="px-6 py-3">
        <FlatList
          data={tabs}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
              className={`px-4 py-2 rounded-full border ${
                activeTab === tab.key
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-white border-gray-300'
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
          )}
        />
      </View>

      {/* Reservation list */}
      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReservationCard}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Clock size={48} color="#717171" />
              <Text className="text-base text-gray-500 mt-4 text-center">
                {activeTab === 'pending'
                  ? 'No pending reservation requests.'
                  : activeTab === 'confirmed'
                    ? 'No confirmed reservations.'
                    : activeTab === 'completed'
                      ? 'No completed reservations yet.'
                      : 'No cancelled reservations.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
