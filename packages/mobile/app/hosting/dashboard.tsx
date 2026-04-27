import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
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
  AlertCircle,
  TrendingUp,
  DollarSign,
  Star,
  BarChart2,
  Users,
} from 'lucide-react-native';
import { bookingsApi, payoutsApi, hostMetricsApi } from '@/lib/api';
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
  // Fetch earnings summary
  // ---------------------------------------------------------------------------
  const { data: earningsData } = useQuery({
    queryKey: ['hostEarnings'],
    queryFn: payoutsApi.getEarnings,
    enabled: isReady,
  });

  const currency = earningsData?.summary?.currency ?? 'EGP';
  const availableBalance = earningsData?.summary?.available ?? 0;
  const pendingBalance = earningsData?.summary?.pending ?? 0;

  // ---------------------------------------------------------------------------
  // Performance metrics
  // ---------------------------------------------------------------------------
  const { data: metricsData = [] } = useQuery({
    queryKey: ['hostMetrics'],
    queryFn: () => hostMetricsApi.getPerformance(),
    enabled: isReady,
    staleTime: 1000 * 60 * 5,
  });

  const totalRevenue = metricsData.reduce((s: number, p: any) => s + (p.revenue ?? 0), 0);
  const totalBookings = metricsData.reduce((s: number, p: any) => s + (p.bookings ?? 0), 0);
  const avgRating =
    metricsData.length > 0
      ? metricsData.reduce((s: number, p: any) => s + (p.avgRating ?? 0), 0) / metricsData.length
      : 0;
  const avgCompletionRate =
    metricsData.length > 0
      ? Math.round(
          metricsData.reduce((s: number, p: any) => s + (p.completionRate ?? 0), 0) / metricsData.length,
        )
      : 0;

  // ---------------------------------------------------------------------------
  // ID verification status
  // ---------------------------------------------------------------------------
  const idStatus = (user as any)?.idVerificationStatus ?? null;
  const needsIdVerification = idStatus !== 'approved';

  // ---------------------------------------------------------------------------
  // Switch back to guest mode (with confirmation)
  // ---------------------------------------------------------------------------
  const handleBackToGuest = () => {
    Alert.alert(
      'Switch to guest mode?',
      'You will leave the hosting dashboard.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Switch',
          style: 'destructive',
          onPress: () => {
            toggleHostMode();
            router.replace('/(tabs)');
          },
        },
      ],
    );
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
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

        {/* ID Verification Banner */}
        {needsIdVerification && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/profile/verify-id')}
            className="mx-6 mb-4 p-4 rounded-xl border border-orange-300 bg-orange-50 flex-row items-start gap-3"
          >
            <AlertCircle size={20} color="#EA580C" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-orange-800">
                ID verification required
              </Text>
              <Text className="text-xs text-orange-700 mt-0.5">
                {idStatus === 'pending'
                  ? 'Your ID is under review. We\'ll notify you when approved.'
                  : idStatus === 'rejected'
                  ? 'Your ID was rejected. Tap to resubmit.'
                  : 'Verify your government ID to publish your first listing.'}
              </Text>
            </View>
            {idStatus !== 'pending' && (
              <Text className="text-xs font-semibold text-orange-600 mt-0.5">Verify →</Text>
            )}
          </TouchableOpacity>
        )}

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

        {/* Earnings panel */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Earnings
          </Text>
          <View className="bg-brand/5 border border-brand/20 rounded-xl p-4">
            <View className="flex-row gap-4">
              <View className="flex-1 items-center py-2">
                <DollarSign size={20} color="#4F46E5" />
                <Text className="text-lg font-bold text-gray-900 mt-1">
                  {currency} {availableBalance.toFixed(0)}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">Available</Text>
              </View>
              <View className="w-px bg-brand/20" />
              <View className="flex-1 items-center py-2">
                <TrendingUp size={20} color="#CA8A04" />
                <Text className="text-lg font-bold text-gray-900 mt-1">
                  {currency} {pendingBalance.toFixed(0)}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">Pending</Text>
              </View>
            </View>
            {availableBalance > 0 && (
              <TouchableOpacity
                className="mt-3 bg-brand rounded-lg py-2.5 items-center"
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert(
                    'Request Payout',
                    `Available balance: ${currency} ${availableBalance.toFixed(2)}\n\nPayout requests are processed within 2 business days.`,
                    [{ text: 'OK' }],
                  )
                }
              >
                <Text className="text-white text-sm font-semibold">Request Payout</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Performance metrics panel */}
        {metricsData.length > 0 && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <BarChart2 size={18} color="#1a1a1a" />
              <Text className="text-lg font-semibold text-gray-900">Performance</Text>
            </View>
            <View className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              {/* Top row: revenue + bookings */}
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3 items-center">
                  <DollarSign size={18} color="#4F46E5" />
                  <Text className="text-base font-bold text-gray-900 mt-1">
                    {currency} {totalRevenue.toFixed(0)}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">Total Revenue</Text>
                </View>
                <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3 items-center">
                  <CheckCircle size={18} color="#16A34A" />
                  <Text className="text-base font-bold text-gray-900 mt-1">{totalBookings}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">Total Bookings</Text>
                </View>
              </View>
              {/* Bottom row: avg rating + completion rate */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3 items-center">
                  <Star size={18} color="#CA8A04" />
                  <Text className="text-base font-bold text-gray-900 mt-1">
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">Avg Rating</Text>
                </View>
                <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3 items-center">
                  <TrendingUp size={18} color="#0891B2" />
                  <Text className="text-base font-bold text-gray-900 mt-1">
                    {avgCompletionRate}%
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">Completion Rate</Text>
                </View>
              </View>
              {/* Per-property breakdown if multiple */}
              {metricsData.length > 1 && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  {metricsData.map((p: any) => (
                    <View key={p.propertyId} className="flex-row items-center justify-between py-1.5">
                      <Text className="text-sm text-gray-700 flex-1 mr-3" numberOfLines={1}>
                        {p.title}
                      </Text>
                      <Text className="text-xs text-gray-400 mr-3">{p.bookings} bookings</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {currency} {(p.revenue ?? 0).toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

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

          <TouchableOpacity
            onPress={() => router.push('/hosting/cohosts')}
            activeOpacity={0.8}
            className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-violet-50 items-center justify-center">
              <Users size={20} color="#7c3aed" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-900">
                Co-Hosts
              </Text>
              <Text className="text-sm text-gray-500">
                Manage co-host invitations
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Back to guest mode */}
        <View className="px-6 mt-6">
          <Button
            title="Switch to guest mode"
            variant="secondary"
            onPress={handleBackToGuest}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


