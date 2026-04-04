import { format, differenceInCalendarDays, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

/**
 * Format a numeric price with currency symbol.
 *
 * Examples:
 *   formatPrice(120, 'USD') => '$120'
 *   formatPrice(1500, 'SAR') => 'SAR 1,500'
 */
export function formatPrice(
  amount: number,
  currency = 'USD',
): string {
  if (currency === 'USD' || currency === 'usd') {
    return `$${amount.toLocaleString('en-US')}`;
  }
  return `${currency} ${amount.toLocaleString('en-US')}`;
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date string or Date into a human-readable string.
 *
 * Examples:
 *   formatDate('2025-06-15') => 'Jun 15, 2025'
 *   formatDate('2025-06-15', 'MMM d')  => 'Jun 15'
 */
export function formatDate(
  date: string | Date,
  pattern = 'MMM d, yyyy',
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

// ---------------------------------------------------------------------------
// Night calculation
// ---------------------------------------------------------------------------

/**
 * Return the number of calendar nights between two dates.
 *
 * Examples:
 *   nightsBetween('2025-06-10', '2025-06-13') => 3
 */
export function nightsBetween(
  checkIn: string | Date,
  checkOut: string | Date,
): number {
  const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return Math.max(differenceInCalendarDays(end, start), 0);
}

// ---------------------------------------------------------------------------
// Image URL helper
// ---------------------------------------------------------------------------

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001/api';

/**
 * Ensure image paths are fully-qualified URLs.
 * If the path starts with `http` it is returned as-is; otherwise the API
 * base URL (minus `/api`) is prepended.
 *
 * Examples:
 *   getImageUrl('/uploads/photo.jpg') => 'http://10.0.2.2:3001/uploads/photo.jpg'
 *   getImageUrl('https://cdn.example.com/pic.jpg') => 'https://cdn.example.com/pic.jpg'
 */
export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  // Remove trailing /api so we point at the server root
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
