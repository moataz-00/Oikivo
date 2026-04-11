import { Injectable, Logger } from '@nestjs/common';

/**
 * Server-side currency conversion service.
 *
 * All database amounts are stored in EGP. This service converts to the guest's
 * display currency for emails, invoices, and API responses.
 *
 * Rates are approximate and updated here periodically. For production, swap to
 * a live exchange-rate API (e.g. ExchangeRate-API, Open Exchange Rates).
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  // Rates: 1 USD = X of this currency (same source of truth as frontend)
  private readonly rates: Record<string, number> = {
    USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, EGP: 50.5,
    TRY: 32.5, MAD: 10.0, KWD: 0.31, QAR: 3.64, JOD: 0.71, BHD: 0.38,
    OMR: 0.38, IQD: 1310, JPY: 150, CNY: 7.24, INR: 83.5, SGD: 1.34,
    AUD: 1.54, CAD: 1.36, BRL: 4.97, BGN: 1.80, CLP: 930, COP: 3950,
    CZK: 23.2, DKK: 6.88, HKD: 7.82, HUF: 360, IDR: 15800, ILS: 3.72,
    KZT: 450, KES: 130, MYR: 4.72, MXN: 17.2, NZD: 1.63, NOK: 10.6,
    PEN: 3.75, PHP: 56.5, PLN: 4.05, RON: 4.57, SEK: 10.5, CHF: 0.90,
    THB: 35.8, TWD: 32.0, ZAR: 18.8, CRC: 520, GHS: 12.5,
  };

  // Zero-decimal currencies (amount in smallest unit = integer)
  private readonly zeroDecimalCurrencies = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA',
    'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
  ]);

  /** Convert from one currency to another */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = this.rates[fromCurrency.toUpperCase()] ?? 1;
    const toRate = this.rates[toCurrency.toUpperCase()] ?? 1;
    return (amount / fromRate) * toRate;
  }

  /** Format for display in emails: "1,250.00 USD" or "١٬٢٥٠ EGP" */
  formatForEmail(amount: number, currency: string): string {
    const cur = currency.toUpperCase();
    const isZero = this.zeroDecimalCurrencies.has(cur);
    const decimals = isZero ? 0 : 2;
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${formatted} ${cur}`;
  }

  /**
   * Convert an EGP amount to the display currency and format it for emails.
   * If displayCurrency is null/undefined or same as source, uses source currency.
   */
  convertAndFormat(
    amountInSource: number,
    sourceCurrency: string,
    displayCurrency: string | null | undefined,
  ): string {
    const src = (sourceCurrency || 'EGP').toUpperCase();
    const dst = (displayCurrency || src).toUpperCase();
    if (src === dst) return this.formatForEmail(amountInSource, src);
    const converted = this.convert(amountInSource, src, dst);
    // Show both: "250.00 USD (≈ 12,625.00 EGP)"
    return `${this.formatForEmail(converted, dst)} (≈ ${this.formatForEmail(amountInSource, src)})`;
  }

  isZeroDecimal(currency: string): boolean {
    return this.zeroDecimalCurrencies.has(currency.toUpperCase());
  }

  /** For Stripe: convert to the smallest unit */
  toSmallestUnit(amount: number, currency: string): number {
    return this.isZeroDecimal(currency) ? Math.round(amount) : Math.round(amount * 100);
  }
}
