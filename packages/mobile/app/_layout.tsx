import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-brand">
      <Text className="text-white text-4xl font-bold mb-4">Sakan</Text>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

export default function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="rooms/[id]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="search"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="booking/[propertyId]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="auth/login"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="auth/register"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="hosting"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="profile/[id]"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
