'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useTranslations, useLocale } from 'next-intl';
import { paymentsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

interface OPayCardModalProps {
  bookingId: number;
  bookingType?: 'stay' | 'experience';
  totalAmount: number;
  currency?: string;
  onSuccess: (method: 'instapay' | 'opay-card') => void;
  onClose: () => void;
  /** Go back to payment method selection */
  onBack?: () => void;
}

// FIX P1: Replaced raw card form with OPay hosted checkout redirect.
// Card data never passes through our backend — entered directly on OPay's secure page.
export function OPayCardModal({
  bookingId,
  bookingType = 'stay',
  totalAmount,
  currency = 'EGP',
  onSuccess,
  onClose,
  onBack,
}: OPayCardModalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const { formatPrice } = useCurrency();
  const t = useTranslations('payment');
  const locale = useLocale();

  const checkoutMutation = useMutation({
    mutationFn: () =>
      paymentsApi.opayCheckout({
        bookingId,
        bookingType,
        returnUrl: `${window.location.origin}/${locale}/trips?payment=success&bookingId=${bookingId}`,
      }),
    onSuccess: (data) => {
      if (data.status === 'redirect' && data.cashierUrl) {
        toast.success(t('redirectingToOpay'));
        // Redirect to OPay's hosted checkout page
        window.location.href = data.cashierUrl;
      } else {
        setErrorMsg('Failed to create checkout session. Please try again.');
      }
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.message ?? err?.message ?? 'An error occurred. Please try again.',
      );
    },
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={checkoutMutation.isPending ? undefined : onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Grip (mobile) */}
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-neutral-200" />
          </div>

          <div className="px-6 pt-4 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors mr-1"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4 text-neutral-500" />
                  </button>
                )}
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">{t('opayCardPayment')}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Total: {formatPrice(totalAmount, currency)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            {/* Card icon row */}
            <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 mb-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </span>
              <div>
                <p className="text-xs font-semibold text-orange-900">OPay Secure Checkout</p>
                <p className="text-[11px] text-orange-700">Visa · Mastercard · Meeza</p>
              </div>
            </div>

            {/* Info text */}
            <p className="text-sm text-neutral-600 mb-5">
              {t('opayRedirectInfo') ?? 'You will be redirected to OPay\'s secure payment page to enter your card details. Your card information is handled entirely by OPay and never passes through our servers.'}
            </p>

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <Button
              className="w-full"
              disabled={checkoutMutation.isPending}
              onClick={() => {
                setErrorMsg('');
                checkoutMutation.mutate();
              }}
            >
              {checkoutMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t('redirectingToOpay') ?? 'Redirecting...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {t('payAmount', { amount: formatPrice(totalAmount, currency) })}
                </span>
              )}
            </Button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-neutral-400">
              <Lock className="h-3 w-3" />
              <p className="text-[11px]">{t('encryptedByOpay')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
