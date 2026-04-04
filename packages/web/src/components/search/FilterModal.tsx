'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import * as Slider from '@radix-ui/react-slider';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { amenitiesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { SearchPropertiesParams, SpaceType } from '@/types';

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SearchPropertiesParams;
  onApply: (filters: SearchPropertiesParams) => void;
}

export function FilterModal({ open, onOpenChange, filters, onApply }: FilterModalProps) {
  const t = useTranslations('filter');
  const tCommon = useTranslations('common');

  const [priceRange, setPriceRange] = useState([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 1000,
  ]);
  const [spaceType, setSpaceType] = useState<SpaceType | undefined>(filters.spaceType);
  const [bedrooms, setBedrooms] = useState(filters.bedrooms ?? 0);
  const [beds, setBeds] = useState(filters.beds ?? 0);
  const [bathrooms, setBathrooms] = useState(filters.bathrooms ?? 0);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>(
    filters.amenities ?? []
  );
  const [instantBook, setInstantBook] = useState(filters.instantBook ?? false);
  const [allowPets, setAllowPets] = useState(filters.allowPets ?? false);

  const { data: amenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: amenitiesApi.getAmenities,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const handleClear = () => {
    setPriceRange([0, 1000]);
    setSpaceType(undefined);
    setBedrooms(0);
    setBeds(0);
    setBathrooms(0);
    setSelectedAmenities([]);
    setInstantBook(false);
    setAllowPets(false);
  };

  const handleApply = () => {
    onApply({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      spaceType,
      bedrooms: bedrooms > 0 ? bedrooms : undefined,
      beds: beds > 0 ? beds : undefined,
      bathrooms: bathrooms > 0 ? bathrooms : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      instantBook: instantBook || undefined,
      allowPets: allowPets || undefined,
    });
    onOpenChange(false);
  };

  const toggleAmenity = (id: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const CountSelector = ({
    value,
    onChange,
    max = 10,
  }: {
    value: number;
    onChange: (v: number) => void;
    max?: number;
  }) => (
    <div className="flex items-center gap-3">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].slice(0, max + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            'h-9 w-9 rounded-full border text-sm font-medium transition-colors',
            value === n
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
          )}
        >
          {n === 0 ? t('any') : n === 8 ? `8+` : n}
        </button>
      ))}
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      variant="centered"
      className="max-w-2xl"
    >
      <div className="space-y-8 pb-4">
        {/* Price Range */}
        <section>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">{t('priceRange')}</h3>
          <p className="text-sm text-neutral-500 mb-6">{t('perNight')}</p>
          <Slider.Root
            min={0}
            max={1000}
            step={10}
            value={priceRange}
            onValueChange={setPriceRange}
            className="relative flex items-center select-none touch-none h-5 w-full"
          >
            <Slider.Track className="relative grow rounded-full bg-neutral-200 h-1.5">
              <Slider.Range className="absolute rounded-full bg-neutral-900 h-full" />
            </Slider.Track>
            <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-neutral-900 bg-white shadow hover:shadow-lg focus:outline-none" />
            <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-neutral-900 bg-white shadow hover:shadow-lg focus:outline-none" />
          </Slider.Root>
          <div className="flex items-center justify-between mt-4">
            <div className="rounded-xl border border-neutral-300 px-3 py-2 text-sm">
              <span className="text-neutral-500 text-xs">{t('minPrice')}</span>
              <p className="font-semibold">${priceRange[0]}</p>
            </div>
            <div className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-right">
              <span className="text-neutral-500 text-xs">{t('maxPrice')}</span>
              <p className="font-semibold">
                ${priceRange[1]}{priceRange[1] >= 1000 ? '+' : ''}
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Type of place */}
        <section>
          <h3 className="text-base font-semibold text-neutral-900 mb-4">{t('typeOfPlace')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { value: undefined, label: t('any') },
                { value: 'entire_place', label: t('entirePlace') },
                { value: 'private_room', label: t('privateRoom') },
                { value: 'shared_room', label: t('sharedRoom') },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setSpaceType(value as SpaceType | undefined)}
                className={cn(
                  'rounded-xl border p-4 text-sm font-medium transition-colors text-left',
                  spaceType === value
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* Rooms & beds */}
        <section className="space-y-6">
          <h3 className="text-base font-semibold text-neutral-900">{t('bedrooms')}</h3>
          {[
            { label: t('bedrooms'), value: bedrooms, onChange: setBedrooms },
            { label: t('beds'), value: beds, onChange: setBeds },
            { label: t('bathrooms'), value: bathrooms, onChange: setBathrooms },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <p className="text-sm font-medium text-neutral-700 mb-3">{label}</p>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => onChange(n)}
                    className={cn(
                      'h-9 min-w-[3rem] rounded-full border text-sm font-medium px-3 transition-colors',
                      value === n
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
                    )}
                  >
                    {n === 0 ? t('any') : n === 7 ? '7+' : n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {amenities && amenities.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-4">{t('amenities')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {amenities.slice(0, 12).map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Checkbox.Root
                      checked={selectedAmenities.includes(amenity.id)}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900 transition-colors"
                    >
                      <Checkbox.Indicator>
                        <Check className="h-3 w-3 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                      {amenity.icon} {amenity.name}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator />

        {/* Booking options */}
        <section>
          <h3 className="text-base font-semibold text-neutral-900 mb-4">{t('bookingOptions')}</h3>
          <div className="space-y-4">
            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-neutral-900">{t('instantBook')}</p>
                <p className="text-xs text-neutral-500">{t('instantBookDesc')}</p>
              </div>
              <Checkbox.Root
                checked={instantBook}
                onCheckedChange={(checked) => setInstantBook(checked === true)}
                className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 bg-white data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900 transition-colors mt-0.5 shrink-0"
              >
                <Checkbox.Indicator>
                  <Check className="h-4 w-4 text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </label>

            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-neutral-900">{t('allowsPets')}</p>
              </div>
              <Checkbox.Root
                checked={allowPets}
                onCheckedChange={(checked) => setAllowPets(checked === true)}
                className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 bg-white data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900 transition-colors mt-0.5 shrink-0"
              >
                <Checkbox.Indicator>
                  <Check className="h-4 w-4 text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </label>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-neutral-200 bg-white pt-4 flex items-center justify-between">
        <button
          onClick={handleClear}
          className="text-sm font-semibold text-neutral-700 underline hover:text-neutral-900"
        >
          {tCommon('clear')}
        </button>
        <Button onClick={handleApply} size="md">
          {tCommon('apply')}
        </Button>
      </div>
    </Modal>
  );
}
