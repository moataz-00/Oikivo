import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'EGP', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return Math.max(0, differenceInDays(end, start));
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() ?? '';
  const last = lastName?.[0]?.toUpperCase() ?? '';
  return `${first}${last}`;
}

// Memoize base URL — computed once per process
const _imageBase = (() => {
  const raw = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : undefined;
  return raw?.replace('/api', '') || 'http://localhost:3001';
})();

export function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/')) return `${_imageBase}${avatar}`;
  return `${_imageBase}/uploads/${avatar}`;
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${_imageBase}${path}`;
  return `${_imageBase}/uploads/${path}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildSearchParams(params: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  return searchParams;
}

export function getLocaleDir(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getRatingLabel(rating: number): string {
  if (rating >= 4.9) return 'Exceptional';
  if (rating >= 4.7) return 'Outstanding';
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very good';
  if (rating >= 3.5) return 'Good';
  return 'Okay';
}

export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatRating(value: unknown, digits = 2): string | null {
  const rating = toFiniteNumber(value);
  return rating === null ? null : rating.toFixed(digits);
}
