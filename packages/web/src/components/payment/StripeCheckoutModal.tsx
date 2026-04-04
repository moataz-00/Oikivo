'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { paymentsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

// Stripe publishable key — set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

interface StripeCheckoutModalProps {
  bookingId: number;
  totalAmount: number;
  currency?: string;
  onSuccess: (method: 'stripe' | 'instapay' | 'opay-card') => void;
  onClose: () => void;
}

// ─── Inner form (must be inside <Elements>) ──────────────────────────────────
function CheckoutForm({
  bookingId,
  onSuccess,
  onClose,
}: {
  bookingId: number;
  onSuccess: (method: 'stripe' | 'instapay' | 'opay-card') => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message ?? t('stripeFailed'));
      setIsProcessing(false);
    } else {
      // Payment succeeded — backend webhook will update status, but optimistically continue
      toast.success(t('stripeSuccess'));
      onSuccess('stripe');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span>{t('stripeSecure')}</span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? t('processing') : t('payNow')}
        </button>
      </div>
    </form>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
export function StripeCheckoutModal({
  bookingId,
  totalAmount,
  currency = 'EGP',
  onSuccess,
  onClose,
}: StripeCheckoutModalProps) {
  const { formatPrice } = useCurrency();
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const createIntent = useMutation({
    mutationFn: () =>
      paymentsApi.createIntent({ bookingId, bookingType: 'stay' }),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: () => {
      toast.error(t('stripeFailed'));
    },
  });

  useEffect(() => {
    createIntent.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">💳</span>
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">{t('payWithCard')}</h2>
                  <p className="text-xs text-neutral-500">
                    {formatPrice(totalAmount, currency)} · Booking #{bookingId}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            {createIntent.isPending && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
                <p className="text-sm text-neutral-500">{t('preparingCheckout')}</p>
              </div>
            )}

            {createIntent.isError && (
              <div className="text-center py-6">
                <p className="text-sm text-red-600 mb-4">{t('failedLoadForm')}</p>
                <button
                  onClick={() => createIntent.mutate()}
                  className="text-sm underline text-neutral-900"
                >
                  {tCommon('tryAgain')}
                </button>
              </div>
            )}

            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: 'stripe' },
                }}
              >
                <CheckoutForm
                  bookingId={bookingId}
                  onSuccess={onSuccess}
                  onClose={onClose}
                />
              </Elements>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
