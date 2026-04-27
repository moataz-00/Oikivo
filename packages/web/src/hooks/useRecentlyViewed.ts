'use client';

import { useCallback, useEffect, useState } from 'react';
import { propertiesApi } from '@/lib/api';

const STORAGE_KEY = 'sakan_recently_viewed';
const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
  id: number;
  uuid: string;
  title: string;
  titleAr?: string;
  image: string | null;
  city: string;
  price: number;
  currency: string;
  rating: number | null;
  viewedAt: number; // timestamp
}

function getStored(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStored(items: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const stored = getStored();
    setItems(stored);

    // Prune deleted properties: validate UUIDs against backend
    if (stored.length === 0) return;
    const uuids = stored.map((i) => i.uuid);
    propertiesApi.validateUuids(uuids).then((liveUuids) => {
      const liveSet = new Set(liveUuids);
      const pruned = stored.filter((i) => liveSet.has(i.uuid));
      if (pruned.length !== stored.length) {
        setStored(pruned);
        setItems(pruned);
      }
    }).catch(() => { /* backend unreachable — keep existing list */ });
  }, []);

  const trackView = useCallback((property: {
    id: number;
    uuid: string;
    title: string;
    titleAr?: string;
    images?: { url: string }[];
    city?: string;
    pricePerNight?: number;
    currency?: string;
    averageRating?: number | null;
  }) => {
    const stored = getStored();
    // Remove existing entry for this property
    const filtered = stored.filter((item) => item.id !== property.id);
    const newItem: RecentlyViewedItem = {
      id: property.id,
      uuid: property.uuid,
      title: property.title,
      titleAr: property.titleAr,
      image: property.images?.[0]?.url ?? null,
      city: property.city ?? '',
      price: property.pricePerNight ?? 0,
      currency: property.currency ?? 'EGP',
      rating: property.averageRating ?? null,
      viewedAt: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
    setStored(updated);
    setItems(updated);
  }, []);

  const removeByUuid = useCallback((uuid: string) => {
    const pruned = getStored().filter((i) => i.uuid !== uuid);
    setStored(pruned);
    setItems(pruned);
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { recentlyViewed: items, trackView, removeByUuid, clearHistory };
}
