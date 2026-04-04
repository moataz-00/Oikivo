import React from 'react';
import { Stack } from 'expo-router';

export default function HostingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
