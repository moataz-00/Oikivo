'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, AlertCircle, Phone, ArrowRight, ImagePlus, Info, Landmark, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { useTranslations } from 'next-intl';
import { bookingsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

// --- Platform InstaPay number (set in .env) -----------------------------------
const INSTAPAY_PHONE =
  process.env.NEXT_PUBLIC_INSTAPAY_PHONE ?? '';
const INSTAPAY_NAME =
  process.env.NEXT_PUBLIC_INSTAPAY_NAME ?? 'Oikivo Platform';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface InstapayModalProps {
  bookingId: number;
  totalAmount: number;
  currency?: string;
  onSuccess: (method: 'stripe' | 'instapay' | 'opay-card') => void;
  onClose: () => void;
}

const slideVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

const stepTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

export function InstapayModal({
  bookingId,
  totalAmount,
  currency = 'EGP',
  onSuccess,
  onClose,
}: InstapayModalProps) {
  const [step, setStep] = useState<'instructions' | 'reference' | 'done'>('instructions');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatPrice } = useCurrency();
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const submit = useMutation({
    mutationFn: async () => {
      let proofUrl: string | undefined;

      if (proofFile) {
        setUploadingProof(true);
        try {
          const formData = new FormData();
          formData.append('file', proofFile);
          const token =
            typeof window !== 'undefined'
              ? localStorage.getItem('access_token')
              : null;
          const res = await fetch(`${API_URL}/bookings/${bookingId}/upload-payment-proof`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (!res.ok) throw new Error('Upload failed');
          const json = await res.json();
          // Store as absolute URL so the admin panel can open it directly
          proofUrl = json.url?.startsWith('http') ? json.url : `${API_URL.replace('/api', '')}${json.url}`;
        } finally {
          setUploadingProof(false);
        }
      }

      return bookingsApi.submitPayment(bookingId, {
        method: 'instapay',
        reference: reference.trim(),
        note: note.trim() || undefined,
        proofUrl,
      });
    },
    onSuccess: () => setStep('done'),
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? t('couldNotSubmit');
      toast.error(typeof msg === 'string' ? msg : t('couldNotSubmit'));
    },
  });

  function copyPhone() {
    if (!INSTAPAY_PHONE) return;
    navigator.clipboard.writeText(INSTAPAY_PHONE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  const stepIndex = step === 'instructions' ? 0 : step === 'reference' ? 1 : 2;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={step === 'done' ? onClose : undefined}
        />

        {/* Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Grip handle (mobile) */}
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-white/30" />
          </div>

          {/* -- Gradient header ------------------------------------ */}
          <div className="relative px-6 pt-5 pb-6 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 overflow-hidden">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-violet-400/20 blur-xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1.5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/instapay-logo.svg" alt="InstaPay" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {step === 'done' ? 'Payment Submitted!' : t('payViaInstapay')}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-0.5">Booking #{bookingId}</p>
                </div>
              </div>
              {step !== 'done' && (
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Step pills */}
            {step !== 'done' && (
              <div className="relative flex items-center gap-1.5 mt-5">
                {['Send Money', 'Confirm Reference'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className={[
                        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                        i < stepIndex
                          ? 'bg-white/30 text-white'
                          : i === stepIndex
                          ? 'bg-white text-indigo-700 shadow'
                          : 'bg-white/15 text-white/50',
                      ].join(' ')}
                    >
                      {i < stepIndex ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <span className="h-3.5 w-3.5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold">
                          {i + 1}
                        </span>
                      )}
                      {label}
                    </div>
                    {i < 1 && <div className="h-px w-4 bg-white/30" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* -- Body ----------------------------------------------- */}
          <div className="px-6 pt-5 pb-6 max-h-[65dvh] overflow-y-auto overscroll-contain">
            <AnimatePresence mode="wait">

              {/* -- Step 1: Instructions ------------------------------- */}
              {step === 'instructions' && (
                <motion.div
                  key="instructions"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepTransition}
                >
                  {/* Amount card */}
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4 text-center mb-5">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">
                      {t('totalAmountDue')}
                    </p>
                    <p className="text-3xl font-bold text-indigo-700 tabular-nums">
                      {formatPrice(totalAmount, currency ?? 'EGP')}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{t('includesServiceFee')}</p>
                  </div>

                  {/* CBE explainer */}
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                        <Landmark className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">{t('instapayWhatIs')}</p>
                    </div>
                    <p className="text-xs text-indigo-700 leading-relaxed">{t('instapayExplain')}</p>
                  </div>

                  {/* No Egyptian account? fallback */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5 mb-5 flex items-start gap-3 shadow-sm">
                    <CreditCard className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-800">{t('instapayNoAccount')}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {t('instapayUseCard')}{' '}
                        <span className="text-indigo-600 font-medium">{t('instapayHaveContact')}</span>{' '}
                        {t('instapayContactHelp')}
                      </p>
                    </div>
                  </div>

                  {/* Steps */}
                  <ol className="space-y-3 mb-5">
                    {[t('instapayStep1'), t('instapayStep2'), t('instapayStep3')].map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-sm">
                          {i + 1}
                        </span>
                        <p className="text-sm text-neutral-700 pt-0.5">{text}</p>
                      </li>
                    ))}
                  </ol>

                  {/* Phone card or contact-support note */}
                  {INSTAPAY_PHONE ? (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-3.5 mb-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-indigo-500 font-medium">{t('instapayAccount')}</p>
                        <p className="text-sm font-bold text-indigo-900">{INSTAPAY_PHONE}</p>
                        <p className="text-xs text-neutral-400">{INSTAPAY_NAME}</p>
                      </div>
                      <button
                        onClick={copyPhone}
                        className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied ? tCommon('copied') : tCommon('copy')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 mb-4">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800 mb-0.5">InstaPay account details</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Contact our support team to receive the InstaPay phone number before sending.
                          You can still submit your transfer reference below once sent.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Exact-amount warning */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 mb-5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Send the <strong>exact amount</strong> shown above. Our system matches the transfer to your booking automatically.
                    </p>
                  </div>

                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/60 border-0"
                    onClick={() => setStep('reference')}
                  >
                    I&apos;ve sent the payment <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* -- Step 2: Enter reference --------------------------- */}
              {step === 'reference' && (
                <motion.div
                  key="reference"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={stepTransition}
                >
                  <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
                    Enter the <strong>transfer reference number</strong> from your bank confirmation
                    message (SMS or app notification). This helps us verify your payment quickly.
                  </p>

                  <div className="space-y-4 mb-5">
                    <Input
                      label="Transfer reference number *"
                      placeholder="e.g. 2024031512345678"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />

                    {/* Screenshot upload */}
                    <div>
                      <p className="text-xs font-medium text-neutral-700 mb-2">
                        Transaction screenshot{' '}
                        <span className="text-neutral-400 font-normal">(recommended � speeds up approval)</span>
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {proofPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-indigo-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proofPreview}
                            alt="Transaction proof"
                            className="w-full max-h-48 object-contain bg-neutral-50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProofFile(null);
                              setProofPreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-neutral-700" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 p-5 text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                            <ImagePlus className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-medium">Tap to upload screenshot</span>
                        </button>
                      )}
                    </div>

                    <Textarea
                      label="Optional note"
                      placeholder="Anything you'd like to add�"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setStep('instructions')}>
                      {tCommon('back')}
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/60 border-0"
                      disabled={reference.trim().length < 4}
                      isLoading={submit.isPending || uploadingProof}
                      onClick={() => submit.mutate()}
                    >
                      {uploadingProof ? t('submitting') : t('confirmPayment')}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* -- Step 3: Done --------------------------------------- */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center py-2"
                >
                  <div className="flex justify-center mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 shadow-inner">
                      <span className="text-4xl">??</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {t('paymentSubmittedTitle')}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-1">
                    We&apos;ve received your payment reference and will verify it shortly.
                  </p>
                  <p className="text-xs text-neutral-400 mb-6">
                    You&apos;ll get a notification once your booking is confirmed � usually within a few hours.
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/60 border-0"
                    onClick={() => onSuccess('instapay')}
                  >
                    View my trips ?
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
