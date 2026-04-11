import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { messagesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Conversation } from '@/types';

export default function InboxScreen() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const {
    data: conversations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
    enabled: isLoggedIn,
  });

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-6 pb-4 bg-indigo-50 border-b border-indigo-100">
          <Text className="text-2xl font-bold text-gray-900">Inbox</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center">
            <MessageCircle size={28} color="#4F46E5" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mt-4">
            Log in to see messages
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            Once you log in, you will find messages from hosts and guests here.
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
  // Conversation row
  // ---------------------------------------------------------------------------
  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const otherName = `${item.otherUser.firstName} ${item.otherUser.lastName}`;
    const avatarUri = getImageUrl(item.otherUser.avatarUrl);
    const lastMsg = item.lastMessage?.body ?? '';
    const truncated =
      lastMsg.length > 60 ? lastMsg.substring(0, 60) + '...' : lastMsg;

    let timeAgo = '';
    try {
      const dateSource = item.lastMessage?.createdAt ?? item.createdAt;
      timeAgo = formatDistanceToNow(parseISO(dateSource), {
        addSuffix: true,
      });
    } catch {
      timeAgo = '';
    }

    const handlePress = () => {
      router.push({
        pathname: '/inbox/[conversationId]',
        params: {
          conversationId: item.id.toString(),
          otherName: otherName,
          otherAvatar: item.otherUser.avatarUrl ?? '',
        },
      });
    };

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="flex-row items-center px-6 py-4 border-b border-indigo-50"
      >
        {/* Avatar */}
        <Avatar uri={avatarUri} name={otherName} size={52} />

        {/* Content */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-[15px] font-semibold text-gray-900 flex-1"
              numberOfLines={1}
            >
              {otherName}
            </Text>
            <Text className="text-xs text-gray-400 ml-2">{timeAgo}</Text>
          </View>

          {item.property && (
            <Text
              className="text-xs text-gray-500 mt-0.5"
              numberOfLines={1}
            >
              {item.property.title}
            </Text>
          )}

          <Text
            className={`text-sm mt-0.5 ${
              item.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
            }`}
            numberOfLines={1}
          >
            {truncated || 'No messages yet'}
          </Text>
        </View>

        {/* Unread badge */}
        {item.unreadCount > 0 && (
          <View className="ml-2 bg-brand rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      </Animated.View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 pt-6 pb-4 bg-indigo-50 border-b border-indigo-100">
        <Text className="text-2xl font-bold text-gray-900">Inbox</Text>
      </View>

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center">
                <MessageCircle size={28} color="#4F46E5" />
              </View>
              <Text className="text-base text-gray-500 mt-4 text-center">
                No messages yet. When you contact a host or receive a message, it
                will appear here.
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
