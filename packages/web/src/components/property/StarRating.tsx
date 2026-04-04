'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;
          return (
            <span key={i} className="relative inline-block">
              <Star
                className={cn(
                  sizeMap[size],
                  'fill-neutral-200 text-neutral-200'
                )}
              />
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : `${(rating - Math.floor(rating)) * 100}%` }}
                >
                  <Star className={cn(sizeMap[size], 'fill-neutral-900 text-neutral-900')} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-neutral-900">{rating.toFixed(2)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-neutral-500">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
