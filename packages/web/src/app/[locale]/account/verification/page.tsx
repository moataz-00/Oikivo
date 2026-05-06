'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Mail, Phone, Shield, Upload, Clock, XCircle, Eye, X, FileText } from 'lucide-react';
import { authApi, usersApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

function VerifyBadge({ verified, verifiedLabel, notVerifiedLabel }: { verified: boolean; verifiedLabel: string; notVerifiedLabel: string }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> {verifiedLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
      <AlertCircle className="h-3.5 w-3.5" /> {notVerifiedLabel}
    </span>
  );
}

export default function VerificationPage() {
  const locale = useLocale();
  const t = useTranslations('verification');
  const router = useRouter();
  const { isLoggedIn, hasHydrated, user, setUser } = useAuth();
  const qc = useQueryClient();

  /* phone OTP state */
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [devPhoneCode, setDevPhoneCode] = useState<string | null>(null);

  /* email state */
  const [emailSent, setEmailSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  /* ID upload state */
  const [docType, setDocType] = useState<'national_id' | 'passport'>('national_id');
  const [selectedFileFront, setSelectedFileFront] = useState<File | null>(null);
  const [selectedFileBack, setSelectedFileBack] = useState<File | null>(null);
  const [previewFrontUrl, setPreviewFrontUrl] = useState<string | null>(null);
  const [previewBackUrl, setPreviewBackUrl] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  /* ─── Sync fresh user data from backend to avoid stale Zustand store ─── */
  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    enabled: isLoggedIn,
    staleTime: 0,
  });
  useEffect(() => {
    if (freshUser) setUser(freshUser as any);
  }, [freshUser, setUser]);

  /* ─── email mutations ─── */
  const sendEmail = useMutation({
    mutationFn: authApi.sendVerificationEmail,
    onSuccess: (res) => {
      setEmailSent(true);
      if (res?.devToken) setDevToken(res.devToken);   // dev mode only
      toast.success(t('sendVerificationEmail'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('sendVerificationEmail')),
  });

  /* ─── phone mutations ─── */
  const sendPhone = useMutation({
    mutationFn: authApi.sendPhoneVerification,
    onSuccess: (res: any) => {
      setPhoneCodeSent(true);
      if (res?.devCode) setDevPhoneCode(res.devCode);
      toast.success(t('sendWhatsappCode'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('sendWhatsappCode')),
  });

  const verifyPhone = useMutation({
    mutationFn: () => authApi.verifyPhone(code),
    onSuccess: () => {
      toast.success(t('verifyCode'));
      if (user) setUser({ ...user, isPhoneVerified: true } as any);
      qc.invalidateQueries({ queryKey: ['me'] });
      setPhoneCodeSent(false);
      setCode('');
      setDevPhoneCode(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t('verifyCode')),
  });

  const submitId = useMutation({
    mutationFn: (file: File) => usersApi.submitIdDocument(file, docType),
    onSuccess: () => {
      toast.success('ID document submitted! Our team will review it within 1–2 business days.');
      // Update Zustand store immediately so the upload UI hides without waiting for a page reload
      if (user) {
        setUser({ ...user, idVerificationStatus: 'pending', idDocumentType: docType } as any);
      }
      qc.invalidateQueries({ queryKey: ['me'] });
      setSelectedFileFront(null);
      setSelectedFileBack(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Upload failed'),
  });

  const submitIdBack = useMutation({
    mutationFn: (file: File) => usersApi.submitIdDocumentBack(file),
    onSuccess: () => {
      toast.success('Back side uploaded successfully.');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Back upload failed'),
  });

  if (!hasHydrated || !user) return <FullPageSpinner />;

  // Prefer freshly-fetched data over the potentially-stale Zustand store
  const liveUser = (freshUser as any) ?? user;
  const emailVerified = liveUser?.isEmailVerified ?? false;
  const phoneVerified = liveUser?.isPhoneVerified ?? false;
  const idVerified = liveUser?.isIdVerified ?? false;
  const idStatus: string = liveUser?.idVerificationStatus ?? 'none';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="text-sm text-neutral-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* ── Email ── */}
      <div className="rounded-2xl border border-brand/15 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-2.5 text-brand">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{t('emailSection')}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
          <VerifyBadge verified={emailVerified} verifiedLabel={t('verified')} notVerifiedLabel={t('notVerified')} />
        </div>

        {!emailVerified && !emailSent && (
          <Button
            onClick={() => sendEmail.mutate()}
            disabled={sendEmail.isPending}
            className="w-full"
          >
            {sendEmail.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
            {t('sendVerificationEmail')}
          </Button>
        )}

        {emailSent && (
          <div className="rounded-xl bg-brand/5 border border-brand/20 p-4 text-sm text-brand">
            {devToken ? (
              <>
                <strong>{t('devModeToken')}</strong>{' '}
                <code className="font-mono break-all text-brand/80">{devToken}</code>
              </>
            ) : (
              t('checkInboxLink')
            )}
          </div>
        )}
      </div>

      {/* ── Phone ── */}
      <div className="rounded-2xl border border-brand/15 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-2.5 text-brand">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{t('phoneSection')}</p>
              <p className="text-sm text-neutral-500">
                {(user as any).phone ?? t('noPhone')}
              </p>
            </div>
          </div>
          <VerifyBadge verified={phoneVerified} verifiedLabel={t('verified')} notVerifiedLabel={t('notVerified')} />
        </div>

        {!(user as any).phone && !phoneVerified && (
          <p className="text-sm text-neutral-400">
            {t('addPhoneFirst')}{' '}
            <a href={`/${locale}/account`} className="text-neutral-700 underline underline-offset-2">
              {t('addPhoneFirstSettings')}
            </a>{' '}
            {t('addPhoneFirstBefore')}
          </p>
        )}

        {!phoneVerified && (user as any).phone && !phoneCodeSent && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-sm text-emerald-700">
              <span className="text-base">💬</span>
              <span>{t('whatsappNotice1')} <strong>{(user as any).phone}</strong> {t('whatsappNotice2')} <strong>{t('whatsappBold')}</strong>. {t('whatsappWarning')}</span>
            </div>
            <Button
              onClick={() => sendPhone.mutate()}
              disabled={sendPhone.isPending}
              className="w-full"
            >
              {sendPhone.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
              {t('sendWhatsappCode')}
            </Button>
          </div>
        )}

        {!phoneVerified && phoneCodeSent && (
          <div className="space-y-3">
            {devPhoneCode && (
              <div className="rounded-xl bg-brand/5 border border-brand/20 p-4 text-sm text-brand">
                <strong>{t('devModeCode')}</strong>{' '}
                <code className="font-mono tracking-widest text-brand/80">{devPhoneCode}</code>
              </div>
            )}
            <label className="block text-sm font-medium text-neutral-700">{t('enterSixDigit')}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="000000"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPhoneCodeSent(false);
                  setCode('');
                }}
                disabled={verifyPhone.isPending}
              >
                {t('cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={() => verifyPhone.mutate()}
                disabled={code.length !== 6 || verifyPhone.isPending}
              >
                {verifyPhone.isPending ? <Spinner className="h-4 w-4" /> : t('verifyCode')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Identity ── */}
      <div className="rounded-2xl border border-brand/15 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-2.5 text-brand">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{t('governmentId')}</p>
              <p className="text-sm text-neutral-500">
                {idVerified
                  ? t('idVerifiedDesc')
                  : idStatus === 'pending'
                  ? t('idPendingDesc')
                  : idStatus === 'rejected'
                  ? t('idRejectedDesc')
                  : t('idNotSubmittedDesc')}
              </p>
            </div>
          </div>
          {idVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('verified')}
            </span>
          ) : idStatus === 'pending' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <Clock className="h-3.5 w-3.5" /> {t('underReview')}
            </span>
          ) : idStatus === 'rejected' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <XCircle className="h-3.5 w-3.5" /> {t('rejected')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" /> {t('notVerified')}
            </span>
          )}
        </div>

        {!idVerified && idStatus !== 'pending' && (
          <>
            {/* Document type selector */}
            <div className="grid grid-cols-2 gap-3">
              {(['national_id', 'passport'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setDocType(type);
                    if (previewFrontUrl) URL.revokeObjectURL(previewFrontUrl);
                    if (previewBackUrl) URL.revokeObjectURL(previewBackUrl);
                    setSelectedFileFront(null);
                    setSelectedFileBack(null);
                    setPreviewFrontUrl(null);
                    setPreviewBackUrl(null);
                  }}
                  className={cn(
                    'rounded-xl border-2 px-4 py-3 text-sm font-medium transition text-left',
                    docType === type
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  )}
                >
                  <span className="block text-base mb-0.5">{type === 'national_id' ? '🪪' : '📘'}</span>
                  {type === 'national_id' ? t('nationalId') : t('passport')}
                  {type === 'national_id' && <span className="block text-xs text-neutral-400 mt-0.5">{t('nationalIdNote')}</span>}
                  {type === 'passport' && <span className="block text-xs text-neutral-400 mt-0.5">{t('passportNote')}</span>}
                </button>
              ))}
            </div>

            {/* Photo tips */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-xs font-semibold text-neutral-700 mb-2">{t('tipsTitle')}</p>
              <ul className="space-y-1.5 text-xs text-neutral-500">
                <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✔</span> {t('tip1')}</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✔</span> {t('tip2')}</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✔</span> {t('tip3')}</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 shrink-0">✘</span> {t('tip4')}</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 shrink-0">✘</span> {t('tip5')}</li>
              </ul>
            </div>

            {/* Front side */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">
                {docType === 'national_id' ? t('frontSide') : t('photoPage')}
              </p>
              <input
                ref={fileInputFrontRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setSelectedFileFront(f);
                  if (previewFrontUrl) URL.revokeObjectURL(previewFrontUrl);
                  setPreviewFrontUrl(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
                }}
              />
              {selectedFileFront ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex items-center gap-3">
                  {previewFrontUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(previewFrontUrl)}
                      className="relative shrink-0 h-14 w-20 rounded-lg overflow-hidden bg-neutral-200 group"
                    >
                      <img src={previewFrontUrl} alt="Front preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </button>
                  ) : (
                    <div className="shrink-0 h-14 w-20 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-400">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">{selectedFileFront.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{(selectedFileFront.size / 1024 / 1024).toFixed(2)} MB</p>
                    {previewFrontUrl && (
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(previewFrontUrl)}
                        className="mt-1 text-xs text-brand underline underline-offset-2 hover:text-brand/80"
                      >
                        {t('viewFullSize')}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (previewFrontUrl) URL.revokeObjectURL(previewFrontUrl);
                      setPreviewFrontUrl(null);
                      setSelectedFileFront(null);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2 shrink-0"
                  >
                    {t('remove')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputFrontRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand/25 bg-brand/5 hover:bg-brand/10 hover:border-brand/50 transition-colors py-6 text-brand/70"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('clickToUpload')}</span>
                  <span className="text-xs">{t('uploadFormat')}</span>
                </button>
              )}
            </div>

            {/* Back side — national ID only */}
            {docType === 'national_id' && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{t('backSide')}</p>
                <input
                  ref={fileInputBackRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setSelectedFileBack(f);
                    if (previewBackUrl) URL.revokeObjectURL(previewBackUrl);
                    setPreviewBackUrl(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
                  }}
                />
                {selectedFileBack ? (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex items-center gap-3">
                    {previewBackUrl ? (
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(previewBackUrl)}
                        className="relative shrink-0 h-14 w-20 rounded-lg overflow-hidden bg-neutral-200 group"
                      >
                        <img src={previewBackUrl} alt="Back preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="shrink-0 h-14 w-20 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-400">
                        <FileText className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 truncate">{selectedFileBack.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{(selectedFileBack.size / 1024 / 1024).toFixed(2)} MB</p>
                      {previewBackUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxSrc(previewBackUrl)}
                          className="mt-1 text-xs text-brand underline underline-offset-2 hover:text-brand/80"
                        >
                          {t('viewFullSize')}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (previewBackUrl) URL.revokeObjectURL(previewBackUrl);
                        setPreviewBackUrl(null);
                        setSelectedFileBack(null);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2 shrink-0"
                    >
                      {t('remove')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputBackRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand/25 bg-brand/5 hover:bg-brand/10 hover:border-brand/50 transition-colors py-6 text-brand/70"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-sm font-medium">{t('clickToUploadBack')}</span>
                    <span className="text-xs">{t('uploadFormat')}</span>
                  </button>
                )}
              </div>
            )}

            {/* Submit button */}
            {selectedFileFront && (docType === 'passport' || selectedFileBack) && (
              <Button
                onClick={async () => {
                  await submitId.mutateAsync(selectedFileFront!);
                  if (docType === 'national_id' && selectedFileBack) {
                    await submitIdBack.mutateAsync(selectedFileBack);
                  }
                }}
                disabled={submitId.isPending || submitIdBack.isPending}
                className="w-full"
              >
                {(submitId.isPending || submitIdBack.isPending) ? <Spinner className="h-4 w-4 mr-2" /> : null}
                {t('submitForReview')}
              </Button>
            )}

            {idStatus === 'rejected' && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {t('rejectedNote')}
              </p>
            )}
          </>
        )}

        {idStatus === 'pending' && (
          <div className="rounded-xl bg-brand/5 border border-brand/20 px-4 py-3 text-sm text-brand">
            {t('pendingNote')}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="Document preview"
            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
