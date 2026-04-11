import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { AlertProvider } from '@/components/ui/AlertModal';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient
      colors={['#4F46E5', '#4338CA', '#3730A3']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="flex-1 items-center justify-center">
        <Animated.View entering={ZoomIn.duration(600).springify()}>
          <View className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-6">
            <Text className="text-white text-3xl font-bold">O</Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(300).duration(500)}
          className="text-white text-4xl font-bold mb-2"
        >
          Oikivo
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(500).duration(500)}
          className="text-white/70 text-base mb-10"
        >
          Find your perfect stay
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(800).duration(400)}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
        </Animated.View>
      </View>
    </LinearGradient>
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
        <AlertProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="rooms/[id]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="search/index"
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
          <Stack.Screen
            name="profile/edit"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="profile/notifications"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="inbox/[conversationId]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="consultations/index"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="consultations/[id]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="consultations/book"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="consultations/my-bookings"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
        </AlertProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
