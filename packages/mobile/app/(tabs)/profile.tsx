import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
  Home,
  Shield,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, isHost } = useAuth();
  const { logout, toggleHostMode, setUser } = useAuthStore();

  // ---------------------------------------------------------------------------
  // Become host mutation
  // ---------------------------------------------------------------------------
  const becomeHostMutation = useMutation({
    mutationFn: usersApi.becomeHost,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toggleHostMode();
      router.push('/hosting/dashboard');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to activate host mode. Please try again.');
    },
  });

  // ---------------------------------------------------------------------------
  // Handle logout
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Handle switch to hosting
  // ---------------------------------------------------------------------------
  const handleSwitchToHosting = () => {
    toggleHostMode();
    router.push('/hosting/dashboard');
  };

  // ---------------------------------------------------------------------------
  // Handle become a host
  // ---------------------------------------------------------------------------
  const handleBecomeHost = () => {
    Alert.alert(
      'Become a Host',
      'Start hosting on Sakan and earn money by sharing your space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Hosting',
          onPress: () => becomeHostMutation.mutate(),
        },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4">
            <User size={40} color="#717171" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">
            Log in to view your profile
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            Manage your account, view trips, and access hosting tools.
          </Text>
          <Button
            title="Log in"
            onPress={() => router.push('/auth/login')}
            className="mt-6 w-full"
          />
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            className="mt-4"
          >
            <Text className="text-brand font-semibold text-base">
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Settings row component
  // ---------------------------------------------------------------------------
  const SettingsRow = ({
    icon,
    label,
    onPress,
    textColor,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    textColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-4 border-b border-gray-100"
    >
      <View className="w-8">{icon}</View>
      <Text
        className={`flex-1 text-base ml-3 ${textColor ?? 'text-gray-900'}`}
      >
        {label}
      </Text>
      <ChevronRight size={20} color="#717171" />
    </TouchableOpacity>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const fullName = `${user?.firstName} ${user?.lastName}`;
  const avatarUri = getImageUrl(user?.avatarUrl);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>

        {/* User info */}
        <TouchableOpacity
          onPress={() => router.push(`/profile/${user!.id}`)}
          activeOpacity={0.8}
          className="flex-row items-center px-6 py-4 border-b border-gray-100"
        >
          <Avatar uri={avatarUri} name={fullName} size={56} />
          <View className="flex-1 ml-4">
            <Text className="text-lg font-semibold text-gray-900">
              {fullName}
            </Text>
            <Text className="text-sm text-gray-500">Show profile</Text>
          </View>
          <ChevronRight size={20} color="#717171" />
        </TouchableOpacity>

        {/* Settings sections */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Account settings
          </Text>

          <SettingsRow
            icon={<User size={20} color="#222" />}
            label="Personal information"
            onPress={() =>
              Alert.alert('Personal Information', 'Account settings screen.')
            }
          />

          <SettingsRow
            icon={<Bell size={20} color="#222" />}
            label="Notifications"
            onPress={() =>
              Alert.alert('Notifications', 'Notification settings screen.')
            }
          />

          <SettingsRow
            icon={<Shield size={20} color="#222" />}
            label="Privacy and sharing"
            onPress={() =>
              Alert.alert(
                'Privacy',
                'Privacy and sharing settings screen.',
              )
            }
          />
        </View>

        {/* Hosting section */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Hosting
          </Text>

          {isHost ? (
            <SettingsRow
              icon={<Home size={20} color="#FF385C" />}
              label="Switch to hosting"
              onPress={handleSwitchToHosting}
            />
          ) : (
            <SettingsRow
              icon={<Home size={20} color="#FF385C" />}
              label="Become a Host"
              onPress={handleBecomeHost}
            />
          )}
        </View>

        {/* Support section */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Support
          </Text>

          <SettingsRow
            icon={<Settings size={20} color="#222" />}
            label="Get help"
            onPress={() =>
              Alert.alert('Help', 'Help and support screen.')
            }
          />
        </View>

        {/* Logout */}
        <View className="px-6 mt-8">
          <SettingsRow
            icon={<LogOut size={20} color="#E31C5F" />}
            label="Log out"
            onPress={handleLogout}
            textColor="text-brand"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
