import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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
  GraduationCap,
  ExternalLink,
  Calendar,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/components/ui/AlertModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { logout } = useAuthStore();
  const { confirm, alert } = useAlert();

  // ---------------------------------------------------------------------------
  // Become host mutation (redirects to web platform)
  // ---------------------------------------------------------------------------
  const handleHosting = () => {
    confirm(
      'Host on Oikivo',
      'Hosting tools are available on the Oikivo website for the best experience. Would you like to open the platform?',
      () => Linking.openURL('https://oikivo.com/hosting'),
      { confirmText: 'Open Website', cancelText: 'Not Now' },
    );
  };

  const handleBecomeConsultant = () => {
    confirm(
      'Become a Consultant',
      'Consultant features are coming soon on the Oikivo website. Would you like to open the website page?',
      () => Linking.openURL('https://oikivo.com/consultations/apply'),
      { confirmText: 'Open Website', cancelText: 'Not Now' },
    );
  };

  const handleConsultationsComingSoon = () => {
    confirm(
      'Consultations Coming Soon',
      'Consultation features are currently being finalized and will be available on the Oikivo website first. Would you like to open the website?',
      () => Linking.openURL('https://oikivo.com/consultations'),
      { confirmText: 'Open Website', cancelText: 'Not Now' },
    );
  };

  // ---------------------------------------------------------------------------
  // Handle logout
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    confirm(
      'Log out',
      'Are you sure you want to log out of your account?',
      async () => {
        await logout();
        router.replace('/(tabs)');
      },
      { confirmText: 'Log out', destructive: true },
    );
  };

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-6 pt-6 pb-4 bg-indigo-50 border-b border-indigo-100">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-full bg-brand-50 items-center justify-center mb-4">
            <User size={40} color="#4F46E5" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">
            Log in to view your profile
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            Manage your account, view trips, and access website features.
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
        <View className="px-6 pt-6 pb-4 bg-indigo-50 border-b border-indigo-100">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>

        {/* User info */}
        <Animated.View entering={FadeInDown.duration(400)}>
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
        </Animated.View>

        {/* Settings sections */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Account settings
          </Text>
          <View className="bg-white border border-indigo-100 rounded-2xl px-4">

          <SettingsRow
            icon={<User size={20} color="#222" />}
            label="Personal information"
            onPress={() => router.push('/profile/edit')}
          />

          <SettingsRow
            icon={<Bell size={20} color="#222" />}
            label="Notifications"
            onPress={() => router.push('/profile/notifications')}
          />

          <SettingsRow
            icon={<Shield size={20} color="#222" />}
            label="Privacy and sharing"
            onPress={() =>
              Linking.openURL('https://oikivo.com/privacy')
            }
          />
          </View>
        </View>

        {/* Hosting section — redirect to web */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Hosting
          </Text>
          <View className="bg-white border border-indigo-100 rounded-2xl px-4">

          <SettingsRow
            icon={<Home size={20} color="#4F46E5" />}
            label="Manage on Website"
            onPress={handleHosting}
          />
          </View>
        </View>

        {/* Consultations section */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Consultations
          </Text>
          <View className="bg-white border border-indigo-100 rounded-2xl px-4">

          <SettingsRow
            icon={<GraduationCap size={20} color="#4F46E5" />}
            label="Consultations coming soon on Website"
            onPress={handleConsultationsComingSoon}
          />

          <SettingsRow
            icon={<ExternalLink size={20} color="#4F46E5" />}
            label="Become a consultant on Website"
            onPress={handleBecomeConsultant}
          />

          <SettingsRow
            icon={<Calendar size={20} color="#4F46E5" />}
            label="Consultation bookings on Website"
            onPress={handleConsultationsComingSoon}
          />
          </View>
        </View>

        {/* Support section */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Support
          </Text>
          <View className="bg-white border border-indigo-100 rounded-2xl px-4">

          <SettingsRow
            icon={<Settings size={20} color="#222" />}
            label="Get help"
            onPress={() =>
              Linking.openURL('https://oikivo.com/help')
            }
          />
          </View>
        </View>

        {/* Logout */}
        <View className="px-6 mt-8">
          <View className="bg-white border border-red-100 rounded-2xl px-4">
          <SettingsRow
            icon={<LogOut size={20} color="#EF4444" />}
            label="Log out"
            onPress={handleLogout}
            textColor="text-red-500"
          />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
