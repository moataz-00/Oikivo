// ─── Egyptian public holiday data (single source of truth) ──────────────────
const EG_FIXED_HOLIDAYS: [number, number][] = [
  [1, 7],   // Coptic Christmas
  [1, 25],  // Revolution Day
  [4, 25],  // Sinai Liberation Day
  [5, 1],   // Labour Day
  [6, 30],  // June 30 Revolution Day
  [7, 23],  // July 23 Revolution Day
  [10, 6],  // Armed Forces Day
];

const EG_ISLAMIC_HOLIDAYS: Record<number, [number, number][]> = {
  2025: [[3,30],[3,31],[4,1],[4,2],[6,6],[6,7],[6,8],[6,27],[9,4]],
  2026: [[3,20],[3,21],[3,22],[5,27],[5,28],[5,29],[6,17],[8,25]],
  2027: [[3,9],[3,10],[3,11],[5,16],[5,17],[5,18],[6,6],[8,14]],
};

export function isEgyptianPublicHoliday(d: Date): boolean {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (EG_FIXED_HOLIDAYS.some(([hm, hd]) => hm === m && hd === day)) return true;
  const yr = d.getFullYear();
  const islamic = EG_ISLAMIC_HOLIDAYS[yr];
  return !!(islamic && islamic.some(([hm, hd]) => hm === m && hd === day));
}
