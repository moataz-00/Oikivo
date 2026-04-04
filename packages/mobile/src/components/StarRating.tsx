import React from 'react';
import { View } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 14,
  color = '#FF385C',
  emptyColor = '#D1D5DB',
}: StarRatingProps) {
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            color={filled ? color : emptyColor}
            fill={filled ? color : 'transparent'}
          />
        );
      })}
    </View>
  );
}
