import React from 'react';
import { View, Text } from 'react-native';
import { getImageUrl, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/StarRating';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  /** Display as a compact horizontal card (e.g. in a horizontal scroll) */
  compact?: boolean;
}

export function ReviewCard({ review, compact = false }: ReviewCardProps) {
  const reviewerName = `${review.reviewer.firstName} ${review.reviewer.lastName}`;
  const reviewerAvatar = getImageUrl(review.reviewer.avatarUrl);

  if (compact) {
    return (
      <View
        className="mr-4 bg-white border border-gray-200 rounded-xl p-4"
        style={{ width: 280 }}
      >
        {/* Reviewer info */}
        <View className="flex-row items-center mb-2">
          <Avatar uri={reviewerAvatar} name={reviewerName} size={36} />
          <View className="ml-2 flex-1">
            <Text className="text-sm font-semibold text-gray-900">
              {reviewerName}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <StarRating rating={review.overallRating} size={12} />

        {/* Comment */}
        {review.comment ? (
          <Text className="text-sm text-gray-700 mt-2" numberOfLines={4}>
            {review.comment}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="border-b border-gray-100 py-4">
      {/* Reviewer info */}
      <View className="flex-row items-center mb-3">
        <Avatar uri={reviewerAvatar} name={reviewerName} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {reviewerName}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatDate(review.createdAt)}
          </Text>
        </View>
      </View>

      {/* Rating */}
      <View className="mb-2">
        <StarRating rating={review.overallRating} size={14} />
      </View>

      {/* Sub-ratings */}
      {(review.cleanlinessRating ||
        review.accuracyRating ||
        review.communicationRating ||
        review.locationRating ||
        review.valueRating ||
        review.checkinRating) && (
        <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-2">
          {review.cleanlinessRating ? (
            <Text className="text-xs text-gray-500">
              Cleanliness: {review.cleanlinessRating}/5
            </Text>
          ) : null}
          {review.accuracyRating ? (
            <Text className="text-xs text-gray-500">
              Accuracy: {review.accuracyRating}/5
            </Text>
          ) : null}
          {review.communicationRating ? (
            <Text className="text-xs text-gray-500">
              Communication: {review.communicationRating}/5
            </Text>
          ) : null}
          {review.locationRating ? (
            <Text className="text-xs text-gray-500">
              Location: {review.locationRating}/5
            </Text>
          ) : null}
          {review.valueRating ? (
            <Text className="text-xs text-gray-500">
              Value: {review.valueRating}/5
            </Text>
          ) : null}
          {review.checkinRating ? (
            <Text className="text-xs text-gray-500">
              Check-in: {review.checkinRating}/5
            </Text>
          ) : null}
        </View>
      )}

      {/* Comment */}
      {review.comment ? (
        <Text className="text-sm text-gray-700 leading-5">
          {review.comment}
        </Text>
      ) : null}

      {/* Host reply */}
      {review.hostReply ? (
        <View className="mt-3 bg-gray-50 rounded-xl p-3">
          <Text className="text-xs font-semibold text-gray-900 mb-1">
            Host reply
          </Text>
          <Text className="text-sm text-gray-700">{review.hostReply}</Text>
        </View>
      ) : null}
    </View>
  );
}
