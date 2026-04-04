'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Amenity } from '@/types';

interface AmenitiesGridProps {
  amenities: Amenity[];
}

// Map DB icon keys → emojis (matches the wizard AMENITY_ICON_MAP)
const EMOJI_MAP: Record<string, string> = {
  'wifi': '📶', 'cooking-pot': '🍳', 'square-parking': '🅿️', 'air-vent': '❄️',
  'flame': '🔥', 'washing-machine': '🫧', 'wind': '💨', 'briefcase': '💼',
  'tv': '📺', 'zap': '⚡', 'waves': '🏊', 'thermometer': '🌡️', 'dumbbell': '🏋️',
  'anchor': '⚓', 'mountain': '⛷️', 'music': '🎹', 'shower-head': '🚿',
  'bike': '🚴', 'sailboat': '⛵', 'bell-ring': '🔔', 'alert-triangle': '⚠️',
  'fire-extinguisher': '🧯', 'cross': '🏥', 'camera': '📷', 'lock': '🔒',
};

function getEmoji(icon: string): string {
  return EMOJI_MAP[icon] ?? icon ?? '✨';
}

const GROUP_META: Record<string, { title: string; emoji: string }> = {
  essential: { title: 'Essentials', emoji: '🏠' },
  standout:  { title: 'Standout amenities', emoji: '⭐' },
  safety:    { title: 'Safety & security', emoji: '🛡️' },
};

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  const t = useTranslations('property');
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);

  const getAmenityName = (amenity: Amenity) =>
    locale === 'ar' && amenity.nameAr ? amenity.nameAr : amenity.name;

  if (!amenities || amenities.length === 0) return null;

  const visibleAmenities = amenities.slice(0, 10);

  const grouped = amenities.reduce(
    (acc, a) => {
      const group = a.group ?? 'essential';
      if (!acc[group]) acc[group] = [];
      acc[group].push(a);
      return acc;
    },
    {} as Record<string, Amenity[]>
  );

  return (
    <section>
      <h2 className="text-xl font-semibold text-neutral-900 mb-5">{t('amenities')}</h2>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleAmenities.map((amenity) => (
          <div
            key={amenity.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-neutral-300"
          >
            <span className="text-xl shrink-0">{getEmoji(amenity.icon)}</span>
            <span className="text-sm font-medium text-neutral-800 leading-tight">{getAmenityName(amenity)}</span>
          </div>
        ))}
      </div>

      {amenities.length > 10 && (
        <Button
          variant="outline"
          size="md"
          className="mt-6"
          onClick={() => setShowAll(true)}
        >
          {t('showAllAmenities').replace('{count}', String(amenities.length))}
        </Button>
      )}

      <Modal
        open={showAll}
        onOpenChange={setShowAll}
        title={t('amenities')}
        variant="centered"
      >
        <div className="space-y-8 py-2">
          {Object.entries(grouped).map(([group, items]) => {
            const meta = GROUP_META[group] ?? { title: group, emoji: '✨' };
            return (
              <div key={group}>
                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>{meta.emoji}</span> {meta.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3"
                    >
                      <span className="text-lg shrink-0">{getEmoji(amenity.icon)}</span>
                      <span className="text-sm text-neutral-800 flex-1">{getAmenityName(amenity)}</span>
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </section>
  );
}
