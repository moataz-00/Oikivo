'use client';

import { useCallback, useEffect, useState } from 'react';

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
    setItems(getStored());
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

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { recentlyViewed: items, trackView, clearHistory };
}
