'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Lock, AlertCircle, ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { paymentsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

interface OPayWalletModalProps {
  bookingId: number;
  bookingType?: 'stay' | 'experience';
  totalAmount: number;
  currency?: string;
  onSuccess: (method: 'stripe' | 'instapay' | 'opay-card' | 'opay-wallet') => void;
  onClose: () => void;
  onBack?: () => void;
}

export function OPayWalletModal({
  bookingId,
  bookingType = 'stay',
  totalAmount,
  currency = 'EGP',
  onSuccess,
  onClose,
  onBack,
}: OPayWalletModalProps) {
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [qrData, setQrData] = useState<{ qrCode: string; reference: string } | null>(null);
  const { formatPrice } = useCurrency();
  const t = useTranslations('payment');

  const walletMutation = useMutation({
    mutationFn: () =>
      paymentsApi.opayWallet({ bookingId, bookingType, walletPhone: phone }),
    onSuccess: (data) => {
      setQrData(data);
      toast.success(t('walletRequestSent') ?? 'Wallet payment initiated');
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={walletMutation.isPending ? undefined : onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-neutral-200" />
          </div>

          <div className="px-6 pt-4 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button onClick={onBack} className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors mr-1" aria-label="Back">
                    <ArrowLeft className="h-4 w-4 text-neutral-500" />
                  </button>
                )}
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">{t('opayWallet') ?? 'OPay Wallet'}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Total: {formatPrice(totalAmount, currency)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-neutral-100 transition-colors" aria-label="Close">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            {/* Wallet icon row */}
            <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 mb-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                <Wallet className="h-5 w-5 text-green-600" />
              </span>
              <div>
                <p className="text-xs font-semibold text-green-900">{t('opayWalletPayment') ?? 'OPay Mobile Wallet'}</p>
                <p className="text-[11px] text-green-700">{t('opayWalletHint') ?? 'Pay using your OPay e-wallet balance'}</p>
              </div>
            </div>

            {qrData ? (
              /* QR code result */
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 text-center">
                  {t('scanQrToPay') ?? 'Scan the QR code with your OPay app to complete payment'}
                </p>
                {qrData.qrCode && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrData.qrCode} alt="QR Code" className="h-48 w-48 rounded-xl border border-neutral-200" />
                  </div>
                )}
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                  <p className="text-xs text-neutral-500">Reference</p>
                  <p className="text-sm font-mono font-semibold text-neutral-900">{qrData.reference}</p>
                </div>
                <Button className="w-full" onClick={() => onSuccess('opay-wallet')}>
                  {t('iHavePaid') ?? 'I have paid'}
                </Button>
              </div>
            ) : (
              /* Phone input */
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  {t('enterWalletPhone') ?? 'Enter your OPay wallet phone number to receive a payment request.'}
                </p>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('walletPhone') ?? 'Wallet phone number'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={walletMutation.isPending || !phone.trim()}
                  onClick={() => { setErrorMsg(''); walletMutation.mutate(); }}
                >
                  {walletMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {t('processing') ?? 'Processing…'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      {t('payAmount', { amount: formatPrice(totalAmount, currency) })}
                    </span>
                  )}
                </Button>
              </div>
            )}

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
