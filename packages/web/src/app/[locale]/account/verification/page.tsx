'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Mail, Phone, Shield, Upload, Clock, XCircle } from 'lucide-react';
import { authApi, usersApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

function VerifyBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
      <AlertCircle className="h-3.5 w-3.5" /> Not verified
    </span>
  );
}

export default function VerificationPage() {
  const locale = useLocale();
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast.success('Verification email sent!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to send email'),
  });

  /* ─── phone mutations ─── */
  const sendPhone = useMutation({
    mutationFn: authApi.sendPhoneVerification,
    onSuccess: (res: any) => {
      setPhoneCodeSent(true);
      if (res?.devCode) setDevPhoneCode(res.devCode);
      toast.success('Verification code sent to your email!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to send code'),
  });

  const verifyPhone = useMutation({
    mutationFn: () => authApi.verifyPhone(code),
    onSuccess: () => {
      toast.success('Phone verified!');
      if (user) setUser({ ...user, isPhoneVerified: true } as any);
      qc.invalidateQueries({ queryKey: ['me'] });
      setPhoneCodeSent(false);
      setCode('');
      setDevPhoneCode(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Invalid code'),
  });

  const submitId = useMutation({
    mutationFn: (file: File) => usersApi.submitIdDocument(file),
    onSuccess: () => {
      toast.success('ID document submitted! Our team will review it within 1–2 business days.');
      // Update Zustand store immediately so the upload UI hides without waiting for a page reload
      if (user) {
        setUser({ ...user, idVerificationStatus: 'pending' } as any);
      }
      qc.invalidateQueries({ queryKey: ['me'] });
      setSelectedFile(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Upload failed'),
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
        <h1 className="text-2xl font-bold text-neutral-900">Verification</h1>
        <p className="text-sm text-neutral-500 mt-1">Verify your identity to build trust with guests and hosts.</p>
      </div>

      {/* ── Email ── */}
      <div className="rounded-2xl border border-brand/15 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-2.5 text-brand">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Email address</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
          <VerifyBadge verified={emailVerified} />
        </div>

        {!emailVerified && !emailSent && (
          <Button
            onClick={() => sendEmail.mutate()}
            disabled={sendEmail.isPending}
            className="w-full"
          >
            {sendEmail.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Send Verification Email
          </Button>
        )}

        {emailSent && (
          <div className="rounded-xl bg-brand/5 border border-brand/20 p-4 text-sm text-brand">
            {devToken ? (
              <>
                <strong>Dev mode token:</strong>{' '}
                <code className="font-mono break-all text-brand/80">{devToken}</code>
              </>
            ) : (
              'Check your inbox for a verification link.'
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
              <p className="font-semibold text-neutral-900">Phone number</p>
              <p className="text-sm text-neutral-500">
                {(user as any).phone ?? 'No phone number added'}
              </p>
            </div>
          </div>
          <VerifyBadge verified={phoneVerified} />
        </div>

        {!(user as any).phone && !phoneVerified && (
          <p className="text-sm text-neutral-400">
            Add a phone number in your{' '}
            <a href={`/${locale}/account`} className="text-neutral-700 underline underline-offset-2">
              account settings
            </a>{' '}
            before verifying.
          </p>
        )}

        {!phoneVerified && (user as any).phone && !phoneCodeSent && (
          <Button
            onClick={() => sendPhone.mutate()}
            disabled={sendPhone.isPending}
            className="w-full"
          >
            {sendPhone.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Send Verification Code
          </Button>
        )}

        {!phoneVerified && phoneCodeSent && (
          <div className="space-y-3">
            {devPhoneCode && (
              <div className="rounded-xl bg-brand/5 border border-brand/20 p-4 text-sm text-brand">
                <strong>Dev mode code:</strong>{' '}
                <code className="font-mono tracking-widest text-brand/80">{devPhoneCode}</code>
              </div>
            )}
            <label className="block text-sm font-medium text-neutral-700">Enter the 6-digit code</label>
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
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => verifyPhone.mutate()}
                disabled={code.length !== 6 || verifyPhone.isPending}
              >
                {verifyPhone.isPending ? <Spinner className="h-4 w-4" /> : 'Verify Code'}
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
              <p className="font-semibold text-neutral-900">Government ID</p>
              <p className="text-sm text-neutral-500">
                {idVerified
                  ? 'Your identity has been verified.'
                  : idStatus === 'pending'
                  ? 'Your ID is under review.'
                  : idStatus === 'rejected'
                  ? 'Your ID was rejected. Please submit again.'
                  : `Upload a passport, national ID, or driver’s license.`}
              </p>
            </div>
          </div>
          {idVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          ) : idStatus === 'pending' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <Clock className="h-3.5 w-3.5" /> Under review
            </span>
          ) : idStatus === 'rejected' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <XCircle className="h-3.5 w-3.5" /> Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" /> Not verified
            </span>
          )}
        </div>

        {!idVerified && idStatus !== 'pending' && (
          <>
            {/* Photo tips */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-xs font-semibold text-neutral-700 mb-2">Tips for a successful submission</p>
              <ul className="space-y-1.5 text-xs text-neutral-500">
                <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✔</span> Photo must be clear, well-lit, and free of blur or glare</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✔</span> All 4 corners of the document must be visible</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">✔</span> Name, date of birth and ID number must be readable</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 shrink-0">✘</span> No black-and-white scans, photocopies, or expired documents</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 shrink-0">✘</span> No cropped or edited images</li>
              </ul>
              <p className="mt-2.5 text-xs text-neutral-500">
                Your profile photo will be compared against the face on your ID during admin review. Make sure your profile photo shows your face clearly.
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />

            {selectedFile ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2"
                  >
                    Remove
                  </button>
                  <Button
                    onClick={() => submitId.mutate(selectedFile)}
                    disabled={submitId.isPending}
                    className="text-sm"
                  >
                    {submitId.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                    Submit
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand/25 bg-brand/5 hover:bg-brand/10 hover:border-brand/50 transition-colors py-8 text-brand/70"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">Click to upload document</span>
                <span className="text-xs">JPG, PNG, WebP or PDF · max 10 MB</span>
              </button>
            )}

            {idStatus === 'rejected' && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                Your previous submission was rejected. Please upload a clearer photo or a different document.
              </p>
            )}
          </>
        )}

        {idStatus === 'pending' && (
          <div className="rounded-xl bg-brand/5 border border-brand/20 px-4 py-3 text-sm text-brand">
            Our team is reviewing your document. You'll be notified once the review is complete (usually 1–2 business days).
          </div>
        )}
      </div>
    </div>
  );
}
