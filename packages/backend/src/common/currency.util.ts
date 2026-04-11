/**
 * Backend currency conversion utility.
 * Mirrors the frontend RATES map so email templates can display amounts
 * in the guest's preferred display currency.
 */

const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  EGP: 50.5,
  TRY: 32.5,
  MAD: 10.0,
  KWD: 0.31,
  QAR: 3.64,
  JOD: 0.71,
  BHD: 0.38,
  OMR: 0.38,
  IQD: 1310,
  JPY: 150,
  CNY: 7.24,
  INR: 83.5,
  SGD: 1.34,
  AUD: 1.54,
  CAD: 1.36,
  BRL: 4.97,
  BGN: 1.80,
  CLP: 930,
  COP: 3950,
  CZK: 23.2,
  DKK: 6.88,
  HKD: 7.82,
  HUF: 360,
  IDR: 15800,
  ILS: 3.72,
  KZT: 450,
  KES: 130,
  MYR: 4.72,
  MXN: 17.2,
  NZD: 1.63,
  NOK: 10.6,
  PEN: 3.75,
  PHP: 56.5,
  PLN: 4.05,
  RON: 4.57,
  SEK: 10.5,
  CHF: 0.90,
  THB: 35.8,
  TWD: 32.0,
  ZAR: 18.8,
  CRC: 520,
  GHS: 12.5,
};

/** Convert an amount from one currency to another via USD intermediary. */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
): number {
  if (from === to) return amount;
  const fromRate = RATES[from] ?? 1;
  const toRate = RATES[to] ?? 1;
  return (amount / fromRate) * toRate;
}

/**
 * Format a price for display in emails.
 * Returns e.g. "US$150" or "€138" depending on the target currency.
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

/**
 * Build a display string for email amounts.
 * If displayCurrency differs from sourceCurrency, shows both:
 *   "EGP 7,500 (~US$149)"
 * If same or no displayCurrency, shows just the source amount.
 */
export function emailPriceDisplay(
  amount: number,
  sourceCurrency: string,
  displayCurrency?: string | null,
): string {
  const sourceStr = formatCurrencyAmount(amount, sourceCurrency);
  if (!displayCurrency || displayCurrency === sourceCurrency) {
    return sourceStr;
  }
  const converted = convertCurrency(amount, sourceCurrency, displayCurrency);
  const displayStr = formatCurrencyAmount(converted, displayCurrency);
  return `${sourceStr} (~${displayStr})`;
}
