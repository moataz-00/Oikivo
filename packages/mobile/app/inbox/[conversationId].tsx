import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send } from 'lucide-react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { messagesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import type { Message } from '@/types';

export default function ConversationScreen() {
  const { conversationId, otherName, otherAvatar } = useLocalSearchParams<{
    conversationId: string;
    otherName: string;
    otherAvatar?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [text, setText] = useState('');
  const convId = parseInt(conversationId!, 10);

  // ---------------------------------------------------------------------------
  // Fetch messages
  // ---------------------------------------------------------------------------
  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => messagesApi.getMessages(convId, 1, 100),
    refetchInterval: 5000,
  });

  const messages = messagesData?.data ?? [];

  // Mark as read on mount
  useEffect(() => {
    messagesApi.markRead(convId).catch(() => {});
    return () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-badge'] });
    };
  }, [convId, queryClient]);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const sendMutation = useMutation({
    mutationFn: (body: string) => messagesApi.sendMessage(convId, body),
    onSuccess: () => {
      setText('');
      refetch();
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }, [text, sendMutation]);

  // ---------------------------------------------------------------------------
  // Message bubble
  // ---------------------------------------------------------------------------
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMine = item.senderId === user?.id;
      let timeAgo = '';
      try {
        timeAgo = formatDistanceToNow(parseISO(item.createdAt), {
          addSuffix: true,
        });
      } catch {
        /* ignore */
      }

      return (
        <Animated.View
          entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(300)}
          className={`mb-2 px-4 max-w-[80%] ${
            isMine ? 'self-end' : 'self-start'
          }`}
        >
          <View
            className={`rounded-2xl px-4 py-2.5 ${
              isMine
                ? 'bg-brand rounded-br-md'
                : 'bg-gray-100 rounded-bl-md'
            }`}
          >
            <Text
              className={`text-[15px] leading-5 ${
                isMine ? 'text-white' : 'text-gray-900'
              }`}
            >
              {item.body}
            </Text>
          </View>
          <Text
            className={`text-[10px] text-gray-400 mt-1 ${
              isMine ? 'text-right' : 'text-left'
            }`}
          >
            {timeAgo}
          </Text>
        </Animated.View>
      );
    },
    [user?.id],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
          className="bg-indigo-50 border-b border-indigo-100 flex-row items-center px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
            className="w-9 h-9 items-center justify-center mr-2 rounded-full bg-white"
        >
          <ChevronLeft size={24} color="#111" />
        </TouchableOpacity>

        <Avatar
          uri={otherAvatar ? getImageUrl(otherAvatar) : undefined}
          name={otherName ?? ''}
          size={36}
        />

        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {otherName}
          </Text>
        </View>
      </View>

      {/* Messages */}
                : 'bg-indigo-50 rounded-bl-md border border-indigo-100'
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-gray-400 text-sm">
                  No messages yet. Say hello!
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View
            className="flex-row items-end px-4 py-3 border-t border-indigo-100 bg-white"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
              className="flex-1 bg-indigo-50 rounded-2xl px-4 py-2.5 text-[15px] text-gray-900 max-h-24 mr-3 border border-indigo-100"
            style={{ lineHeight: 20 }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            activeOpacity={0.7}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              text.trim() ? 'bg-brand' : 'bg-gray-200'
            }`}
          >
            <Send
              size={18}
              color={text.trim() ? '#fff' : '#9CA3AF'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
