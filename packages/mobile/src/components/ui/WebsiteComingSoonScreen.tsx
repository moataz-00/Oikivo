import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';

interface WebsiteComingSoonScreenProps {
  title: string;
  heading: string;
  message: string;
  websiteUrl: string;
  websiteLabel?: string;
}

export function WebsiteComingSoonScreen({
  title,
  heading,
  message,
  websiteUrl,
  websiteLabel = 'Open Website',
}: WebsiteComingSoonScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 pt-2 pb-3 border-b border-indigo-100 bg-indigo-50 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-lg text-gray-900">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">{title}</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-3xl bg-brand-50 items-center justify-center mb-5">
          <Globe size={34} color="#4F46E5" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center">
          {heading}
        </Text>
        <Text className="text-sm text-gray-600 text-center mt-3 leading-6">
          {message}
        </Text>

        <Button
          title={websiteLabel}
          onPress={() => Linking.openURL(websiteUrl)}
          className="mt-7 w-full"
          icon={<ExternalLink size={16} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
}
