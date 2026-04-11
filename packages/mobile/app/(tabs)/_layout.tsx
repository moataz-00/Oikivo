import React, { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Heart,
  CalendarDays,
  MessageSquare,
  UserCircle,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { messagesApi, notificationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// Animated tab icon with dot indicator
// ---------------------------------------------------------------------------
function TabIcon({
  icon: Icon,
  color,
  focused,
  badge,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
  focused: boolean;
  badge?: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 1, {
      damping: 12,
      stiffness: 180,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center justify-center pt-1">
      <Animated.View style={animatedStyle}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      </Animated.View>
      {/* Active indicator dot */}
      {focused && (
        <View className="w-1 h-1 rounded-full bg-brand mt-1" />
      )}
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <View className="absolute -top-0.5 -right-2.5 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
          <Text className="text-white text-[9px] font-bold">
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { isLoggedIn } = useAuth();

  // Fetch unread message count
  const { data: conversations } = useQuery({
    queryKey: ['conversations-badge'],
    queryFn: messagesApi.getConversations,
    enabled: isLoggedIn,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  // Fetch unread notification count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: isLoggedIn,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  const unreadMessages = conversations?.filter((c) => c.unreadCount > 0).length ?? 0;
  const unreadNotifications = unreadData?.count ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Search} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlists"
        options={{
          title: 'Wishlists',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Heart} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={CalendarDays} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={MessageSquare}
              color={color}
              focused={focused}
              badge={unreadMessages}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={UserCircle}
              color={color}
              focused={focused}
              badge={unreadNotifications}
            />
          ),
        }}
      />
    </Tabs>
  );
}
