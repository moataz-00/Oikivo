/**
 * Returns a YYYY-MM-DD date string in the server's LOCAL timezone.
 *
 * Why not `toISOString().split('T')[0]`?
 * `toISOString()` always returns the UTC date. When the server is in a UTC+N
 * timezone (Egypt is UTC+2 winter / UTC+3 summer), a Date at local midnight
 * (e.g. 2026-04-26T00:00:00+03:00) has a UTC value of 2026-04-25T21:00:00Z,
 * so `toISOString().split('T')[0]` would incorrectly return "2026-04-25".
 *
 * This helper reads the local-time getters (getFullYear / getMonth / getDate),
 * which JS automatically adjusts for DST — so it is always correct regardless
 * of whether the server is currently on UTC+2 or UTC+3.
 */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
