import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Conversation } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  onPress?: () => void;
}

export function ConversationItem({
  conversation,
  onPress,
}: ConversationItemProps) {
  const otherName = `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`;
  const avatarUri = getImageUrl(conversation.otherUser.avatarUrl);
  const lastMsg = conversation.lastMessage?.body ?? '';
  const truncated =
    lastMsg.length > 60 ? lastMsg.substring(0, 60) + '...' : lastMsg;

  let timeAgo = '';
  try {
    const dateSource =
      conversation.lastMessage?.createdAt ?? conversation.createdAt;
    timeAgo = formatDistanceToNow(parseISO(dateSource), {
      addSuffix: true,
    });
  } catch {
    timeAgo = '';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-6 py-4 border-b border-gray-100"
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

        {conversation.property && (
          <Text
            className="text-xs text-gray-500 mt-0.5"
            numberOfLines={1}
          >
            {conversation.property.title}
          </Text>
        )}

        <Text
          className={`text-sm mt-0.5 ${
            conversation.unreadCount > 0
              ? 'text-gray-900 font-medium'
              : 'text-gray-500'
          }`}
          numberOfLines={1}
        >
          {truncated || 'No messages yet'}
        </Text>
      </View>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <View className="ml-2 bg-brand rounded-full w-6 h-6 items-center justify-center">
          <Text className="text-white text-xs font-bold">
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
