import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/components/ui/AlertModal';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const { success, error: showError } = useAlert();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof usersApi.updateProfile>[0]) =>
      usersApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      success('Success', 'Profile updated successfully.');
      router.back();
    },
    onError: () => {
      showError('Error', 'Failed to update profile. Please try again.');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
    });
  };

  const hasChanges =
    firstName !== (user?.firstName ?? '') ||
    lastName !== (user?.lastName ?? '') ||
    phone !== (user?.phone ?? '') ||
    bio !== (user?.bio ?? '');

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Personal information" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <Input
              label="First name"
              placeholder="Your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />

            <Input
              label="Last name"
              placeholder="Your last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />

            <Input
              label="Phone"
              placeholder="+966 5XX XXX XXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View className="mt-2">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Bio
              </Text>
              <Input
                placeholder="Tell us about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          </Animated.View>

          <View className="mt-6">
            <Button
              title="Save changes"
              onPress={handleSave}
              loading={updateMutation.isPending}
              disabled={!hasChanges || updateMutation.isPending}
            />
          </View>

          {/* Verification status */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="mt-8 p-4 bg-gray-50 rounded-2xl"
          >
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Verification
            </Text>
            <VerificationRow
              label="Email address"
              verified={user?.isEmailVerified ?? false}
            />
            <VerificationRow
              label="Phone number"
              verified={user?.isPhoneVerified ?? false}
            />
            <VerificationRow
              label="Government ID"
              verified={user?.isIdVerified ?? false}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function VerificationRow({
  label,
  verified,
}: {
  label: string;
  verified: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-gray-700">{label}</Text>
      <Text
        className={`text-sm font-medium ${
          verified ? 'text-green-600' : 'text-gray-400'
        }`}
      >
        {verified ? 'Verified' : 'Not verified'}
      </Text>
    </View>
  );
}
