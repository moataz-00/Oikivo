import React from 'react';
import { View, Text, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe } from 'lucide-react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';

export default function HostingWebRedirectScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Hosting" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center mb-4">
          <Globe size={30} color="#4F46E5" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center">
          Manage Hosting on Website
        </Text>
        <Text className="text-sm text-gray-600 text-center mt-2">
          Host tools are available on the Oikivo web platform for the full experience.
        </Text>

        <Button
          title="Open Hosting Platform"
          onPress={() => Linking.openURL('https://oikivo.com/hosting')}
          className="mt-6 w-full"
        />
      </View>
    </SafeAreaView>
  );
}
