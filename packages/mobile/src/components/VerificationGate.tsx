import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Mail, Phone, CreditCard, X, AlertTriangle } from 'lucide-react-native';
import { User } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VerificationStep {
  key: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  done: boolean;
  route?: string;
}

interface VerificationGateProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  /** Shown in the header, e.g. "book this property" or "create a listing" */
  context?: string;
}

// ---------------------------------------------------------------------------
// VerificationGate
// ---------------------------------------------------------------------------

export default function VerificationGate({
  visible,
  onClose,
  user,
  context = 'continue',
}: VerificationGateProps) {
  const router = useRouter();

  if (!user) return null;

  const idDone =
    !!user.idVerificationStatus && user.idVerificationStatus !== 'none';

  const steps: VerificationStep[] = [
    {
      key: 'email',
      icon: <Mail size={22} color={user.isEmailVerified ? '#16a34a' : '#d97706'} />,
      title: 'Verify email address',
      subtitle: user.isEmailVerified
        ? 'Email verified'
        : 'Check your inbox for a verification link',
      done: user.isEmailVerified,
    },
    {
      key: 'phone',
      icon: <Phone size={22} color={user.isPhoneVerified ? '#16a34a' : '#d97706'} />,
      title: 'Verify phone number',
      subtitle: user.isPhoneVerified
        ? 'Phone verified'
        : 'Add and verify a WhatsApp number',
      done: user.isPhoneVerified,
      route: '/profile/edit',
    },
    {
      key: 'id',
      icon: <CreditCard size={22} color={idDone ? '#16a34a' : '#d97706'} />,
      title: 'Upload ID document',
      subtitle: idDone
        ? user.idVerificationStatus === 'approved'
          ? 'Identity verified'
          : 'Document submitted — under review'
        : 'Upload your national ID or passport',
      done: idDone,
      route: '/profile/verify-id',
    },
  ];

  const allDone = steps.every((s) => s.done);
  const pending = steps.filter((s) => !s.done);

  const handleStepPress = (step: VerificationStep) => {
    if (step.done || !step.route) return;
    onClose();
    router.push(step.route as any);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl pb-10">
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-5 z-10 p-1"
          >
            <X size={22} color="#6b7280" />
          </TouchableOpacity>

          <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="items-center mb-5">
              <View className="w-14 h-14 rounded-full bg-amber-50 items-center justify-center mb-3">
                <AlertTriangle size={28} color="#d97706" />
              </View>
              <Text className="text-xl font-bold text-gray-900 text-center">
                Verification required
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-1.5">
                Complete the steps below to {context}
              </Text>
            </View>

            {/* Steps */}
            <View className="gap-3 mb-6">
              {steps.map((step) => (
                <TouchableOpacity
                  key={step.key}
                  activeOpacity={step.done || !step.route ? 1 : 0.7}
                  onPress={() => handleStepPress(step)}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    step.done
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <View className="mr-4">{step.icon}</View>
                  <View className="flex-1">
                    <Text
                      className={`font-semibold text-sm ${
                        step.done ? 'text-green-800' : 'text-amber-900'
                      }`}
                    >
                      {step.title}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${
                        step.done ? 'text-green-600' : 'text-amber-700'
                      }`}
                    >
                      {step.subtitle}
                    </Text>
                  </View>
                  {step.done ? (
                    <ShieldCheck size={18} color="#16a34a" />
                  ) : step.route ? (
                    <Text className="text-xs text-amber-700 font-medium">Go →</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            {/* CTA */}
            {!allDone && pending.length > 0 && pending[0].route && (
              <TouchableOpacity
                onPress={() => handleStepPress(pending[0])}
                className="bg-rose-500 rounded-2xl py-4 items-center mb-3"
              >
                <Text className="text-white font-bold text-base">
                  Complete verification
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              className="py-3 items-center mb-2"
            >
              <Text className="text-gray-500 text-sm">Not now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
