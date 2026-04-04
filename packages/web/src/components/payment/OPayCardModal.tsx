'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { paymentsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

interface OPayCardModalProps {
  bookingId: number;
  bookingType?: 'stay' | 'experience';
  totalAmount: number;
  currency?: string;
  onSuccess: (method: 'stripe' | 'instapay' | 'opay-card') => void;
  onClose: () => void;
  /** Go back to payment method selection */
  onBack?: () => void;
}

type Step = 'form' | 'processing' | 'success' | 'failed';

/** Format raw card number string with spaces every 4 digits */
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function OPayCardModal({
  bookingId,
  bookingType = 'stay',
  totalAmount,
  currency = 'EGP',
  onSuccess,
  onClose,
  onBack,
}: OPayCardModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const { formatPrice } = useCurrency();
  const t = useTranslations('payment');

  const payMutation = useMutation({
    mutationFn: () =>
      paymentsApi.opayCard({
        bookingId,
        bookingType,
        cardHolderName: cardHolderName.trim(),
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryMonth: expiryMonth.padStart(2, '0'),
        expiryYear,
        cvv,
      }),
    onMutate: () => setStep('processing'),
    onSuccess: (data) => {
      if (data.status === 'success') {
        setStep('success');
        setTimeout(() => onSuccess('opay-card'), 1800);
      } else {
        setErrorMsg(data.message ?? 'Payment failed. Please check your card details and try again.');
        setStep('failed');
      }
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.message ?? err?.message ?? 'An error occurred. Please try again.',
      );
      setStep('failed');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.length < 13 || raw.length > 19) {
      toast.error('Please enter a valid card number.');
      return;
    }
    if (!expiryMonth || !expiryYear) {
      toast.error('Please enter the card expiry date.');
      return;
    }
    if (cvv.length < 3) {
      toast.error('Please enter a valid CVV.');
      return;
    }
    payMutation.mutate();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={step === 'processing' ? undefined : onClose}
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

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 px-6 py-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </motion.div>
              <h2 className="text-lg font-semibold text-neutral-900">{t('paymentSuccessful')}</h2>
              <p className="text-sm text-neutral-500 text-center">
                {t('bookingConfirmedRedirecting')}
              </p>
            </div>
          )}

          {/* ── Failed ── */}
          {step === 'failed' && (
            <div className="px-6 pt-4 pb-6 flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500 mt-4" />
              <h2 className="text-base font-semibold text-neutral-900">{t('paymentFailed')}</h2>
              <p className="text-sm text-neutral-500 text-center">{errorMsg}</p>
              <div className="flex gap-3 w-full mt-2">
                {onBack && (
                  <Button variant="outline" className="flex-1" onClick={onBack}>
                    {t('changeMethod')}
                  </Button>
                )}
                <Button className="flex-1" onClick={() => setStep('form')}>
                  {t('tryAgain')}
                </Button>
              </div>
            </div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-4 px-6 py-10">
              <div className="h-10 w-10 rounded-full border-4 border-neutral-200 border-t-neutral-900 animate-spin" />
              <p className="text-sm font-medium text-neutral-700">{t('processingPayment')}</p>
              <p className="text-xs text-neutral-400">{t('doNotClose')}</p>
            </div>
          )}

          {/* ── Form ── */}
          {step === 'form' && (
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
                  <p className="text-xs font-semibold text-orange-900">OPay Card</p>
                  <p className="text-[11px] text-orange-700">Visa · Mastercard · Meeza</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card holder name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {t('cardholderName')}
                  </label>
                  <Input
                    placeholder={t('nameOnCard')}
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    required
                    autoComplete="cc-name"
                  />
                </div>

                {/* Card number */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {t('cardNumber')}
                  </label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    required
                  />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">{t('month')}</label>
                    <Input
                      placeholder="MM"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      inputMode="numeric"
                      autoComplete="cc-exp-month"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">{t('year')}</label>
                    <Input
                      placeholder="YY"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      inputMode="numeric"
                      autoComplete="cc-exp-year"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">{t('cvv')}</label>
                    <Input
                      placeholder="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      required
                      type="password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={payMutation.isPending}>
                  {t('payAmount', { amount: formatPrice(totalAmount, currency) })}
                </Button>
              </form>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-neutral-400">
                <Lock className="h-3 w-3" />
                <p className="text-[11px]">{t('encryptedByOpay')}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
