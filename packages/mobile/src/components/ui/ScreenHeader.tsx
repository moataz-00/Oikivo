import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScreenHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScreenHeader({
  title,
  showBack = true,
  onBack,
  rightAction,
  transparent = false,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      className={
        transparent
          ? 'absolute top-0 left-0 right-0 z-10'
          : 'bg-white border-b border-gray-100'
      }
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center px-4 h-14">
        {/* Back button */}
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/90 shadow-sm mr-2"
          >
            <ChevronLeft size={22} color="#222" />
          </TouchableOpacity>
        ) : (
          <View className="w-12" />
        )}

        {/* Title */}
        <View className="flex-1 items-center">
          {title ? (
            <Text
              className="text-base font-semibold text-gray-900"
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right action */}
        <View className="w-10 items-end">{rightAction ?? null}</View>
      </View>
    </View>
  );
}
