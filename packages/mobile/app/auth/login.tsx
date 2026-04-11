import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const authLogin = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------
  const isValid = email.trim().length > 0 && password.length >= 8;

  // ---------------------------------------------------------------------------
  // Handle login
  // ---------------------------------------------------------------------------
  const handleLogin = async () => {
    if (!isValid) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await authApi.login(email.trim(), password);
      await authLogin(result.user, result.accessToken);
      router.back();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branded header */}
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 pt-6 pb-8 rounded-b-3xl"
          >
            <Animated.View entering={FadeInDown.duration(400)}>
              <Text className="text-3xl font-bold text-white mb-1">
                Welcome back
              </Text>
              <Text className="text-base text-white/70">
                Log in to your Oikivo account
              </Text>
            </Animated.View>
          </LinearGradient>

          <View className="px-6 pt-8">
          {/* Error message */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Mail size={18} color="#717171" />}
          />

          {/* Password */}
          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={<Lock size={18} color="#717171" />}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#717171" />
                ) : (
                  <Eye size={18} color="#717171" />
                )}
              </TouchableOpacity>
            }
          />

          {/* Login button */}
          <Button
            title="Log in"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!isValid}
            className="mt-4"
            size="lg"
          />

          {/* Register link */}
          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-base text-gray-500">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/auth/register')}
            >
              <Text className="text-base font-semibold text-brand">
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
