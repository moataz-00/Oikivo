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
  Link2,
  Plus,
  Trash2,
  RefreshCw,
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
import { availabilityApi, type ICalChannel } from '@/lib/api';
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
  const [tab, setTab] = useState<'block' | 'pricing' | 'ical'>('block');

  // iCal state
  const [icalName, setICalName] = useState('');
  const [icalUrl, setICalUrl] = useState('');
  const [addingChannel, setAddingChannel] = useState(false);
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

  // iCal channels
  const {
    data: channels = [],
    isLoading: channelsLoading,
    refetch: refetchChannels,
  } = useQuery({
    queryKey: ['ical-channels', propertyId],
    queryFn: () => availabilityApi.getChannels(propertyId),
    enabled: !isNaN(propertyId) && tab === 'ical',
  });

  const addChannelMutation = useMutation({
    mutationFn: () => availabilityApi.addChannel(propertyId, icalName.trim(), icalUrl.trim()),
    onSuccess: () => {
      setICalName('');
      setICalUrl('');
      setAddingChannel(false);
      refetchChannels();
      success('Added', 'iCal channel linked successfully.');
    },
    onError: () => showError('Error', 'Could not add iCal channel. Check the URL and try again.'),
  });

  const removeChannelMutation = useMutation({
    mutationFn: (sourceId: number) => availabilityApi.removeChannel(propertyId, sourceId),
    onSuccess: () => refetchChannels(),
    onError: () => showError('Error', 'Could not remove channel.'),
  });

  const syncChannelMutation = useMutation({
    mutationFn: (sourceId: number) => availabilityApi.syncChannel(propertyId, sourceId),
    onSuccess: () => {
      refetchChannels();
      success('Synced', 'Calendar synced from remote source.');
    },
    onError: () => showError('Error', 'Sync failed. Please try again.'),
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
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-1 ${
            tab === 'block' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Lock size={13} color={tab === 'block' ? '#1a1a1a' : '#9CA3AF'} />
          <Text className={`text-xs font-semibold ${
            tab === 'block' ? 'text-gray-900' : 'text-gray-400'
          }`}>Block</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setTab('pricing'); setSelectedStart(null); setSelectedEnd(null); }}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-1 ${
            tab === 'pricing' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Tag size={13} color={tab === 'pricing' ? '#1a1a1a' : '#9CA3AF'} />
          <Text className={`text-xs font-semibold ${
            tab === 'pricing' ? 'text-gray-900' : 'text-gray-400'
          }`}>Pricing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('ical')}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-1 ${
            tab === 'ical' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Link2 size={13} color={tab === 'ical' ? '#1a1a1a' : '#9CA3AF'} />
          <Text className={`text-xs font-semibold ${
            tab === 'ical' ? 'text-gray-900' : 'text-gray-400'
          }`}>iCal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Month header + calendar grid (not shown on iCal tab) */}
        {tab !== 'ical' && (
          <>
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
        {tab === 'block' && (
          <View className="px-6 mb-3">
            <Text className="text-sm text-gray-500">Select a date range to block — guests won't be able to book those nights.</Text>
          </View>
        )}
        {tab === 'pricing' && (
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
          </>
        )}

        {/* ============================================================ */}
        {/* iCal channels tab (UX-07 / P1-08) */}
        {/* ============================================================ */}
        {tab === 'ical' && (
          <View className="px-6 mt-4">
            <Text className="text-sm text-gray-500 mb-4">
              Sync blocked dates from external platforms (Airbnb, Booking.com, etc.) using iCal links.
            </Text>

            {channelsLoading ? (
              <View className="py-6 items-center"><Spinner size="small" /></View>
            ) : channels.length === 0 ? (
              <View className="py-6 items-center">
                <Link2 size={32} color="#D1D5DB" />
                <Text className="text-gray-400 text-sm mt-2">No channels linked yet</Text>
              </View>
            ) : (
              <View className="space-y-3 mb-4">
                {channels.map((ch: ICalChannel) => (
                  <View key={ch.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{ch.name}</Text>
                        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{ch.url}</Text>
                        {ch.lastSyncAt && (
                          <Text className="text-xs text-gray-400 mt-0.5">
                            Last sync: {new Date(ch.lastSyncAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row gap-1">
                        <TouchableOpacity
                          onPress={() => syncChannelMutation.mutate(ch.id)}
                          disabled={syncChannelMutation.isPending}
                          className="p-2 rounded-lg bg-indigo-50"
                        >
                          <RefreshCw size={15} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeChannelMutation.mutate(ch.id)}
                          disabled={removeChannelMutation.isPending}
                          className="p-2 rounded-lg bg-red-50"
                        >
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {addingChannel ? (
              <View className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                <Text className="text-sm font-semibold text-gray-700">Add iCal channel</Text>
                <TextInput
                  placeholder="Name (e.g. Airbnb)"
                  value={icalName}
                  onChangeText={setICalName}
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                />
                <TextInput
                  placeholder="iCal URL (https://...)"
                  value={icalUrl}
                  onChangeText={setICalUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                />
                <View className="flex-row gap-2 mt-1">
                  <TouchableOpacity
                    onPress={() => { setAddingChannel(false); setICalName(''); setICalUrl(''); }}
                    className="flex-1 border border-gray-300 rounded-xl py-2.5 items-center"
                  >
                    <Text className="text-sm font-semibold text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addChannelMutation.mutate()}
                    disabled={!icalName.trim() || !icalUrl.trim() || addChannelMutation.isPending}
                    className="flex-1 bg-indigo-600 rounded-xl py-2.5 items-center disabled:opacity-50"
                  >
                    <Text className="text-sm font-semibold text-white">
                      {addChannelMutation.isPending ? 'Adding...' : 'Add Channel'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setAddingChannel(true)}
                className="flex-row items-center justify-center gap-2 border-2 border-dashed border-indigo-300 rounded-xl py-3"
                activeOpacity={0.8}
              >
                <Plus size={16} color="#4F46E5" />
                <Text className="text-sm font-semibold text-indigo-600">Link iCal calendar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom action (hidden on iCal tab) */}
      {tab !== 'ical' && (
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
      )}
    </View>
  );
}
