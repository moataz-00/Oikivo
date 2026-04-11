import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react-native';
import { reviewsApi } from '@/lib/api';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/components/ui/AlertModal';

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <Text className="text-base text-gray-700">{label}</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            color={star <= value ? '#FBBF24' : '#D1D5DB'}
            fill={star <= value ? '#FBBF24' : 'transparent'}
            onPress={() => onChange(star)}
          />
        ))}
      </View>
    </View>
  );
}

export default function WriteReviewScreen() {
  const { bookingId, propertyId } = useLocalSearchParams<{
    bookingId: string;
    propertyId: string;
  }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { alert, error: showError } = useAlert();

  const [overall, setOverall] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [location, setLocation] = useState(0);
  const [value, setValue] = useState(0);
  const [checkin, setCheckin] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.createReview({
        bookingId: parseInt(bookingId!, 10),
        overallRating: overall,
        cleanlinessRating: cleanliness || undefined,
        accuracyRating: accuracy || undefined,
        communicationRating: communication || undefined,
        locationRating: location || undefined,
        valueRating: value || undefined,
        checkinRating: checkin || undefined,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propertyReviews'] });
      qc.invalidateQueries({ queryKey: ['myTrips'] });
      alert({
        type: 'success',
        title: 'Thank you!',
        message: 'Your review has been submitted.',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ?? 'Failed to submit review.';
      showError('Error', msg);
    },
  });

  const canSubmit = overall > 0;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Write a review" />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          How was your stay?
        </Text>

        <RatingRow label="Overall" value={overall} onChange={setOverall} />
        <RatingRow
          label="Cleanliness"
          value={cleanliness}
          onChange={setCleanliness}
        />
        <RatingRow label="Accuracy" value={accuracy} onChange={setAccuracy} />
        <RatingRow
          label="Communication"
          value={communication}
          onChange={setCommunication}
        />
        <RatingRow label="Location" value={location} onChange={setLocation} />
        <RatingRow label="Value" value={value} onChange={setValue} />
        <RatingRow label="Check-in" value={checkin} onChange={setCheckin} />

        <Text className="text-base font-semibold text-gray-900 mt-6 mb-2">
          Leave a comment (optional)
        </Text>
        <TextInput
          className="border border-gray-200 rounded-xl p-4 text-base text-gray-900 min-h-[120px]"
          value={comment}
          onChangeText={setComment}
          multiline
          textAlignVertical="top"
          placeholder="Tell others about your experience..."
          placeholderTextColor="#9CA3AF"
        />

        <Button
          title={mutation.isPending ? 'Submitting...' : 'Submit review'}
          onPress={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="mt-8"
        />
      </ScrollView>
    </View>
  );
}
