import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';

export default function HostingLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && pathname !== '/hosting') {
      router.replace('/hosting');
    }
  }, [pathname, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="listings" />
      <Stack.Screen name="reservations" />
      <Stack.Screen name="listing/new/index" />
      <Stack.Screen name="listing/[id]/edit" />
      <Stack.Screen name="listing/[id]/calendar" />
      <Stack.Screen name="regulations/egypt" />
    </Stack>
  );
}
