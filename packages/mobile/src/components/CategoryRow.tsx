import React from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/types';
import clsx from 'clsx';

// Default categories shown when API returns nothing
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Beachfront', nameAr: 'شاطئي', icon: '🏖️' },
  { id: 2, name: 'Mountain', nameAr: 'جبلي', icon: '⛰️' },
  { id: 3, name: 'City', nameAr: 'مدينة', icon: '🏙️' },
  { id: 4, name: 'Countryside', nameAr: 'ريف', icon: '🌾' },
  { id: 5, name: 'Pools', nameAr: 'مسابح', icon: '🏊' },
  { id: 6, name: 'Camping', nameAr: 'تخييم', icon: '⛺' },
  { id: 7, name: 'Luxe', nameAr: 'فاخر', icon: '💎' },
  { id: 8, name: 'Islands', nameAr: 'جزر', icon: '🏝️' },
];

interface CategoryRowProps {
  selectedCategoryId?: number | null;
  onSelect?: (category: Category | null) => void;
}

export function CategoryRow({
  selectedCategoryId,
  onSelect,
}: CategoryRowProps) {
  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <View className="mt-4">
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => {
          const isActive = selectedCategoryId === item.id;
          return (
            <TouchableOpacity
              onPress={() => onSelect?.(isActive ? null : item)}
              activeOpacity={0.8}
              className={clsx(
                'items-center justify-center px-4 py-2 rounded-full border',
                isActive
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-white border-gray-200',
              )}
            >
              <Text className="text-lg mb-0.5">{item.icon}</Text>
              <Text
                className={clsx(
                  'text-xs font-medium',
                  isActive ? 'text-white' : 'text-gray-700',
                )}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
