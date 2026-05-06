'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/store/currency.store';

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COP' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flagSrc: 'https://flagcdn.com/w40/gb.png', region: 'United Kingdom' },
  { code: 'ar', label: 'العربية', flagSrc: 'https://flagcdn.com/w40/eg.png', region: 'Egypt' },
];

type Tab = 'language' | 'currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageCurrencyModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('language');
  const locale = useLocale();
  const { selectedCurrency, setCurrency, hydrate } = useCurrencyStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) { onClose(); return; }
    // Use hard navigation so the server re-renders with the correct locale messages
    const path = window.location.pathname; // e.g. /en/rooms/123
    const newPath = path.startsWith(`/${locale}/`)
      ? `/${newLocale}/${path.slice(locale.length + 2)}`
      : path === `/${locale}`
      ? `/${newLocale}`
      : `/${newLocale}${path}`;
    // Signal to the wizard's beforeunload guard that this is a locale switch,
    // not a real "leave page" — so it won't show the browser confirmation dialog.
    try { sessionStorage.setItem('oikivo_locale_switch', '1'); } catch { /* ignore */ }
    window.location.href = newPath;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-200 shrink-0">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex gap-6">
            <button
              onClick={() => setTab('language')}
              className={cn(
                'text-sm font-semibold pb-1 border-b-2 transition-colors',
                tab === 'language'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              Language and region
            </button>
            <button
              onClick={() => setTab('currency')}
              className={cn(
                'text-sm font-semibold pb-1 border-b-2 transition-colors',
                tab === 'currency'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              Currency
            </button>
          </div>
          <div className="w-8" />
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {tab === 'language' ? (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Suggested languages
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => {
                  const isActive = locale === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => switchLocale(lang.code)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                        isActive
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-400'
                      )}
                    >
                      <img src={lang.flagSrc} alt={lang.region} className="w-8 h-auto rounded-sm shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{lang.label}</p>
                        <p className="text-xs text-neutral-500">{lang.region}</p>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-neutral-900 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Choose a currency
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CURRENCIES.map((cur) => {
                  const isActive = selectedCurrency === cur.code;
                  return (
                    <button
                      key={cur.code}
                      onClick={() => { setCurrency(cur.code); onClose(); }}
                      className={cn(
                        'flex items-start gap-2 rounded-xl border p-3 text-left transition-all',
                        isActive
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-400'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{cur.name}</p>
                        <p className="text-xs text-neutral-500">{cur.code} – {cur.symbol}</p>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-neutral-900 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
