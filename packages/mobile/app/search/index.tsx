import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Star, Filter, X, Search } from 'lucide-react-native';
import { searchApi } from '@/lib/api';
import type { SearchParams } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PropertyListItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // ---------------------------------------------------------------------------
  // Search state
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SearchParams['sortBy']>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Submitted search params
  const [searchParams, setSearchParams] = useState<SearchParams>({
    limit: 20,
  });

  // ---------------------------------------------------------------------------
  // Fetch results
  // ---------------------------------------------------------------------------
  const {
    data: resultsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['searchResults', searchParams],
    queryFn: () => searchApi.searchProperties(searchParams),
  });

  const results = resultsData?.data ?? [];
  const totalResults = resultsData?.total ?? 0;

  // ---------------------------------------------------------------------------
  // Submit search
  // ---------------------------------------------------------------------------
  const handleSearch = useCallback(() => {
    const params: SearchParams = {
      limit: 20,
      sortBy,
    };
    if (location.trim()) params.city = location.trim();
    if (searchQuery.trim()) params.query = searchQuery.trim();
    if (guests.trim()) params.guests = parseInt(guests, 10) || undefined;
    if (minPrice.trim()) params.minPrice = parseInt(minPrice, 10) || undefined;
    if (maxPrice.trim()) params.maxPrice = parseInt(maxPrice, 10) || undefined;

    setSearchParams(params);
    setShowFilters(false);
  }, [location, searchQuery, guests, minPrice, maxPrice, sortBy]);

  // ---------------------------------------------------------------------------
  // Clear filters
  // ---------------------------------------------------------------------------
  const handleClearFilters = useCallback(() => {
    setLocation('');
    setGuests('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchQuery('');
    setSearchParams({ limit: 20 });
    setShowFilters(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Property card
  // ---------------------------------------------------------------------------
  const renderPropertyCard = useCallback(
    ({ item }: { item: PropertyListItem }) => {
      const imageUrl =
        getImageUrl(item.coverPhoto) ??
        'https://via.placeholder.com/400x300?text=No+Image';

      return (
        <TouchableOpacity
          onPress={() => router.push(`/rooms/${item.id}`)}
          activeOpacity={0.95}
          className="mb-5 mx-6 bg-white rounded-xl overflow-hidden border border-gray-100"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
          <View className="p-3.5">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[15px] font-semibold text-gray-900 flex-1"
                numberOfLines={1}
              >
                {item.city}, {item.country}
              </Text>
              {item.avgRating > 0 && (
                <View className="flex-row items-center ml-2">
                  <Star size={13} color="#222" fill="#222" />
                  <Text className="text-sm text-gray-900 ml-1">
                    {item.avgRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-sm text-gray-500 mt-0.5"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View className="flex-row items-center mt-1.5">
              <Text className="text-sm text-gray-500">
                {item.bedrooms} bed{item.bedrooms !== 1 ? 's' : ''} -{' '}
                {item.maxGuests} guest{item.maxGuests !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text className="text-[15px] mt-1.5">
              <Text className="font-semibold">
                {formatPrice(item.pricePerNight, item.currency)}
              </Text>
              <Text className="text-gray-500"> / night</Text>
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [router],
  );

  // ---------------------------------------------------------------------------
  // Sort options
  // ---------------------------------------------------------------------------
  const sortOptions: { key: SearchParams['sortBy']; label: string }[] = [
    { key: 'newest', label: 'Newest' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Best Rated' },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Search"
        rightAction={
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Filter size={20} color="#222" />
          </TouchableOpacity>
        }
      />

      {/* Search input */}
      <View className="px-6 py-3 flex-row items-center border-b border-gray-100">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
          <Search size={18} color="#717171" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by location or name..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            className="flex-1 ml-2 text-base text-gray-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#717171" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSearch}
          className="ml-3 bg-brand rounded-xl px-4 py-2.5"
        >
          <Text className="text-white font-semibold text-sm">Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {totalResults > 0 && (
        <View className="px-6 py-2">
          <Text className="text-sm text-gray-500">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} found
          </Text>
        </View>
      )}

      {/* Results list */}
      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPropertyCard}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <Search size={48} color="#717171" />
              <Text className="text-base text-gray-500 mt-4 text-center">
                No results found. Try adjusting your search or filters.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        />
      )}

      {/* ================================================================ */}
      {/* Filter Modal */}
      {/* ================================================================ */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          {/* Modal header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={22} color="#222" />
            </TouchableOpacity>
            <Text className="text-base font-semibold text-gray-900">
              Filters
            </Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text className="text-sm text-brand font-semibold">
                Clear all
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter content */}
          <View className="flex-1 px-6 pt-6">
            <Input
              label="City / Location"
              placeholder="e.g. Paris, Tokyo..."
              value={location}
              onChangeText={setLocation}
            />

            <Input
              label="Number of guests"
              placeholder="1"
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Min price ($)"
                  placeholder="0"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Max price ($)"
                  placeholder="1000"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Sort */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Sort by
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key)}
                  className={`px-4 py-2 rounded-full border ${
                    sortBy === option.key
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      sortBy === option.key
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Apply button */}
          <View className="px-6 pb-8 pt-4 border-t border-gray-200">
            <Button title="Show results" onPress={handleSearch} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
