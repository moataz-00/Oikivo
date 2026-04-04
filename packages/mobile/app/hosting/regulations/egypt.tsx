import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
  ExternalLink,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  {
    number: 1,
    title: 'Register on the MoTA Portal',
    description:
      'Create an account on the MoTA official portal (mota.gov.eg) and navigate to the Holiday Home License section.',
  },
  {
    number: 2,
    title: 'Prepare required documents',
    description:
      'National ID, property deed or lease, engineering survey, building permit, insurance certificate, and a recent utility bill.',
  },
  {
    number: 3,
    title: 'Submit & pay the fee',
    description:
      'Upload all documents and pay the administrative registration fee set by MoTA.',
  },
  {
    number: 4,
    title: 'Inspection & approval',
    description:
      'A MoTA inspector may visit to verify compliance. Approval is typically issued within 30 working days.',
  },
  {
    number: 5,
    title: 'Display your license number',
    description:
      'Once approved, add your license number to your listing and all advertising materials.',
  },
];

const REQUIREMENTS = [
  'Unit must meet MoTA minimum furnishing & safety standards',
  'Fire extinguisher and smoke detector must be installed',
  'First-aid kit must be available on premises',
  'Host must maintain a guest register for each stay',
  'Occupancy may not exceed approved capacity',
  'License must be renewed annually',
  'Tourism Tax must be collected and remitted',
];

const PENALTIES = [
  { label: 'Operating without a license', penalty: 'EGP 10K–100K fine + unit seizure' },
  { label: 'Failure to display license number', penalty: 'Warning + EGP 5K fine' },
  { label: 'Exceeding approved capacity', penalty: 'EGP 5K–20K + license suspension' },
  { label: 'No guest register', penalty: 'EGP 2K–10K fine' },
  { label: 'Repeated violations', penalty: 'License revocation + prosecution' },
];

export default function EgyptRegulationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="bg-indigo-900 px-5 pt-4 pb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1 mb-4"
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color="#a5b4fc" />
          <Text className="text-indigo-300 text-sm">Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-4xl">🇪🇬</Text>
          <View className="flex-1">
            <Text className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">
              Regulation Guide
            </Text>
            <Text className="text-white text-xl font-bold leading-snug">
              Short-Term Rental Regulations in Egypt
            </Text>
          </View>
        </View>

        <Text className="text-indigo-200 text-sm leading-relaxed">
          Holiday Home License from MoTA — Decrees No. 209/2025 and No. 801/2025.
        </Text>

        <View className="flex-row items-center gap-2 mt-4 bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-2 self-start">
          <AlertTriangle size={14} color="#fbbf24" />
          <Text className="text-amber-300 text-xs font-medium">Compliance required under Decree 209/2025</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }}
      >
        {/* Overview */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-3">
            <FileText size={18} color="#4f46e5" />
            <Text className="text-lg font-bold text-gray-900">Overview</Text>
          </View>
          <Text className="text-sm text-gray-600 leading-relaxed">
            Egypt's Ministry of Tourism &amp; Antiquities issued Decree No. 209 of 2025 (supplemented by
            Decree No. 801 of 2025), establishing a formal <Text className="font-semibold">Holiday Home
            License</Text> framework for privately owned or rented units offered to tourists for short-term stays.
          </Text>
          <Text className="text-sm text-gray-600 leading-relaxed mt-3">
            Any host listing a property in Egypt must obtain this license before accepting bookings.
            Failure to comply may result in significant fines and administrative action.
          </Text>
        </View>

        {/* Requirements */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-3">
            <CheckCircle size={18} color="#4f46e5" />
            <Text className="text-lg font-bold text-gray-900">Key Requirements</Text>
          </View>
          {REQUIREMENTS.map((req) => (
            <View key={req} className="flex-row items-start gap-3 mb-3">
              <CheckCircle size={15} color="#22c55e" style={{ marginTop: 2 }} />
              <Text className="text-sm text-gray-700 flex-1">{req}</Text>
            </View>
          ))}
        </View>

        {/* How to apply */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <FileText size={18} color="#4f46e5" />
            <Text className="text-lg font-bold text-gray-900">How to Apply</Text>
          </View>
          {STEPS.map((step, index) => (
            <View key={step.number} className="flex-row gap-4 mb-5">
              <View className="items-center">
                <View className="w-9 h-9 rounded-full bg-indigo-600 items-center justify-center">
                  <Text className="text-white text-sm font-bold">{step.number}</Text>
                </View>
                {index < STEPS.length - 1 && (
                  <View className="w-0.5 flex-1 bg-indigo-100 mt-1" />
                )}
              </View>
              <View className="flex-1 pt-1.5">
                <Text className="text-sm font-semibold text-gray-900 mb-1">{step.title}</Text>
                <Text className="text-xs text-gray-500 leading-relaxed">{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Penalties */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-3">
            <Shield size={18} color="#ef4444" />
            <Text className="text-lg font-bold text-gray-900">Penalties for Non-Compliance</Text>
          </View>
          <View className="rounded-xl border border-red-100 overflow-hidden">
            {PENALTIES.map((row, i) => (
              <View
                key={row.label}
                className={`px-4 py-3 ${i < PENALTIES.length - 1 ? 'border-b border-red-50' : ''}`}
              >
                <Text className="text-xs font-semibold text-gray-700 mb-0.5">{row.label}</Text>
                <Text className="text-xs text-red-700">{row.penalty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Why it protects you */}
        <View className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 mb-8">
          <Text className="text-base font-bold text-indigo-900 mb-3">Why Licensing Protects You</Text>
          {[
            'Gives you legal standing in guest disputes',
            'Enables you to collect Tourism Tax and issue official receipts',
            'Qualifies your listing for premium visibility on platforms',
            'Demonstrates credibility and increases bookings',
            'Protects against administrative closure of your property',
          ].map((point) => (
            <View key={point} className="flex-row items-start gap-2 mb-2">
              <CheckCircle size={14} color="#6366f1" style={{ marginTop: 2 }} />
              <Text className="text-sm text-indigo-800 flex-1">{point}</Text>
            </View>
          ))}
        </View>

        {/* Official resources */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">Official Resources</Text>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.mota.gov.eg')}
            activeOpacity={0.8}
            className="flex-row items-center justify-between rounded-xl border border-gray-200 px-4 py-4 mb-3"
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-gray-900">MoTA Official Portal</Text>
              <Text className="text-xs text-gray-500 mt-0.5">mota.gov.eg — Ministry of Tourism & Antiquities</Text>
            </View>
            <ExternalLink size={16} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'https://amereller.com/publication/new-holiday-homes-regulation-in-egypt-a-structured-regime-for-short-term-rentals-ministry-of-tourism-decrees-no-209-2025-and-no-801-2025/',
              )
            }
            activeOpacity={0.8}
            className="flex-row items-center justify-between rounded-xl border border-gray-200 px-4 py-4"
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-gray-900">Legal Analysis — Amereller</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Analysis of Decrees 209/2025 &amp; 801/2025</Text>
            </View>
            <ExternalLink size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text className="text-xs text-gray-400 leading-relaxed">
          <Text className="font-semibold">Disclaimer:</Text> This page is for informational purposes only and
          does not constitute legal advice. Regulations may change; always consult the official MoTA portal or
          a qualified Egyptian lawyer for guidance specific to your situation.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
