import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Tag,
} from 'lucide-react-native';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns';
import { availabilityApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAlert } from '@/components/ui/AlertModal';

export default function CalendarManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { alert, success, error: showError, confirm } = useAlert();
  const propertyId = parseInt(id!, 10);

  const today = useMemo(() => startOfDay(new Date()), []);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [tab, setTab] = useState<'block' | 'pricing'>('block');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [seasonalPrice, setSeasonalPrice] = useState('');

  const monthStr = format(currentMonth, 'yyyy-MM');

  // ---------------------------------------------------------------------------
  // Fetch calendar data
  // ---------------------------------------------------------------------------
  const {
    data: calendarData = [],
    isLoading,
  } = useQuery({
    queryKey: ['calendar', propertyId, monthStr],
    queryFn: () => availabilityApi.getCalendar(propertyId, monthStr),
    enabled: !isNaN(propertyId),
  });

  // Build a set of blocked dates for quick lookup
  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    calendarData.forEach((d) => {
      if (!d.available) {
        set.add(d.date);
      }
    });
    return set;
  }, [calendarData]);

  // ---------------------------------------------------------------------------
  // Seasonal pricing mutation
  // ---------------------------------------------------------------------------
  const seasonalPricingMutation = useMutation({
    mutationFn: availabilityApi.setSeasonalPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', propertyId] });
      setSelectedStart(null);
      setSelectedEnd(null);
      setSeasonalPrice('');
      success('Saved', 'Seasonal pricing has been applied to the selected dates.');
    },
    onError: () => {
      showError('Error', 'Failed to set seasonal pricing. Please try again.');
    },
  });

  // ---------------------------------------------------------------------------
  // Block dates mutation
  // ---------------------------------------------------------------------------
  const blockMutation = useMutation({
    mutationFn: availabilityApi.blockDates,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['calendar', propertyId],
      });
      setSelectedStart(null);
      setSelectedEnd(null);
      success('Success', 'Selected dates have been blocked.');
    },
    onError: () => {
      showError('Error', 'Failed to block dates. Please try again.');
    },
  });

  // ---------------------------------------------------------------------------
  // Month navigation
  // ---------------------------------------------------------------------------
  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // ---------------------------------------------------------------------------
  // Day selection
  // ---------------------------------------------------------------------------
  const handleDayPress = useCallback(
    (day: Date) => {
      if (isBefore(day, today)) return;

      if (!selectedStart || (selectedStart && selectedEnd)) {
        // Start new selection
        setSelectedStart(day);
        setSelectedEnd(null);
      } else {
        // Set end date
        if (isBefore(day, selectedStart)) {
          setSelectedEnd(selectedStart);
          setSelectedStart(day);
        } else {
          setSelectedEnd(day);
        }
      }
    },
    [selectedStart, selectedEnd, today],
  );

  // ---------------------------------------------------------------------------
  // Handle block selected range
  // ---------------------------------------------------------------------------
  const handleBlockDates = () => {
    if (!selectedStart || !selectedEnd) {
      alert({
        type: 'warning',
        title: 'Select Dates',
        message: 'Please select a start and end date to block.',
      });
      return;
    }

    confirm(
      'Block Dates',
      `Block dates from ${format(selectedStart, 'MMM d')} to ${format(selectedEnd, 'MMM d, yyyy')}?`,
      () =>
        blockMutation.mutate({
          propertyId,
          startDate: format(selectedStart, 'yyyy-MM-dd'),
          endDate: format(selectedEnd, 'yyyy-MM-dd'),
          reason: 'Blocked by host',
        }),
      { confirmText: 'Block', cancelText: 'Cancel', destructive: true },
    );
  };

  const handleSetSeasonalPricing = () => {
    if (!selectedStart || !selectedEnd) {
      alert({
        type: 'warning',
        title: 'Select Dates',
        message: 'Please select a start and end date for the price override.',
      });
      return;
    }
    const price = parseFloat(seasonalPrice);
    if (!seasonalPrice || isNaN(price) || price <= 0) {
      alert({
        type: 'warning',
        title: 'Enter Price',
        message: 'Please enter a valid price per night.',
      });
      return;
    }
    confirm(
      'Set Seasonal Price',
      `Set price to $${price}/night from ${format(selectedStart, 'MMM d')} to ${format(selectedEnd, 'MMM d, yyyy')}?`,
      () =>
        seasonalPricingMutation.mutate({
          propertyId,
          startDate: format(selectedStart, 'yyyy-MM-dd'),
          endDate: format(selectedEnd, 'yyyy-MM-dd'),
          pricePerNight: price,
        }),
      { confirmText: 'Apply', cancelText: 'Cancel' },
    );
  };

  // ---------------------------------------------------------------------------
  // Calendar grid
  // ---------------------------------------------------------------------------
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sun

  const isInSelectedRange = (day: Date): boolean => {
    if (!selectedStart) return false;
    if (!selectedEnd) return isSameDay(day, selectedStart);
    return (
      (isSameDay(day, selectedStart) || day > selectedStart) &&
      (isSameDay(day, selectedEnd) || day < selectedEnd)
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Calendar" />

      {/* Tab toggle */}
      <View className="flex-row mx-6 mt-4 mb-2 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          onPress={() => { setTab('block'); setSelectedStart(null); setSelectedEnd(null); }}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-1.5 ${
            tab === 'block' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Lock size={14} color={tab === 'block' ? '#1a1a1a' : '#9CA3AF'} />
          <Text className={`text-sm font-semibold ${
            tab === 'block' ? 'text-gray-900' : 'text-gray-400'
          }`}>Block Dates</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setTab('pricing'); setSelectedStart(null); setSelectedEnd(null); }}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-1.5 ${
            tab === 'pricing' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Tag size={14} color={tab === 'pricing' ? '#1a1a1a' : '#9CA3AF'} />
          <Text className={`text-sm font-semibold ${
            tab === 'pricing' ? 'text-gray-900' : 'text-gray-400'
          }`}>Seasonal Pricing</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Month header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={goToPrevMonth} className="p-2">
            <ChevronLeft size={22} color="#222" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} className="p-2">
            <ChevronRight size={22} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Tab description */}
        {tab === 'block' ? (
          <View className="px-6 mb-3">
            <Text className="text-sm text-gray-500">Select a date range to block — guests won't be able to book those nights.</Text>
          </View>
        ) : (
          <View className="px-6 mb-3">
            <Text className="text-sm text-gray-500">Select a date range and enter a custom price per night to override your base rate.</Text>
          </View>
        )}

        {/* Legend */}
        <View className="flex-row items-center justify-center gap-6 px-6 mb-4">
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded bg-brand/20 mr-1.5" />
            <Text className="text-xs text-gray-600">Selected</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded bg-gray-300 mr-1.5" />
            <Text className="text-xs text-gray-600">Blocked</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded bg-white border border-gray-200 mr-1.5" />
            <Text className="text-xs text-gray-600">Available</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="py-12">
            <Spinner size="small" />
          </View>
        ) : (
          <View className="px-4">
            {/* Week day headers */}
            <View className="flex-row mb-2">
              {weekDays.map((d) => (
                <View key={d} className="flex-1 items-center">
                  <Text className="text-xs font-medium text-gray-500">
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View className="flex-row flex-wrap">
              {/* Empty cells for start offset */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: '14.28%', height: 48 }} />
              ))}

              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isBlocked = blockedDates.has(dateStr);
                const isPast = isBefore(day, today);
                const isSelected = isInSelectedRange(day);
                const isStartDay = selectedStart && isSameDay(day, selectedStart);
                const isEndDay = selectedEnd && isSameDay(day, selectedEnd);

                let bgClass = 'bg-white';
                let textClass = 'text-gray-900';

                if (isPast) {
                  textClass = 'text-gray-300';
                } else if (isStartDay || isEndDay) {
                  bgClass = 'bg-brand';
                  textClass = 'text-white';
                } else if (isSelected) {
                  bgClass = 'bg-brand/20';
                  textClass = 'text-brand';
                } else if (isBlocked) {
                  bgClass = 'bg-gray-200';
                  textClass = 'text-gray-500';
                }

                return (
                  <TouchableOpacity
                    key={dateStr}
                    onPress={() => handleDayPress(day)}
                    disabled={isPast}
                    activeOpacity={0.7}
                    style={{ width: '14.28%', height: 48 }}
                    className="items-center justify-center"
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${bgClass}`}
                    >
                      <Text className={`text-sm font-medium ${textClass}`}>
                        {format(day, 'd')}
                      </Text>
                    </View>
                    {isBlocked && !isPast && (
                      <View className="absolute bottom-0.5">
                        <Lock size={8} color="#717171" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Selection info */}
        {selectedStart && (
          <View className="px-6 mt-6 p-4 bg-gray-50 rounded-xl mx-6">
            <Text className="text-sm font-semibold text-gray-900 mb-1">
              Selected range
            </Text>
            <Text className="text-sm text-gray-600">
              {format(selectedStart, 'MMM d, yyyy')}
              {selectedEnd
                ? ` - ${format(selectedEnd, 'MMM d, yyyy')}`
                : ' (select end date)'}
            </Text>
          </View>
        )}

        {/* Seasonal price input */}
        {tab === 'pricing' && (
          <View className="px-6 mt-4">
            <Input
              label="Price per night ($)"
              placeholder="e.g. 150"
              value={seasonalPrice}
              onChangeText={setSeasonalPrice}
              keyboardType="decimal-pad"
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 pt-3 pb-8">
        {tab === 'block' ? (
          <Button
            title="Block Selected Dates"
            onPress={handleBlockDates}
            loading={blockMutation.isPending}
            disabled={!selectedStart || !selectedEnd}
            size="lg"
          />
        ) : (
          <Button
            title="Apply Seasonal Price"
            onPress={handleSetSeasonalPricing}
            loading={seasonalPricingMutation.isPending}
            disabled={!selectedStart || !selectedEnd || !seasonalPrice}
            size="lg"
          />
        )}
      </View>
    </View>
  );
}
