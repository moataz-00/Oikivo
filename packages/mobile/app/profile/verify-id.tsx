import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Upload,
} from 'lucide-react-native';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAlert } from '@/components/ui/AlertModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DocType = 'national_id' | 'passport';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VerifyIdScreen() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();
  const { alert } = useAlert();
  const queryClient = useQueryClient();

  const [docType, setDocType] = useState<DocType>('national_id');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [step, setStep] = useState<'choose' | 'upload' | 'done'>('choose');
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [frontDone, setFrontDone] = useState(false);
  const [backDone, setBackDone] = useState(false);

  // Already submitted
  const alreadySubmitted =
    !!user?.idVerificationStatus && user.idVerificationStatus !== 'none';

  // ---------------------------------------------------------------------------
  // Image picker
  // ---------------------------------------------------------------------------

  const pickImage = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library to upload ID documents.',
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  };

  const takePhoto = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow camera access to take a photo of your ID.',
      );
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  };

  // ---------------------------------------------------------------------------
  // Pick handlers
  // ---------------------------------------------------------------------------

  const handlePickFront = () => {
    Alert.alert('Upload front', 'Choose a source', [
      { text: 'Camera', onPress: async () => { const u = await takePhoto(); if (u) setFrontUri(u); } },
      { text: 'Photo library', onPress: async () => { const u = await pickImage(); if (u) setFrontUri(u); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePickBack = () => {
    Alert.alert('Upload back', 'Choose a source', [
      { text: 'Camera', onPress: async () => { const u = await takePhoto(); if (u) setBackUri(u); } },
      { text: 'Photo library', onPress: async () => { const u = await pickImage(); if (u) setBackUri(u); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Upload handlers
  // ---------------------------------------------------------------------------

  const handleUploadFront = async () => {
    if (!frontUri) return;
    setUploadingFront(true);
    try {
      await usersApi.uploadIdDocumentFront(frontUri, docType);
      setFrontDone(true);
      // Refresh user profile
      const updated = await usersApi.getMe();
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.message ?? 'Could not upload document. Please try again.');
    } finally {
      setUploadingFront(false);
    }
  };

  const handleUploadBack = async () => {
    if (!backUri) return;
    setUploadingBack(true);
    try {
      await usersApi.uploadIdDocumentBack(backUri);
      setBackDone(true);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.message ?? 'Could not upload document. Please try again.');
    } finally {
      setUploadingBack(false);
    }
  };

  const handleFinish = () => {
    alert({
      type: 'success',
      title: 'Documents submitted!',
      message:
        'Your ID is now under review. We\'ll notify you once verified (usually 1–2 business days).',
      buttons: [{ text: 'OK', onPress: () => router.back() }],
    });
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const readyToSubmit = frontUri && (docType === 'passport' || !!backUri);
  const allUploaded =
    frontDone && (docType === 'passport' || backDone);

  // ---------------------------------------------------------------------------
  // Render: already submitted
  // ---------------------------------------------------------------------------

  if (alreadySubmitted) {
    const statusLabel = {
      pending: 'Under review',
      approved: 'Verified ✓',
      rejected: 'Rejected',
      none: '',
    }[user?.idVerificationStatus ?? 'none'];

    const statusColor = {
      pending: 'text-amber-600',
      approved: 'text-green-600',
      rejected: 'text-red-600',
      none: 'text-gray-500',
    }[user?.idVerificationStatus ?? 'none'];

    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="ID Verification" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-amber-50 items-center justify-center mb-4">
            <CreditCard size={30} color="#d97706" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Document submitted
          </Text>
          <Text className={`text-base font-semibold mb-3 ${statusColor}`}>
            {statusLabel}
          </Text>
          {user?.idVerificationStatus === 'pending' && (
            <Text className="text-sm text-gray-500 text-center">
              Your ID is being reviewed by our team. This usually takes 1–2
              business days.
            </Text>
          )}
          {user?.idVerificationStatus === 'rejected' && (
            <Text className="text-sm text-red-500 text-center mb-6">
              Your document was rejected. Please re-upload a clear photo.
            </Text>
          )}
          {user?.idVerificationStatus === 'rejected' && (
            <TouchableOpacity
              className="mt-4 bg-rose-500 rounded-2xl px-8 py-4"
              onPress={() => {
                setFrontDone(false);
                setBackDone(false);
                setFrontUri(null);
                setBackUri(null);
              }}
            >
              <Text className="text-white font-bold">Re-upload document</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: step = 'choose'
  // ---------------------------------------------------------------------------

  if (step === 'choose') {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="ID Verification" />
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Verify your identity
          </Text>
          <Text className="text-sm text-gray-500 mb-8">
            We need to verify who you are before you can book or host.
            Upload a clear photo of a valid government-issued ID.
          </Text>

          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Choose document type
          </Text>

          {/* National ID option */}
          <TouchableOpacity
            onPress={() => setDocType('national_id')}
            className={`flex-row items-center p-4 rounded-2xl border mb-3 ${
              docType === 'national_id'
                ? 'border-rose-400 bg-rose-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center mr-4">
              <CreditCard size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">National ID</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                Front + back sides required
              </Text>
            </View>
            {docType === 'national_id' && <Check size={20} color="#e11d48" />}
          </TouchableOpacity>

          {/* Passport option */}
          <TouchableOpacity
            onPress={() => setDocType('passport')}
            className={`flex-row items-center p-4 rounded-2xl border mb-8 ${
              docType === 'passport'
                ? 'border-rose-400 bg-rose-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View className="w-12 h-12 rounded-xl bg-purple-50 items-center justify-center mr-4">
              <BookOpen size={24} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Passport</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                Photo page only
              </Text>
            </View>
            {docType === 'passport' && <Check size={20} color="#e11d48" />}
          </TouchableOpacity>

          {/* Tips */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-8">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Tips for a good photo
            </Text>
            {[
              'Make sure all 4 corners are visible',
              'Take photo in good lighting (avoid shadows)',
              'All text must be clearly readable',
              'Do not cover any part of the document',
            ].map((tip, i) => (
              <View key={i} className="flex-row items-start mt-1.5">
                <Text className="text-gray-400 mr-2 text-xs mt-0.5">•</Text>
                <Text className="text-xs text-gray-500 flex-1">{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setStep('upload')}
            className="bg-rose-500 rounded-2xl py-4 items-center mb-10"
          >
            <Text className="text-white font-bold text-base">Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: step = 'upload'
  // ---------------------------------------------------------------------------

  const frontLabel = docType === 'passport' ? 'Passport photo page' : 'Front side';

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Upload Documents" />
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-gray-900 mb-1">
          {docType === 'national_id' ? 'National ID' : 'Passport'}
        </Text>
        <Text className="text-sm text-gray-500 mb-6">
          Upload clear photos of your document.
        </Text>

        {/* Front / Passport */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {frontLabel}
        </Text>
        <TouchableOpacity
          onPress={handlePickFront}
          disabled={frontDone}
          className={`rounded-2xl border-2 border-dashed items-center justify-center mb-2 overflow-hidden ${
            frontDone ? 'border-green-400' : 'border-gray-300'
          }`}
          style={{ height: 160 }}
        >
          {frontUri ? (
            <Image source={{ uri: frontUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Upload size={30} color="#9ca3af" />
              <Text className="text-sm text-gray-400 mt-2">Tap to upload</Text>
            </View>
          )}
          {frontDone && (
            <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <Check size={14} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {frontUri && !frontDone && (
          <TouchableOpacity
            onPress={handleUploadFront}
            disabled={uploadingFront}
            className="bg-rose-500 rounded-xl py-3 items-center mb-4"
          >
            {uploadingFront ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-semibold">Upload {frontLabel}</Text>
            )}
          </TouchableOpacity>
        )}
        {frontDone && (
          <Text className="text-green-600 text-sm font-medium mb-4">
            ✓ {frontLabel} uploaded
          </Text>
        )}

        {/* Back side (national ID only) */}
        {docType === 'national_id' && (
          <>
            <Text className="text-sm font-semibold text-gray-700 mb-2 mt-2">
              Back side
            </Text>
            <TouchableOpacity
              onPress={handlePickBack}
              disabled={backDone}
              className={`rounded-2xl border-2 border-dashed items-center justify-center mb-2 overflow-hidden ${
                backDone ? 'border-green-400' : 'border-gray-300'
              }`}
              style={{ height: 160 }}
            >
              {backUri ? (
                <Image source={{ uri: backUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <Upload size={30} color="#9ca3af" />
                  <Text className="text-sm text-gray-400 mt-2">Tap to upload</Text>
                </View>
              )}
              {backDone && (
                <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                  <Check size={14} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {backUri && !backDone && (
              <TouchableOpacity
                onPress={handleUploadBack}
                disabled={uploadingBack || !frontDone}
                className={`rounded-xl py-3 items-center mb-4 ${
                  frontDone ? 'bg-rose-500' : 'bg-gray-300'
                }`}
              >
                {uploadingBack ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className={`font-semibold ${frontDone ? 'text-white' : 'text-gray-500'}`}>
                    Upload back side
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {!frontDone && backUri && (
              <Text className="text-amber-600 text-xs mb-4">
                Upload the front side first.
              </Text>
            )}
            {backDone && (
              <Text className="text-green-600 text-sm font-medium mb-4">
                ✓ Back side uploaded
              </Text>
            )}
          </>
        )}

        {/* Finish button */}
        {allUploaded && (
          <TouchableOpacity
            onPress={handleFinish}
            className="bg-green-500 rounded-2xl py-4 items-center mt-4 mb-10"
          >
            <Text className="text-white font-bold text-base">Done — submission complete</Text>
          </TouchableOpacity>
        )}

        {!allUploaded && (
          <View className="h-10" />
        )}
      </ScrollView>
    </View>
  );
}
