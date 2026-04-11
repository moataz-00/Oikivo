import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, CheckCheck } from 'lucide-react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { notificationsApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const {
    data: notificationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(1, 50),
  });

  const notifications = notificationsData?.data ?? [];

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    let timeAgo = '';
    try {
      timeAgo = formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true });
    } catch {
      /* ignore */
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <View
          className={`px-6 py-4 border-b border-gray-100 ${
            !item.isRead ? 'bg-indigo-50/50' : ''
          }`}
        >
          <View className="flex-row items-start">
            {!item.isRead && (
              <View className="w-2 h-2 rounded-full bg-brand mt-2 mr-3" />
            )}
            <View className={`flex-1 ${item.isRead ? 'ml-5' : ''}`}>
              <Text className="text-[15px] font-semibold text-gray-900">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-600 mt-0.5 leading-5">
                {item.body}
              </Text>
              <Text className="text-xs text-gray-400 mt-1.5">{timeAgo}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="bg-white border-b border-gray-100 flex-row items-center justify-between px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={24} color="#111" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">
          Notifications
        </Text>

        <TouchableOpacity
          onPress={() => markAllReadMutation.mutate()}
          disabled={!hasUnread || markAllReadMutation.isPending}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center"
        >
          <CheckCheck
            size={20}
            color={hasUnread ? '#4F46E5' : '#D1D5DB'}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Bell size={48} color="#D1D5DB" />
              <Text className="text-base text-gray-500 mt-4 text-center">
                No notifications yet
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
