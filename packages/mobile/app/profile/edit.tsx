import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronDown, Check, Search, X, ChevronRight } from 'lucide-react-native';
import { usersApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/components/ui/AlertModal';

// ---------------------------------------------------------------------------
// Country dial-code data with emoji flags
// ---------------------------------------------------------------------------
interface Country {
  name: string;
  dial: string;
  code: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: 'Egypt', dial: '+20', code: 'EG', flag: '\uD83C\uDDEA\uD83C\uDDEC' },
  { name: 'Saudi Arabia', dial: '+966', code: 'SA', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { name: 'United Arab Emirates', dial: '+971', code: 'AE', flag: '\uD83C\uDDE6\uD83C\uDDEA' },
  { name: 'Kuwait', dial: '+965', code: 'KW', flag: '\uD83C\uDDF0\uD83C\uDDFC' },
  { name: 'Qatar', dial: '+974', code: 'QA', flag: '\uD83C\uDDF6\uD83C\uDDE6' },
  { name: 'Bahrain', dial: '+973', code: 'BH', flag: '\uD83C\uDDE7\uD83C\uDDED' },
  { name: 'Oman', dial: '+968', code: 'OM', flag: '\uD83C\uDDF4\uD83C\uDDF2' },
  { name: 'Jordan', dial: '+962', code: 'JO', flag: '\uD83C\uDDEF\uD83C\uDDF4' },
  { name: 'Lebanon', dial: '+961', code: 'LB', flag: '\uD83C\uDDF1\uD83C\uDDE7' },
  { name: 'Iraq', dial: '+964', code: 'IQ', flag: '\uD83C\uDDEE\uD83C\uDDF6' },
  { name: 'Palestine', dial: '+970', code: 'PS', flag: '\uD83C\uDDF5\uD83C\uDDF8' },
  { name: 'Libya', dial: '+218', code: 'LY', flag: '\uD83C\uDDF1\uD83C\uDDFE' },
  { name: 'Tunisia', dial: '+216', code: 'TN', flag: '\uD83C\uDDF9\uD83C\uDDF3' },
  { name: 'Algeria', dial: '+213', code: 'DZ', flag: '\uD83C\uDDE9\uD83C\uDDFF' },
  { name: 'Morocco', dial: '+212', code: 'MA', flag: '\uD83C\uDDF2\uD83C\uDDE6' },
  { name: 'Sudan', dial: '+249', code: 'SD', flag: '\uD83C\uDDF8\uD83C\uDDE9' },
  { name: 'Yemen', dial: '+967', code: 'YE', flag: '\uD83C\uDDFE\uD83C\uDDEA' },
  { name: 'Syria', dial: '+963', code: 'SY', flag: '\uD83C\uDDF8\uD83C\uDDFE' },
  { name: 'Turkey', dial: '+90', code: 'TR', flag: '\uD83C\uDDF9\uD83C\uDDF7' },
  { name: 'United States', dial: '+1', code: 'US', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { name: 'United Kingdom', dial: '+44', code: 'GB', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { name: 'France', dial: '+33', code: 'FR', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { name: 'Germany', dial: '+49', code: 'DE', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { name: 'Canada', dial: '+1', code: 'CA', flag: '\uD83C\uDDE8\uD83C\uDDE6' },
  { name: 'Australia', dial: '+61', code: 'AU', flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  { name: 'India', dial: '+91', code: 'IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { name: 'Pakistan', dial: '+92', code: 'PK', flag: '\uD83C\uDDF5\uD83C\uDDF0' },
  { name: 'Bangladesh', dial: '+880', code: 'BD', flag: '\uD83C\uDDE7\uD83C\uDDE9' },
  { name: 'Nigeria', dial: '+234', code: 'NG', flag: '\uD83C\uDDF3\uD83C\uDDEC' },
  { name: 'South Africa', dial: '+27', code: 'ZA', flag: '\uD83C\uDDFF\uD83C\uDDE6' },
  { name: 'Kenya', dial: '+254', code: 'KE', flag: '\uD83C\uDDF0\uD83C\uDDEA' },
  { name: 'Indonesia', dial: '+62', code: 'ID', flag: '\uD83C\uDDEE\uD83C\uDDE9' },
  { name: 'Malaysia', dial: '+60', code: 'MY', flag: '\uD83C\uDDF2\uD83C\uDDFE' },
  { name: 'Philippines', dial: '+63', code: 'PH', flag: '\uD83C\uDDF5\uD83C\uDDED' },
  { name: 'China', dial: '+86', code: 'CN', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { name: 'Japan', dial: '+81', code: 'JP', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { name: 'South Korea', dial: '+82', code: 'KR', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { name: 'Russia', dial: '+7', code: 'RU', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { name: 'Brazil', dial: '+55', code: 'BR', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { name: 'Mexico', dial: '+52', code: 'MX', flag: '\uD83C\uDDF2\uD83C\uDDFD' },
  { name: 'Argentina', dial: '+54', code: 'AR', flag: '\uD83C\uDDE6\uD83C\uDDF7' },
  { name: 'Spain', dial: '+34', code: 'ES', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { name: 'Italy', dial: '+39', code: 'IT', flag: '\uD83C\uDDEE\uD83C\uDDF9' },
  { name: 'Netherlands', dial: '+31', code: 'NL', flag: '\uD83C\uDDF3\uD83C\uDDF1' },
  { name: 'Sweden', dial: '+46', code: 'SE', flag: '\uD83C\uDDF8\uD83C\uDDEA' },
  { name: 'Switzerland', dial: '+41', code: 'CH', flag: '\uD83C\uDDE8\uD83C\uDDED' },
  { name: 'Poland', dial: '+48', code: 'PL', flag: '\uD83C\uDDF5\uD83C\uDDF1' },
  { name: 'Ukraine', dial: '+380', code: 'UA', flag: '\uD83C\uDDFA\uD83C\uDDE6' },
];

function parsePhone(fullPhone: string): { country: Country; local: string } {
  if (!fullPhone) return { country: COUNTRIES[0], local: '' };
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (fullPhone.startsWith(c.dial)) {
      return { country: c, local: fullPhone.slice(c.dial.length) };
    }
  }
  return { country: COUNTRIES[0], local: fullPhone };
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const { success, error: showError } = useAlert();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  // Phone: split into country dial code + local number
  const parsed = parsePhone(user?.phone ?? '');
  const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country);
  const [localPhone, setLocalPhone] = useState(parsed.local);

  // Country picker modal
  const [pickerVisible, setPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  const fullPhone = localPhone.trim() ? `${selectedCountry.dial}${localPhone.trim()}` : '';

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
      phone: fullPhone || undefined,
      bio: bio.trim() || undefined,
    });
  };

  const handleSendOtp = async () => {
    if (!fullPhone) return;
    setIsSendingOtp(true);
    setOtpError('');
    try {
      // If phone changed, save it first so the backend can read it
      if (fullPhone !== (user?.phone ?? '')) {
        const updated = await usersApi.updateProfile({ phone: fullPhone });
        setUser(updated);
      }
      await authApi.sendPhoneVerification();
      setOtpSent(true);
      setOtp('');
    } catch (e: any) {
      setOtpError(e?.response?.data?.message ?? 'Failed to send code. Try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      await authApi.verifyPhone(otp);
      // Refresh user so isPhoneVerified becomes true
      const updated = await usersApi.getMe();
      setUser(updated);
      setOtpSent(false);
      setOtp('');
      success('Phone verified', 'Your WhatsApp number has been verified.');
    } catch (e: any) {
      setOtpError(e?.response?.data?.message ?? 'Invalid code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const hasChanges =
    firstName !== (user?.firstName ?? '') ||
    lastName !== (user?.lastName ?? '') ||
    fullPhone !== (user?.phone ?? '') ||
    bio !== (user?.bio ?? '');

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch),
  );

  // Phone verified status from store (may update after OTP verify)
  const isPhoneVerified = user?.isPhoneVerified ?? false;
  const canVerifyPhone = !!fullPhone && !isPhoneVerified;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Personal information" />

      {/* ── Country picker modal ─────────────────────────────────────── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">Select country</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-4 py-3">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
              <Search size={16} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-sm text-gray-900"
                placeholder="Search country or code"
                placeholderTextColor="#9CA3AF"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />
              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch('')}>
                  <X size={14} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCountry(item);
                  setPickerVisible(false);
                  setCountrySearch('');
                  setOtpSent(false);
                }}
                activeOpacity={0.7}
                className="flex-row items-center px-5 py-3.5 border-b border-gray-50"
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                <Text className="flex-1 text-sm text-gray-900">{item.name}</Text>
                <Text className="text-sm text-gray-500 mr-3">{item.dial}</Text>
                {selectedCountry.code === item.code && (
                  <Check size={16} color="#4F46E5" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

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

            {/* ── Phone number field ────────────────────────────────── */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Phone number</Text>

              <View className="flex-row items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* Country picker button */}
                <TouchableOpacity
                  onPress={() => setPickerVisible(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-3.5 border-r border-gray-200 bg-gray-50"
                >
                  <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                  <Text className="text-sm font-medium text-gray-700 mx-1.5">{selectedCountry.dial}</Text>
                  <ChevronDown size={14} color="#6B7280" />
                </TouchableOpacity>

                {/* Number input */}
                <TextInput
                  className="flex-1 px-3 py-3.5 text-sm text-gray-900"
                  placeholder="5XX XXX XXXX"
                  placeholderTextColor="#9CA3AF"
                  value={localPhone}
                  onChangeText={(v) => {
                    setLocalPhone(v);
                    setOtpSent(false);
                  }}
                  keyboardType="phone-pad"
                />
              </View>

              {/* WhatsApp note */}
              <View className="flex-row items-center mt-1.5">
                <Text style={{ fontSize: 13 }}>💬</Text>
                <Text className="text-xs text-gray-500 ml-1">
                  This number must have WhatsApp — the verification code will be sent there.
                </Text>
              </View>
            </View>

            {/* ── Phone verification section ────────────────────────── */}
            {canVerifyPhone && (
              <View className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl">
                {!otpSent ? (
                  <>
                    <Text className="text-sm font-semibold text-gray-800 mb-1">
                      Verify your WhatsApp number
                    </Text>
                    <Text className="text-xs text-gray-500 mb-3">
                      We'll send a 6-digit code to your WhatsApp at{' '}
                      <Text className="font-medium text-gray-700">{fullPhone}</Text>
                    </Text>
                    {otpError ? (
                      <Text className="text-xs text-red-500 mb-2">{otpError}</Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={isSendingOtp}
                      activeOpacity={0.8}
                      className="flex-row items-center justify-center py-2.5 bg-brand rounded-lg"
                    >
                      <Text className="text-sm font-semibold text-white">
                        {isSendingOtp ? 'Sending…' : 'Send WhatsApp code'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text className="text-sm font-semibold text-gray-800 mb-1">
                      Enter the code
                    </Text>
                    <Text className="text-xs text-gray-500 mb-3">
                      A 6-digit code was sent to your WhatsApp at{' '}
                      <Text className="font-medium text-gray-700">{fullPhone}</Text>
                    </Text>
                    <TextInput
                      className="border border-gray-200 rounded-lg px-4 py-3 text-center text-xl font-bold tracking-widest text-gray-900 bg-white mb-3"
                      placeholder="• • • • • •"
                      placeholderTextColor="#D1D5DB"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {otpError ? (
                      <Text className="text-xs text-red-500 mb-2">{otpError}</Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      disabled={otp.length !== 6 || isVerifyingOtp}
                      activeOpacity={0.8}
                      className={`py-2.5 rounded-lg items-center ${otp.length === 6 ? 'bg-brand' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-sm font-semibold ${otp.length === 6 ? 'text-white' : 'text-gray-400'}`}>
                        {isVerifyingOtp ? 'Verifying…' : 'Confirm code'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setOtpSent(false)} className="mt-2 items-center">
                      <Text className="text-xs text-brand">Resend or change number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {isPhoneVerified && fullPhone && (
              <View className="flex-row items-center mb-4 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                <Check size={14} color="#16A34A" />
                <Text className="text-xs text-green-700 ml-1.5 font-medium">WhatsApp number verified</Text>
              </View>
            )}

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
              status={user?.idVerificationStatus}
              onPress={() => router.push('/profile/verify-id')}
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
  status,
  onPress,
}: {
  label: string;
  verified: boolean;
  status?: string | null;
  onPress?: () => void;
}) {
  const statusLabel = verified
    ? 'Verified'
    : status === 'pending'
    ? 'Under review'
    : status === 'rejected'
    ? 'Rejected — re-upload'
    : 'Not verified';

  const statusColor = verified
    ? 'text-green-600'
    : status === 'pending'
    ? 'text-amber-600'
    : status === 'rejected'
    ? 'text-red-500'
    : 'text-gray-400';

  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
      className="flex-row items-center justify-between py-2"
    >
      <Text className="text-sm text-gray-700">{label}</Text>
      <View className="flex-row items-center gap-1">
        <Text className={`text-sm font-medium ${statusColor}`}>
          {statusLabel}
        </Text>
        {onPress && !verified && (
          <ChevronRight size={14} color="#9ca3af" />
        )}
      </View>
    </Wrapper>
  );
}
