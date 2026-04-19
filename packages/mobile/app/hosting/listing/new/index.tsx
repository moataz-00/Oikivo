import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Minus, Plus, Trash2, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { categoriesApi, amenitiesApi, propertiesApi } from '@/lib/api';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/components/ui/AlertModal';
import type { Category, SpaceType, Amenity, CancellationPolicy } from '@/types';

const SPACE_TYPES: { value: SpaceType; label: string; description: string }[] =
  [
    {
      value: 'entire_place',
      label: 'Entire place',
      description: 'Guests have the whole place to themselves',
    },
    {
      value: 'private_room',
      label: 'Private room',
      description: 'Guests have their own room but share some spaces',
    },
    {
      value: 'shared_room',
      label: 'Shared room',
      description: 'Guests share a room or common area',
    },
  ];

const CANCELLATION_POLICIES: { value: CancellationPolicy; label: string; description: string }[] = [
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'Full refund up to 24h before check-in',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Full refund up to 5 days before check-in',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: '50% refund up to 7 days before check-in',
  },
];

export default function NewListingScreen() {
  const router = useRouter();
  const { alert, error: showError } = useAlert();

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>('entire_place');
  const [propertyKind, setPropertyKind] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);
  const [newListingPromoEnabled, setNewListingPromoEnabled] = useState(true);
  const [lastMinuteDiscountPercent, setLastMinuteDiscountPercent] = useState(0);
  const [bookingMode, setBookingMode] = useState<'instant_book' | 'approve_first_three'>('approve_first_three');
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('moderate');
  const [checkInAfter, setCheckInAfter] = useState('15:00');
  const [checkOutBefore, setCheckOutBefore] = useState('11:00');

  // Amenities
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);

  // House rules
  const [houseRules, setHouseRules] = useState<string[]>(['']);

  // Photos
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // Fetch categories & amenities
  // ---------------------------------------------------------------------------
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: 1000 * 60 * 10,
  });

  const { data: amenities = [] } = useQuery({
    queryKey: ['amenities'],
    queryFn: amenitiesApi.getAmenities,
    staleTime: 1000 * 60 * 10,
  });

  // ---------------------------------------------------------------------------
  // Photo picker
  // ---------------------------------------------------------------------------
  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20 - photoUris.length,
    });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (coverIndex >= next.length) setCoverIndex(0);
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // House rules helpers
  // ---------------------------------------------------------------------------
  const addRule = () => setHouseRules((prev) => [...prev, '']);
  const updateRule = (idx: number, val: string) =>
    setHouseRules((prev) => prev.map((r, i) => (i === idx ? val : r)));
  const removeRule = (idx: number) =>
    setHouseRules((prev) => prev.filter((_, i) => i !== idx));

  // ---------------------------------------------------------------------------
  // Amenity toggle
  // ---------------------------------------------------------------------------
  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  // ---------------------------------------------------------------------------
  // Create listing mutation
  // ---------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/properties', data);
      return res.data;
    },
    onSuccess: async (property) => {
      const propertyId: number = property.id;

      // Upload photos if any
      if (photoUris.length > 0) {
        try {
          await propertiesApi.uploadPhotos(propertyId, photoUris);
          if (photoUris.length > 1) {
            const uploadedPhotos = (await propertiesApi.getProperty(propertyId)).photos;
            if (uploadedPhotos?.[coverIndex]) {
              await propertiesApi.setCoverPhoto(propertyId, uploadedPhotos[coverIndex].id);
            }
          }
        } catch {
          // Non-fatal - host can add photos from edit
        }
      }

      // Save house rules
      const validRules = houseRules.filter((r) => r.trim().length > 0).map((r) => ({ rule: r.trim() }));
      if (validRules.length > 0) {
        try {
          await propertiesApi.updateHouseRules(propertyId, validRules);
        } catch {
          // Non-fatal
        }
      }

      // Save amenities
      if (selectedAmenityIds.length > 0) {
        try {
          await propertiesApi.updateAmenities(propertyId, selectedAmenityIds);
        } catch {
          // Non-fatal
        }
      }

      alert({
        type: 'success',
        title: 'Listing created!',
        message: photoUris.length < 5
          ? 'Your listing was saved as a draft. Add at least 5 photos to publish.'
          : validRules.length === 0
          ? 'Your listing was saved. Add at least 1 house rule to publish.'
          : selectedAmenityIds.length < 3
          ? 'Your listing was saved. Select at least 3 amenities to publish.'
          : 'Your listing is ready to publish!',
        buttons: [
          {
            text: 'View Listings',
            onPress: () => router.replace('/hosting/listings'),
          },
        ],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to create listing. Please try again.';
      showError('Error', message);
    },
  });

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------
  const isValid =
    title.trim().length > 0 &&
    city.trim().length > 0 &&
    country.trim().length > 0 &&
    parseFloat(pricePerNight) > 0;

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  const handleCreate = () => {
    if (!isValid) {
      alert({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in at least the title, city, country, and price.',
      });
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      spaceType,
      propertyKind: propertyKind.trim() || 'apartment',
      city: city.trim(),
      country: country.trim(),
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      pricePerNight: parseFloat(pricePerNight),
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      categoryId: selectedCategoryId,
      weeklyDiscount,
      monthlyDiscount,
      newListingPromotionEnabled: newListingPromoEnabled,
      lastMinuteDiscountPercent,
      bookingMode,
      instantBook: bookingMode === 'instant_book',
      cancellationPolicy,
      checkInAfter: `${checkInAfter}:00`,
      checkOutBefore: `${checkOutBefore}:00`,
    });
  };

  // ---------------------------------------------------------------------------
  // Number input component
  // ---------------------------------------------------------------------------
  const NumberInput = ({
    label,
    value,
    onIncrement,
    onDecrement,
    min = 0,
    max = 20,
  }: {
    label: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min?: number;
    max?: number;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <Text className="text-base text-gray-900">{label}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={onDecrement}
          disabled={value <= min}
          className={`w-9 h-9 rounded-full border items-center justify-center ${
            value <= min
              ? 'border-gray-200 opacity-40'
              : 'border-gray-400'
          }`}
        >
          <Minus size={16} color="#222" />
        </TouchableOpacity>
        <Text className="mx-5 text-base font-semibold text-gray-900 w-6 text-center">
          {value}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={value >= max}
          className={`w-9 h-9 rounded-full border items-center justify-center ${
            value >= max
              ? 'border-gray-200 opacity-40'
              : 'border-gray-400'
          }`}
        >
          <Plus size={16} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Create a Listing" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============================================================ */}
          {/* Basic info */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-4">
            Basic Information
          </Text>

          <Input
            label="Title"
            placeholder="Give your place a catchy title"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Description"
            placeholder="Describe what makes your place special..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            inputClassName="min-h-[100px] py-3"
            style={{ textAlignVertical: 'top' }}
          />

          {/* ============================================================ */}
          {/* Space type */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">
            Type of space
          </Text>

          {SPACE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setSpaceType(type.value)}
              activeOpacity={0.8}
              className={`p-4 rounded-xl border mb-3 ${
                spaceType === type.value
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200'
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  spaceType === type.value
                    ? 'text-brand'
                    : 'text-gray-900'
                }`}
              >
                {type.label}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                {type.description}
              </Text>
            </TouchableOpacity>
          ))}

          {/* ============================================================ */}
          {/* Property kind */}
          {/* ============================================================ */}
          <Input
            label="Property kind"
            placeholder="e.g. apartment, villa, house, cabin..."
            value={propertyKind}
            onChangeText={setPropertyKind}
            containerClassName="mt-4"
          />

          {/* ============================================================ */}
          {/* Location */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-4">
            Location
          </Text>

          <Input
            label="City"
            placeholder="City name"
            value={city}
            onChangeText={setCity}
          />

          <Input
            label="Country"
            placeholder="Country name"
            value={country}
            onChangeText={setCountry}
          />

          <View className="flex-row gap-3 mb-2">
            <View className="flex-1">
              <Input
                label="Latitude (optional)"
                placeholder="e.g. 30.0444"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Longitude (optional)"
                placeholder="e.g. 31.2357"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* Check-in / Check-out */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">
            Check-in & Check-out
          </Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Input
                label="Check-in after"
                placeholder="15:00"
                value={checkInAfter}
                onChangeText={setCheckInAfter}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Check-out before"
                placeholder="11:00"
                value={checkOutBefore}
                onChangeText={setCheckOutBefore}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* Pricing */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-4">
            Pricing
          </Text>

          <Input
            label="Price per night ($)"
            placeholder="0"
            value={pricePerNight}
            onChangeText={setPricePerNight}
            keyboardType="decimal-pad"
          />

          {/* ============================================================ */}
          {/* Cancellation policy */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Cancellation policy
          </Text>

          {CANCELLATION_POLICIES.map((policy) => (
            <TouchableOpacity
              key={policy.value}
              onPress={() => setCancellationPolicy(policy.value)}
              activeOpacity={0.8}
              className={`p-4 rounded-xl border mb-3 ${
                cancellationPolicy === policy.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${
                    cancellationPolicy === policy.value ? 'text-indigo-700' : 'text-gray-900'
                  }`}>
                    {policy.label}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {policy.description}
                  </Text>
                </View>
                {cancellationPolicy === policy.value && (
                  <Text className="text-indigo-600 text-lg font-bold ml-3">âœ“</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* ============================================================ */}
          {/* Discounts */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Discounts
          </Text>

          {/* New listing promotion */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setNewListingPromoEnabled((v) => !v)}
            className={`flex-row items-center justify-between p-4 rounded-xl border mb-3 ${
              newListingPromoEnabled ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            }`}
          >
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-sm font-semibold text-gray-900">New listing promotion</Text>
                <View className="rounded-full bg-indigo-100 px-2 py-0.5">
                  <Text className="text-xs font-bold text-indigo-700">20% off</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">Apply to your first 3 bookings to attract early guests</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              newListingPromoEnabled ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
            }`}>
              {newListingPromoEnabled && <Text className="text-white text-xs font-bold">âœ“</Text>}
            </View>
          </TouchableOpacity>

          {/* Last-minute discount */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Last-minute discount</Text>
            <Text className="text-xs text-gray-500 mb-3">For bookings 14 days or less before arrival</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0, 5, 10, 15, 20].map((v) => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.8}
                  onPress={() => setLastMinuteDiscountPercent(v)}
                  className={`rounded-full border px-4 py-2 ${
                    lastMinuteDiscountPercent === v
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    lastMinuteDiscountPercent === v ? 'text-white' : 'text-gray-700'
                  }`}>
                    {v === 0 ? 'None' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weekly discount */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Weekly discount (7+ nights)</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0, 5, 10, 15, 20, 25].map((v) => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.8}
                  onPress={() => setWeeklyDiscount(v)}
                  className={`rounded-full border px-4 py-2 ${
                    weeklyDiscount === v
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    weeklyDiscount === v ? 'text-white' : 'text-gray-700'
                  }`}>
                    {v === 0 ? 'None' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Monthly discount */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Monthly discount (28+ nights)</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0, 10, 15, 20, 25, 30].map((v) => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.8}
                  onPress={() => setMonthlyDiscount(v)}
                  className={`rounded-full border px-4 py-2 ${
                    monthlyDiscount === v
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    monthlyDiscount === v ? 'text-white' : 'text-gray-700'
                  }`}>
                    {v === 0 ? 'None' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* Booking style */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-2 mb-3">
            Booking style
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBookingMode('approve_first_three')}
            className={`p-4 rounded-xl border mb-3 ${
              bookingMode === 'approve_first_three' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            }`}
          >
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">ðŸ“…</Text>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-sm font-semibold text-gray-900">Approve your first 3 bookings</Text>
                </View>
                <View className="self-start rounded-full bg-green-100 px-2 py-0.5 mb-2">
                  <Text className="text-xs font-medium text-green-700">Recommended</Text>
                </View>
                <Text className="text-xs text-gray-500">Review and approve guests until you feel comfortable, then switch to Instant Book.</Text>
              </View>
              {bookingMode === 'approve_first_three' && (
                <Text className="text-indigo-600 text-lg font-bold">âœ“</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBookingMode('instant_book')}
            className={`p-4 rounded-xl border mb-4 ${
              bookingMode === 'instant_book' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            }`}
          >
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">âš¡</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Use Instant Book</Text>
                <Text className="text-xs text-gray-500">Guests can book without waiting for approval. Great for maximizing occupancy.</Text>
              </View>
              {bookingMode === 'instant_book' && (
                <Text className="text-indigo-600 text-lg font-bold">âœ“</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* ============================================================ */}
          {/* Details */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            Space details
          </Text>

          <NumberInput
            label="Max guests"
            value={maxGuests}
            onIncrement={() => setMaxGuests((v) => v + 1)}
            onDecrement={() => setMaxGuests((v) => v - 1)}
            min={1}
            max={20}
          />
          <NumberInput
            label="Bedrooms"
            value={bedrooms}
            onIncrement={() => setBedrooms((v) => v + 1)}
            onDecrement={() => setBedrooms((v) => v - 1)}
            min={0}
            max={20}
          />
          <NumberInput
            label="Beds"
            value={beds}
            onIncrement={() => setBeds((v) => v + 1)}
            onDecrement={() => setBeds((v) => v - 1)}
            min={1}
            max={30}
          />
          <NumberInput
            label="Bathrooms"
            value={bathrooms}
            onIncrement={() => setBathrooms((v) => v + 1)}
            onDecrement={() => setBathrooms((v) => v - 1)}
            min={0}
            max={10}
          />

          {/* ============================================================ */}
          {/* Category */}
          {/* ============================================================ */}
          {categories.length > 0 && (
            <>
              <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                Category
              </Text>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => {
                  const isActive = selectedCategoryId === item.id;
                  return (
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedCategoryId(
                          isActive ? null : item.id,
                        )
                      }
                      activeOpacity={0.8}
                      className={`items-center px-4 py-2.5 rounded-full border ${
                        isActive
                          ? 'bg-brand border-brand'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className="text-base">{item.icon}</Text>
                      <Text
                        className={`text-xs font-medium mt-0.5 ${
                          isActive ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          {/* ============================================================ */}
          {/* Amenities */}
          {/* ============================================================ */}
          {amenities.length > 0 && (
            <>
              <Text className="text-lg font-semibold text-gray-900 mt-6 mb-1">
                Amenities
              </Text>
              <Text className="text-xs text-gray-500 mb-3">
                Select at least 3 to publish{' '}
                <Text className={selectedAmenityIds.length >= 3 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                  ({selectedAmenityIds.length} selected)
                </Text>
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {amenities.map((amenity: Amenity) => {
                  const isActive = selectedAmenityIds.includes(amenity.id);
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      onPress={() => toggleAmenity(amenity.id)}
                      activeOpacity={0.8}
                      className={`flex-row items-center px-3 py-2 rounded-full border ${
                        isActive
                          ? 'bg-brand border-brand'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className="text-sm mr-1">{amenity.icon}</Text>
                      <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                        {amenity.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ============================================================ */}
          {/* House rules */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-1">
            House rules
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Add at least 1 rule to publish{' '}
            <Text className={houseRules.filter((r) => r.trim()).length >= 1 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
              ({houseRules.filter((r) => r.trim()).length} added)
            </Text>
          </Text>

          {houseRules.map((rule, idx) => (
            <View key={idx} className="flex-row items-center gap-2 mb-2">
              <View className="flex-1">
                <Input
                  placeholder={`Rule ${idx + 1}, e.g. No pets`}
                  value={rule}
                  onChangeText={(val) => updateRule(idx, val)}
                />
              </View>
              {houseRules.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeRule(idx)}
                  className="p-2"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={addRule}
            className="flex-row items-center mt-1 mb-6 py-2"
          >
            <Plus size={16} color="#4F46E5" />
            <Text className="text-brand text-sm font-medium ml-1">Add another rule</Text>
          </TouchableOpacity>

          {/* ============================================================ */}
          {/* Photos */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-2 mb-1">
            Photos
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Add at least 5 photos to publish{' '}
            <Text className={photoUris.length >= 5 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
              ({photoUris.length}/5 minimum)
            </Text>
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {photoUris.map((uri, idx) => (
              <View key={idx} className="relative">
                <TouchableOpacity onPress={() => setCoverIndex(idx)} activeOpacity={0.85}>
                  <Image
                    source={{ uri }}
                    style={{ width: 100, height: 100, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  {coverIndex === idx && (
                    <View className="absolute top-1 left-1 bg-brand rounded-full px-1.5 py-0.5">
                      <Text className="text-white text-[10px] font-bold">Cover</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
                >
                  <Trash2 size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {photoUris.length < 20 && (
              <TouchableOpacity
                onPress={pickPhotos}
                activeOpacity={0.8}
                className="w-[100px] h-[100px] rounded-xl border-2 border-dashed border-gray-300 items-center justify-center"
              >
                <Camera size={24} color="#9CA3AF" />
                <Text className="text-xs text-gray-400 mt-1">Add photos</Text>
              </TouchableOpacity>
            )}
          </View>

          {photoUris.length > 1 && (
            <Text className="text-xs text-gray-500 mb-4">
              Tap a photo to set it as the cover photo.
            </Text>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================================ */}
      {/* Create button */}
      {/* ============================================================ */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 pt-3 pb-8">
        <Button
          title="Create Listing"
          onPress={handleCreate}
          loading={createMutation.isPending}
          disabled={!isValid}
          size="lg"
        />
      </View>
    </View>
  );
}
