import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFromName(name?: string): string {
  const palette = [
    '#4F46E5', '#00A699', '#FC642D', '#484848', '#767676',
    '#FF5A5F', '#087E8B', '#FF9F1C', '#2EC4B6', '#E71D36',
  ];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Avatar({ uri, name, size = 40, className }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = colorFromName(name);
  const fontSize = Math.round(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        className={className}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
      }}
      className={clsx('items-center justify-center', className)}
    >
      <Text style={{ fontSize, color: '#fff', fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}
