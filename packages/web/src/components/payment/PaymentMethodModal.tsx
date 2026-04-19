'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/hooks/useCurrency';
import { InstapayModal } from './InstapayModal';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { OPayCardModal } from './OPayCardModal';
import { OPayWalletModal } from './OPayWalletModal';

// Detect if the user's timezone is Egyptian — used for OPay Card (Egypt-only processor)
function detectEgyptTimezone(): boolean {
  if (typeof Intl === 'undefined') return false;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  return tz.includes('Cairo') || tz.includes('Egypt');
}

interface PaymentMethodModalProps {
  bookingId: number;
  bookingType?: 'stay' | 'experience';
  totalAmount: number;
  currency?: string;
  onSuccess: (method: 'stripe' | 'instapay' | 'opay-card' | 'opay-wallet') => void;
  onClose: () => void;
}

type Method = 'select' | 'instapay' | 'stripe' | 'opay-card' | 'opay-wallet';

export function PaymentMethodModal({
  bookingId,
  bookingType = 'stay',
  totalAmount,
  currency = 'EGP',
  onSuccess,
  onClose,
}: PaymentMethodModalProps) {
  const [method, setMethod] = useState<Method>('select');
  // Hydration-safe: default false on server, detect on client after mount
  const [isEgypt, setIsEgypt] = useState(false);
  const { formatPrice } = useCurrency();
  const t = useTranslations('payment');

  useEffect(() => {
    setIsEgypt(detectEgyptTimezone());
  }, []);

  if (method === 'instapay') {
    return (
      <InstapayModal
        bookingId={bookingId}
        totalAmount={totalAmount}
        currency={currency}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );
  }

  if (method === 'stripe') {
    return (
      <StripeCheckoutModal
        bookingId={bookingId}
        totalAmount={totalAmount}
        currency={currency}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );
  }

  if (method === 'opay-card') {
    return (
      <OPayCardModal
        bookingId={bookingId}
        bookingType={bookingType}
        totalAmount={totalAmount}
        currency={currency}
        onSuccess={onSuccess}
        onClose={onClose}
        onBack={() => setMethod('select')}
      />
    );
  }

  if (method === 'opay-wallet') {
    return (
      <OPayWalletModal
        bookingId={bookingId}
        bookingType={bookingType}
        totalAmount={totalAmount}
        currency={currency}
        onSuccess={onSuccess}
        onClose={onClose}
        onBack={() => setMethod('select')}
      />
    );
  }

  // ── Payment method selection ────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Grip */}
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-neutral-200" />
          </div>

          <div className="px-6 pt-4 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">{t('chooseMethod')}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Total: {formatPrice(totalAmount, currency)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            <div className="space-y-3">
              {/* ── Stripe (disabled — re-enable by restoring this block when Stripe is configured)
              <button
                onClick={() => setMethod('stripe')}
                className="w-full flex items-center gap-4 rounded-2xl border border-neutral-200 p-4 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Credit / Debit Card</p>
                  <p className="text-xs text-neutral-500">
                    Visa, Mastercard, Meeza · Apple Pay · Google Pay
                  </p>
                </div>
              </button>
              ── end Stripe ── */}

              {/* OPay Card — Egypt only (OPay only processes EGP cards from Egypt) */}
              {isEgypt && (
              <button
                onClick={() => setMethod('opay-card')}
                className="w-full flex items-center gap-4 rounded-2xl border border-neutral-200 p-4 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t('opayCard')}</p>
                  <p className="text-xs text-neutral-500">
                    {t('opayCardDesc')}
                  </p>
                </div>
              </button>
              )}

              {/* OPay Wallet — Egypt only (mobile wallet payment) */}
              {isEgypt && (
              <button
                onClick={() => setMethod('opay-wallet')}
                className="w-full flex items-center gap-4 rounded-2xl border border-neutral-200 p-4 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <Wallet className="h-5 w-5 text-green-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t('opayWallet') ?? 'OPay Wallet'}</p>
                  <p className="text-xs text-neutral-500">
                    {t('opayWalletDesc') ?? 'Pay with your OPay mobile wallet'}
                  </p>
                </div>
              </button>
              )}

              {/* InstaPay — CBE-regulated network, requires Egyptian bank account */}
              <button
                onClick={() => setMethod('instapay')}
                className="w-full flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100">
                    <Smartphone className="h-5 w-5 text-indigo-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-neutral-900">{t('instapay')}</p>
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white leading-tight">
                        CBE
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{t('instapayDesc')}</p>
                  </div>
                </div>
                {/* Inline eligibility hint */}
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-700 leading-relaxed">
                  ✅ <strong>Have an Egyptian bank account?</strong> Download the <strong>InstaPay app</strong> and transfer instantly. &nbsp;·&nbsp; No Egyptian account? <span className="text-neutral-600">use card payment.</span>
                </div>
              </button>


            </div>

            <p className="mt-4 text-center text-xs text-neutral-400">
              {t('securePayment')}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
