'use client';

import { useMemo, useEffect } from 'react';
import { useCurrencyStore } from '@/store/currency.store';

// Approximate USD exchange rates (updated periodically — fine for display purposes)
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
  // Extended currencies
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

function detectCurrencyFromTimezone(tz: string): string {
  if (tz.includes('Dubai') || tz.includes('Abu_Dhabi') || tz.includes('Muscat')) return 'AED';
  if (tz.includes('Riyadh') || tz.includes('Aden') || tz.includes('Kuwait')) {
    if (tz.includes('Kuwait')) return 'KWD';
    return 'SAR';
  }
  if (tz.includes('Cairo') || tz.includes('Egypt')) return 'EGP';
  if (tz.includes('Istanbul') || tz.includes('Turkey')) return 'TRY';
  if (tz.includes('Casablanca') || tz.includes('Morocco')) return 'MAD';
  if (tz.includes('Qatar') || tz.includes('Doha')) return 'QAR';
  if (tz.includes('Baghdad') || tz.includes('Iraq')) return 'IQD';
  if (tz.includes('Amman') || tz.includes('Jordan')) return 'JOD';
  if (tz.includes('Bahrain')) return 'BHD';
  if (tz.includes('London')) return 'GBP';
  if (tz.includes('Europe') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) return 'EUR';
  if (tz.includes('Tokyo') || tz.includes('Japan')) return 'JPY';
  if (tz.includes('Shanghai') || tz.includes('Chongqing') || tz.includes('Hong_Kong')) return 'CNY';
  if (tz.includes('Kolkata') || tz.includes('India')) return 'INR';
  if (tz.includes('Singapore')) return 'SGD';
  if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Australia')) return 'AUD';
  if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Canada')) return 'CAD';
  return 'USD';
}

export function useCurrency() {
  const { selectedCurrency, hydrate } = useCurrencyStore();

  // Hydrate from localStorage on first render
  useEffect(() => { hydrate(); }, [hydrate]);

  const { currency, rate, locale } = useMemo(() => {
    if (typeof Intl === 'undefined') return { currency: 'USD', rate: 1, locale: 'en-US' };

    // Use stored preference if available, otherwise auto-detect from timezone
    let detected: string;
    if (selectedCurrency) {
      detected = selectedCurrency;
    } else {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
      detected = detectCurrencyFromTimezone(tz);
    }

    const r = RATES[detected] ?? 1;
    const displayLocale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en-US';
    return { currency: detected, rate: r, locale: displayLocale };
  }, [selectedCurrency]);

  /**
   * Convert an amount from `sourceCurrency` to the user's detected currency and
   * format it. Defaults to EGP since that is the platform's base currency.
   */
  const formatPrice = (amount: number, sourceCurrency = 'EGP'): string => {
    const sourceRate = RATES[sourceCurrency] ?? 1;
    // Convert: amount → USD → user currency
    const converted = (amount / sourceRate) * rate;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted);
    } catch {
      return `${Math.round(converted)} ${currency}`;
    }
  };

  /** Raw numeric conversion without formatting */
  const convert = (amount: number, sourceCurrency = 'EGP'): number => {
    const sourceRate = RATES[sourceCurrency] ?? 1;
    return (amount / sourceRate) * rate;
  };

  return { currency, rate, formatPrice, convert };
}
