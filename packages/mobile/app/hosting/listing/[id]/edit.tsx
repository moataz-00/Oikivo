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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Trash2, Camera, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { propertiesApi, categoriesApi, amenitiesApi } from '@/lib/api';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAlert } from '@/components/ui/AlertModal';
import type { Category, SpaceType, Amenity, CancellationPolicy } from '@/types';

const SPACE_TYPES: { value: SpaceType; label: string; description: string }[] = [
  { value: 'entire_place', label: 'Entire place', description: 'Guests have the whole place to themselves' },
  { value: 'private_room', label: 'Private room', description: 'Guests have their own room but share some spaces' },
  { value: 'shared_room', label: 'Shared room', description: 'Guests share a room or common area' },
];

const CANCELLATION_POLICIES: { value: CancellationPolicy; label: string; description: string }[] = [
  { value: 'flexible', label: 'Flexible', description: 'Full refund up to 24h before check-in' },
  { value: 'moderate', label: 'Moderate', description: 'Full refund up to 5 days before check-in' },
  { value: 'strict', label: 'Strict', description: '50% refund up to 7 days before check-in' },
];

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { alert, error: showError } = useAlert();
  const propertyId = parseInt(id!, 10);

  // ---------------------------------------------------------------------------
  // Fetch property
  // ---------------------------------------------------------------------------
  const {
    data: property,
    isLoading: loadingProperty,
    isError,
  } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.getProperty(propertyId),
    enabled: !isNaN(propertyId),
  });

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
  // Form state (initialized once from fetched property)
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
  const [newListingPromoEnabled, setNewListingPromoEnabled] = useState(false);
  const [lastMinuteDiscountPercent, setLastMinuteDiscountPercent] = useState(0);
  const [bookingMode, setBookingMode] = useState<'instant_book' | 'approve_first_three'>('approve_first_three');
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('moderate');
  const [checkInAfter, setCheckInAfter] = useState('15:00');
  const [checkOutBefore, setCheckOutBefore] = useState('11:00');
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [houseRules, setHouseRules] = useState<string[]>(['']);
  const [formInitialized, setFormInitialized] = useState(false);

  // Derive photo list from property (managed server-side, local additions are upload queue)
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  // Initialize form fields when property data arrives
  if (property && !formInitialized) {
    setTitle(property.title ?? '');
    setDescription(property.description ?? '');
    setSpaceType(property.spaceType ?? 'entire_place');
    setPropertyKind(property.propertyKind ?? '');
    setCity(property.city ?? '');
    setCountry(property.country ?? '');
    setLatitude(property.latitude != null ? String(property.latitude) : '');
    setLongitude(property.longitude != null ? String(property.longitude) : '');
    setPricePerNight(String(property.pricePerNight ?? ''));
    setMaxGuests(property.maxGuests ?? 2);
    setBedrooms(property.bedrooms ?? 1);
    setBeds(property.beds ?? 1);
    setBathrooms(property.bathrooms ?? 1);
    setSelectedCategoryId((property as any).categoryId ?? null);
    setWeeklyDiscount(property.weeklyDiscount ?? 0);
    setMonthlyDiscount(property.monthlyDiscount ?? 0);
    setNewListingPromoEnabled(property.newListingPromotionEnabled ?? false);
    setLastMinuteDiscountPercent(property.lastMinuteDiscountPercent ?? 0);
    setBookingMode(property.bookingMode ?? 'approve_first_three');
    setCancellationPolicy(property.cancellationPolicy ?? 'moderate');
    setCheckInAfter(
      property.checkInAfter
        ? property.checkInAfter.substring(0, 5)
        : '15:00',
    );
    setCheckOutBefore(
      property.checkOutBefore
        ? property.checkOutBefore.substring(0, 5)
        : '11:00',
    );
    setSelectedAmenityIds(property.amenities?.map((a) => a.id) ?? []);
    if (property.houseRules && property.houseRules.length > 0) {
      setHouseRules(property.houseRules.map((r) => r.rule));
    }
    setFormInitialized(true);
  }

  // ---------------------------------------------------------------------------
  // Photo helpers
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
      selectionLimit: 20,
    });
    if (!result.canceled) {
      setUploadQueue((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const deleteExistingPhoto = async (photoId: number) => {
    try {
      await propertiesApi.deletePhoto(propertyId, photoId);
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    } catch {
      showError('Error', 'Could not delete photo. Please try again.');
    }
  };

  const setCoverPhoto = async (photoId: number) => {
    try {
      await propertiesApi.setCoverPhoto(propertyId, photoId);
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    } catch {
      showError('Error', 'Could not set cover photo. Please try again.');
    }
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
  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId],
    );
  };

  // ---------------------------------------------------------------------------
  // Update listing mutation
  // ---------------------------------------------------------------------------
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.patch(`/properties/${propertyId}`, data);
      return res.data;
    },
    onSuccess: async () => {
      // Upload queued photos
      if (uploadQueue.length > 0) {
        try {
          await propertiesApi.uploadPhotos(propertyId, uploadQueue);
          setUploadQueue([]);
        } catch {
          // Non-fatal â€” photos can be retried
        }
      }

      // Save house rules
      const validRules = houseRules.filter((r) => r.trim().length > 0).map((r) => ({ rule: r.trim() }));
      try {
        await propertiesApi.updateHouseRules(propertyId, validRules);
      } catch {
        // Non-fatal
      }

      // Save amenities
      if (selectedAmenityIds.length > 0) {
        try {
          await propertiesApi.updateAmenities(propertyId, selectedAmenityIds);
        } catch {
          // Non-fatal
        }
      }

      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });

      alert({
        type: 'success',
        title: 'Saved!',
        message: 'Your listing has been updated.',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update listing. Please try again.';
      showError('Error', message);
    },
  });

  // ---------------------------------------------------------------------------
  // Form validation & submit
  // ---------------------------------------------------------------------------
  const isFormDisabled = isError && !property;

  const isValid =
    !isFormDisabled &&
    title.trim().length > 0 &&
    city.trim().length > 0 &&
    country.trim().length > 0 &&
    parseFloat(pricePerNight) > 0;

  const handleSave = () => {
    if (!isValid) {
      alert({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in at least the title, city, country, and price.',
      });
      return;
    }

    updateMutation.mutate({
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
          disabled={isFormDisabled || value <= min}
          className={`w-9 h-9 rounded-full border items-center justify-center ${
            isFormDisabled || value <= min ? 'border-gray-200 opacity-40' : 'border-gray-400'
          }`}
        >
          <Minus size={16} color="#222" />
        </TouchableOpacity>
        <Text className="mx-5 text-base font-semibold text-gray-900 w-6 text-center">{value}</Text>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={isFormDisabled || value >= max}
          className={`w-9 h-9 rounded-full border items-center justify-center ${
            isFormDisabled || value >= max ? 'border-gray-200 opacity-40' : 'border-gray-400'
          }`}
        >
          <Plus size={16} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loadingProperty) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Edit Listing" />
        <Spinner />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Edit Listing" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error banner */}
          {isError && !property && (
            <View className="flex-row items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4 mb-2">
              <AlertCircle size={18} color="#EF4444" />
              <Text className="flex-1 text-sm text-red-700">
                Failed to load property data. Editing is disabled. Pull down to retry.
              </Text>
            </View>
          )}

          {/* ============================================================ */}
          {/* Photos */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-1">Photos</Text>
          <Text className="text-xs text-gray-500 mb-3">
            Need at least 5 photos to publish. Tap a photo to set as cover.
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {/* Existing server photos */}
            {(property?.photos ?? []).map((photo) => (
              <View key={photo.id} className="relative">
                <TouchableOpacity
                  onPress={() => setCoverPhoto(photo.id)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={{ width: 100, height: 100, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  {photo.isCover && (
                    <View className="absolute top-1 left-1 bg-brand rounded-full px-1.5 py-0.5">
                      <Text className="text-white text-[10px] font-bold">Cover</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteExistingPhoto(photo.id)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
                >
                  <Trash2 size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Queued local photos (staged, uploaded on save) */}
            {uploadQueue.map((uri, idx) => (
              <View key={`q-${idx}`} className="relative">
                <Image
                  source={{ uri }}
                  style={{ width: 100, height: 100, borderRadius: 10, opacity: 0.7 }}
                  resizeMode="cover"
                />
                <View className="absolute top-1 left-1 bg-amber-500 rounded-full px-1.5 py-0.5">
                  <Text className="text-white text-[10px] font-bold">Staged</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setUploadQueue((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
                >
                  <Trash2 size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add photos button */}
            {!isFormDisabled && (
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

          {uploadQueue.length > 0 && (
            <Text className="text-xs text-amber-600 mb-4">
              {uploadQueue.length} photo{uploadQueue.length > 1 ? 's' : ''} staged â€” they will be uploaded when you save.
            </Text>
          )}

          {/* ============================================================ */}
          {/* Basic info */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-2 mb-4">Basic Information</Text>

          <Input
            label="Title"
            placeholder="Give your place a catchy title"
            value={title}
            onChangeText={setTitle}
            editable={!isFormDisabled}
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
            editable={!isFormDisabled}
          />

          {/* ============================================================ */}
          {/* Space type */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">Type of space</Text>

          {SPACE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => !isFormDisabled && setSpaceType(type.value)}
              activeOpacity={0.8}
              className={`p-4 rounded-xl border mb-3 ${
                spaceType === type.value ? 'border-brand bg-brand/5' : 'border-gray-200'
              } ${isFormDisabled ? 'opacity-50' : ''}`}
            >
              <Text className={`text-base font-semibold ${spaceType === type.value ? 'text-brand' : 'text-gray-900'}`}>
                {type.label}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">{type.description}</Text>
            </TouchableOpacity>
          ))}

          <Input
            label="Property kind"
            placeholder="e.g. apartment, villa, house, cabin..."
            value={propertyKind}
            onChangeText={setPropertyKind}
            containerClassName="mt-4"
            editable={!isFormDisabled}
          />

          {/* ============================================================ */}
          {/* Location */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-4">Location</Text>

          <Input label="City" placeholder="City name" value={city} onChangeText={setCity} editable={!isFormDisabled} />
          <Input label="Country" placeholder="Country name" value={country} onChangeText={setCountry} editable={!isFormDisabled} />

          <View className="flex-row gap-3 mb-2">
            <View className="flex-1">
              <Input
                label="Latitude (optional)"
                placeholder="e.g. 30.0444"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
                editable={!isFormDisabled}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Longitude (optional)"
                placeholder="e.g. 31.2357"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
                editable={!isFormDisabled}
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* Check-in / Check-out */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">Check-in & Check-out</Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Input
                label="Check-in after"
                placeholder="15:00"
                value={checkInAfter}
                onChangeText={setCheckInAfter}
                keyboardType="numbers-and-punctuation"
                editable={!isFormDisabled}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Check-out before"
                placeholder="11:00"
                value={checkOutBefore}
                onChangeText={setCheckOutBefore}
                keyboardType="numbers-and-punctuation"
                editable={!isFormDisabled}
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* Pricing */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-2 mb-4">Pricing</Text>

          <Input
            label="Price per night ($)"
            placeholder="0"
            value={pricePerNight}
            onChangeText={setPricePerNight}
            keyboardType="decimal-pad"
            editable={!isFormDisabled}
          />

          {/* ============================================================ */}
          {/* Cancellation policy */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">Cancellation policy</Text>

          {CANCELLATION_POLICIES.map((policy) => (
            <TouchableOpacity
              key={policy.value}
              onPress={() => !isFormDisabled && setCancellationPolicy(policy.value)}
              activeOpacity={0.8}
              className={`p-4 rounded-xl border mb-3 ${
                cancellationPolicy === policy.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              } ${isFormDisabled ? 'opacity-50' : ''}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${cancellationPolicy === policy.value ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {policy.label}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{policy.description}</Text>
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
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">Discounts</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !isFormDisabled && setNewListingPromoEnabled((v) => !v)}
            className={`flex-row items-center justify-between p-4 rounded-xl border mb-3 ${
              newListingPromoEnabled ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            } ${isFormDisabled ? 'opacity-50' : ''}`}
          >
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-sm font-semibold text-gray-900">New listing promotion</Text>
                <View className="rounded-full bg-indigo-100 px-2 py-0.5">
                  <Text className="text-xs font-bold text-indigo-700">20% off</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">Apply to first 3 bookings</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              newListingPromoEnabled ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
            }`}>
              {newListingPromoEnabled && <Text className="text-white text-xs font-bold">âœ“</Text>}
            </View>
          </TouchableOpacity>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Last-minute discount</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0, 5, 10, 15, 20].map((v) => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.8}
                  onPress={() => !isFormDisabled && setLastMinuteDiscountPercent(v)}
                  disabled={isFormDisabled}
                  className={`rounded-full border px-4 py-2 ${
                    lastMinuteDiscountPercent === v ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${lastMinuteDiscountPercent === v ? 'text-white' : 'text-gray-700'}`}>
                    {v === 0 ? 'None' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Weekly discount (7+ nights)</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0, 5, 10, 15, 20, 25].map((v) => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.8}
                  onPress={() => !isFormDisabled && setWeeklyDiscount(v)}
                  disabled={isFormDisabled}
                  className={`rounded-full border px-4 py-2 ${
                    weeklyDiscount === v ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${weeklyDiscount === v ? 'text-white' : 'text-gray-700'}`}>
                    {v === 0 ? 'None' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Monthly discount (28+ nights)</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0, 10, 15, 20, 25, 30].map((v) => (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.8}
                  onPress={() => !isFormDisabled && setMonthlyDiscount(v)}
                  disabled={isFormDisabled}
                  className={`rounded-full border px-4 py-2 ${
                    monthlyDiscount === v ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${monthlyDiscount === v ? 'text-white' : 'text-gray-700'}`}>
                    {v === 0 ? 'None' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* Booking style */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-2 mb-3">Booking style</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !isFormDisabled && setBookingMode('approve_first_three')}
            className={`p-4 rounded-xl border mb-3 ${
              bookingMode === 'approve_first_three' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            } ${isFormDisabled ? 'opacity-50' : ''}`}
          >
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">ðŸ“…</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Approve your first 3 bookings</Text>
                <Text className="text-xs text-gray-500">Review and approve guests until you feel comfortable.</Text>
              </View>
              {bookingMode === 'approve_first_three' && <Text className="text-indigo-600 text-lg font-bold">âœ“</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !isFormDisabled && setBookingMode('instant_book')}
            className={`p-4 rounded-xl border mb-4 ${
              bookingMode === 'instant_book' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            } ${isFormDisabled ? 'opacity-50' : ''}`}
          >
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">âš¡</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Use Instant Book</Text>
                <Text className="text-xs text-gray-500">Guests can book without waiting for approval.</Text>
              </View>
              {bookingMode === 'instant_book' && <Text className="text-indigo-600 text-lg font-bold">âœ“</Text>}
            </View>
          </TouchableOpacity>

          {/* ============================================================ */}
          {/* Space details */}
          {/* ============================================================ */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">Space details</Text>

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
              <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">Category</Text>

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
                      onPress={() => !isFormDisabled && setSelectedCategoryId(isActive ? null : item.id)}
                      activeOpacity={0.8}
                      className={`items-center px-4 py-2.5 rounded-full border ${
                        isActive ? 'bg-brand border-brand' : 'bg-white border-gray-200'
                      } ${isFormDisabled ? 'opacity-50' : ''}`}
                    >
                      <Text className="text-base">{item.icon}</Text>
                      <Text className={`text-xs font-medium mt-0.5 ${isActive ? 'text-white' : 'text-gray-700'}`}>
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
              <Text className="text-lg font-semibold text-gray-900 mt-6 mb-1">Amenities</Text>
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
                      onPress={() => !isFormDisabled && toggleAmenity(amenity.id)}
                      activeOpacity={0.8}
                      className={`flex-row items-center px-3 py-2 rounded-full border ${
                        isActive ? 'bg-brand border-brand' : 'bg-white border-gray-200'
                      } ${isFormDisabled ? 'opacity-50' : ''}`}
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
          <Text className="text-lg font-semibold text-gray-900 mt-6 mb-1">House rules</Text>
          <Text className="text-xs text-gray-500 mb-3">
            At least 1 rule required to publish{' '}
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
                  editable={!isFormDisabled}
                />
              </View>
              {houseRules.length > 1 && !isFormDisabled && (
                <TouchableOpacity onPress={() => removeRule(idx)} className="p-2">
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {!isFormDisabled && (
            <TouchableOpacity onPress={addRule} className="flex-row items-center mt-1 mb-6 py-2">
              <Plus size={16} color="#4F46E5" />
              <Text className="text-brand text-sm font-medium ml-1">Add another rule</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================================ */}
      {/* Save button */}
      {/* ============================================================ */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 pt-3 pb-8">
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={updateMutation.isPending}
          disabled={!isValid}
          size="lg"
        />
      </View>
    </View>
  );
}
