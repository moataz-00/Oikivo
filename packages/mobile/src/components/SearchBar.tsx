import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin } from 'lucide-react-native';

interface SearchBarProps {
  location?: string;
  dates?: string;
  guests?: number;
  onPress?: () => void;
}

export function SearchBar({ location, dates, guests, onPress }: SearchBarProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/search');
    }
  };

  const subtitle =
    [dates, guests ? `${guests} guests` : null]
      .filter(Boolean)
      .join(' · ') || 'Any week · Add guests';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="mx-4 bg-white rounded-full border border-gray-200 shadow-sm flex-row items-center px-4 py-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Search size={18} color="#222" strokeWidth={2.5} />

      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-gray-900">
          {location ?? 'Where to?'}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
      </View>

      {location ? (
        <View className="w-8 h-8 rounded-full border border-gray-200 items-center justify-center">
          <MapPin size={14} color="#FF385C" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
