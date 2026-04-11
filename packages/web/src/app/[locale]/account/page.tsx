'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { User, Shield, Bell, Globe, Camera, Eye, EyeOff, X, Trash2, AlertTriangle, ChevronDown, Search, Home, GraduationCap, ArrowRight, Smartphone, MonitorSmartphone, LogOut, Download, Unlink, QrCode, Check } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { authApi, usersApi, bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { getImageUrl } from '@/lib/utils';

// ─── Country phone data ────────────────────────────────────────────────────────
// [name, ISO-2 code, dial code]
type CountryEntry = [string, string, string];
const COUNTRIES: CountryEntry[] = [
  ['Egypt', 'EG', '+20'],
  ['Saudi Arabia', 'SA', '+966'],
  ['United Arab Emirates', 'AE', '+971'],
  ['Kuwait', 'KW', '+965'],
  ['Qatar', 'QA', '+974'],
  ['Bahrain', 'BH', '+973'],
  ['Oman', 'OM', '+968'],
  ['Jordan', 'JO', '+962'],
  ['Lebanon', 'LB', '+961'],
  ['Iraq', 'IQ', '+964'],
  ['Syria', 'SY', '+963'],
  ['Libya', 'LY', '+218'],
  ['Tunisia', 'TN', '+216'],
  ['Algeria', 'DZ', '+213'],
  ['Morocco', 'MA', '+212'],
  ['Sudan', 'SD', '+249'],
  ['Yemen', 'YE', '+967'],
  ['Palestine', 'PS', '+970'],
  ['United States', 'US', '+1'],
  ['United Kingdom', 'GB', '+44'],
  ['France', 'FR', '+33'],
  ['Germany', 'DE', '+49'],
  ['Italy', 'IT', '+39'],
  ['Spain', 'ES', '+34'],
  ['Netherlands', 'NL', '+31'],
  ['Belgium', 'BE', '+32'],
  ['Switzerland', 'CH', '+41'],
  ['Austria', 'AT', '+43'],
  ['Sweden', 'SE', '+46'],
  ['Norway', 'NO', '+47'],
  ['Denmark', 'DK', '+45'],
  ['Finland', 'FI', '+358'],
  ['Poland', 'PL', '+48'],
  ['Canada', 'CA', '+1'],
  ['Australia', 'AU', '+61'],
  ['New Zealand', 'NZ', '+64'],
  ['India', 'IN', '+91'],
  ['Pakistan', 'PK', '+92'],
  ['Bangladesh', 'BD', '+880'],
  ['Sri Lanka', 'LK', '+94'],
  ['Nepal', 'NP', '+977'],
  ['China', 'CN', '+86'],
  ['Japan', 'JP', '+81'],
  ['South Korea', 'KR', '+82'],
  ['Indonesia', 'ID', '+62'],
  ['Malaysia', 'MY', '+60'],
  ['Singapore', 'SG', '+65'],
  ['Thailand', 'TH', '+66'],
  ['Vietnam', 'VN', '+84'],
  ['Philippines', 'PH', '+63'],
  ['Russia', 'RU', '+7'],
  ['Ukraine', 'UA', '+380'],
  ['Turkey', 'TR', '+90'],
  ['Iran', 'IR', '+98'],
  ['Israel', 'IL', '+972'],
  ['South Africa', 'ZA', '+27'],
  ['Nigeria', 'NG', '+234'],
  ['Kenya', 'KE', '+254'],
  ['Ethiopia', 'ET', '+251'],
  ['Ghana', 'GH', '+233'],
  ['Tanzania', 'TZ', '+255'],
  ['Uganda', 'UG', '+256'],
  ['Brazil', 'BR', '+55'],
  ['Mexico', 'MX', '+52'],
  ['Argentina', 'AR', '+54'],
  ['Colombia', 'CO', '+57'],
  ['Chile', 'CL', '+56'],
  ['Peru', 'PE', '+51'],
  ['Venezuela', 'VE', '+58'],
  ['Ecuador', 'EC', '+593'],
  ['Bolivia', 'BO', '+591'],
  ['Portugal', 'PT', '+351'],
  ['Greece', 'GR', '+30'],
  ['Czech Republic', 'CZ', '+420'],
  ['Hungary', 'HU', '+36'],
  ['Romania', 'RO', '+40'],
  ['Bulgaria', 'BG', '+359'],
  ['Croatia', 'HR', '+385'],
  ['Serbia', 'RS', '+381'],
  ['Slovakia', 'SK', '+421'],
  ['Ireland', 'IE', '+353'],
  ['Iceland', 'IS', '+354'],
  ['Luxembourg', 'LU', '+352'],
  ['Malta', 'MT', '+356'],
  ['Cyprus', 'CY', '+357'],
];

function countryFlag(iso2: string) {
  return String.fromCodePoint(
    ...iso2.toUpperCase().split('').map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)),
  );
}

// Egyptian mobile prefixes (after country code: 10, 11, 12, 15)
const EGYPT_PREFIXES_SHORT = ['10', '11', '12', '15'];
const EGYPT_PREFIXES_LOCAL = ['010', '011', '012', '015'];

function validateEgyptianPhone(localNumber: string): string | true {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) return true; // allow empty (not required here)
  // Accept 10 digits without leading 0 (e.g. 1012345678) or 11 digits with leading 0 (e.g. 01012345678)
  if (digits.length === 10 && EGYPT_PREFIXES_SHORT.some((p) => digits.startsWith(p))) return true;
  if (digits.length === 11 && EGYPT_PREFIXES_LOCAL.some((p) => digits.startsWith(p))) return true;
  return 'Only Egyptian numbers starting with 010, 011, 012, or 015 can be verified at this time';
}

// ─── PhoneInput component ──────────────────────────────────────────────────────
function PhoneInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse stored phone value into { dialCode, local }
  // Handles: "+20 01012345678", "+20 1012345678", "01012345678", "+21012345678"
  const parseValue = (v: string): { dialCode: string; local: string } => {
    if (!v) return { dialCode: '+20', local: '' };
    if (!v.startsWith('+')) return { dialCode: '+20', local: v };
    // Split on first space (our storage format)
    const spaceIdx = v.indexOf(' ');
    if (spaceIdx !== -1) return { dialCode: v.slice(0, spaceIdx), local: v.slice(spaceIdx + 1) };
    // No space — try matching known dial codes (longest first)
    const sorted = [...COUNTRIES].sort((a, b) => b[2].length - a[2].length);
    const found = sorted.find((c) => v.startsWith(c[2]));
    if (found) return { dialCode: found[2], local: v.slice(found[2].length) };
    return { dialCode: '+20', local: v };
  };

  const { dialCode, local } = parseValue(value);
  const selectedCountry = COUNTRIES.find((c) => c[2] === dialCode) ?? COUNTRIES[0];

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c[0].toLowerCase().includes(search.toLowerCase()) ||
          c[2].includes(search),
      )
    : COUNTRIES;

  const handleSelect = (c: CountryEntry) => {
    onChange(`${c[2]} ${local}`);
    setOpen(false);
    setSearch('');
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${dialCode} ${e.target.value}`);
  };

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isEgypt = selectedCountry[1] === 'EG';
  const egValidation = isEgypt && local ? validateEgyptianPhone(local) : true;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-neutral-700">Phone number</label>
      <div className="flex gap-2">
        {/* Country selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 text-sm hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-colors"
          >
            <span className="text-base leading-none">{countryFlag(selectedCountry[1])}</span>
            <span className="font-medium text-neutral-700">{selectedCountry[2]}</span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
              <div className="p-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-2.5">
                  <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country…"
                    className="w-full bg-transparent py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
              <ul className="max-h-48 overflow-y-auto py-1">
                {filtered.map((c) => (
                  <li key={`${c[1]}-${c[2]}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-base leading-none">{countryFlag(c[1])}</span>
                      <span className="flex-1 text-left text-neutral-800 truncate">{c[0]}</span>
                      <span className="text-neutral-400 text-xs shrink-0">{c[2]}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-neutral-400">No country found</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Local number input */}
        <input
          type="tel"
          value={local}
          onChange={handleLocalChange}
          placeholder={isEgypt ? '01X XXXX XXXX' : 'Phone number'}
          className={`flex-1 h-11 rounded-xl border px-3.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
            error || (isEgypt && local && egValidation !== true)
              ? 'border-red-400 focus:ring-red-200'
              : 'border-neutral-300 focus:ring-neutral-900/20 hover:border-neutral-400'
          }`}
        />
      </div>

      {/* Egyptian validation warning */}
      {isEgypt && local && egValidation !== true && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {egValidation}
        </p>
      )}
      {!isEgypt && local && (
        <p className="text-xs text-neutral-400">
          ⚠ Phone verification is only available for Egyptian numbers in this phase.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const BASE_SECTIONS = [
  { value: 'personal', label: null as string | null, labelKey: 'personalInfo', icon: User },
  { value: 'security', label: null as string | null, labelKey: 'security', icon: Shield },
  { value: 'notifications', label: null as string | null, labelKey: 'notifications', icon: Bell },
];
const HOST_SECTION = { value: 'hosting', label: 'Hosting', labelKey: 'hosting', icon: Home };
const CONSULTANT_SECTION = { value: 'consultant', label: 'Consultant', labelKey: 'consultant', icon: GraduationCap };

function ChangePasswordModal({ open, onClose, hasPassword }: { open: boolean; onClose: () => void; hasPassword: boolean }) {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();

  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      hasPassword
        ? authApi.changePassword(currentPassword, newPassword)
        : authApi.setPassword(newPassword),
    onSuccess: () => {
      toast.success(hasPassword ? 'Password changed successfully' : 'Password set successfully');
      reset();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update password');
    },
  });

  const onSubmit = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    mutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-neutral-900">
              {hasPassword ? t('changePassword') : 'Set a password'}
            </Dialog.Title>
            <button onClick={() => { reset(); onClose(); }} className="rounded-full p-1.5 hover:bg-neutral-100">
              <X className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {hasPassword && (
              <div className="relative">
                <Input
                  label={t('currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  error={errors.currentPassword?.message}
                  {...register('currentPassword', { required: 'Required' })}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
            <div className="relative">
              <Input
                label={t('newPassword')}
                type={showNew ? 'text' : 'password'}
                error={errors.newPassword?.message}
                {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } })}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label={t('confirmNewPassword')}
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Required',
                validate: (v) => v === watch('newPassword') || 'Passwords do not match',
              })}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="md" onClick={() => { reset(); onClose(); }}>{tCommon('cancel')}</Button>
              <Button type="submit" size="md" isLoading={mutation.isPending}>
                {hasPassword ? t('changePassword') : 'Set password'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const [confirmText, setConfirmText] = useState('');
  const locale = useLocale();
  const router = useRouter();
  const { logout } = useAuth();

  /* G10: check for active bookings before allowing deletion */
  const activeBookingsQuery = useQuery({
    queryKey: ['active-bookings-check'],
    queryFn: async () => {
      const trips = await bookingsApi.getMyTrips();
      return trips.filter((b: any) => ['pending', 'confirmed', 'in_progress'].includes(b.status));
    },
    enabled: open,
  });
  const activeBookings = activeBookingsQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted. We\'re sorry to see you go.');
      logout();
      router.push(`/${locale}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete account');
    },
  });

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3 mb-5">
            <div className="rounded-xl bg-red-100 p-2 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <Dialog.Title className="text-base font-semibold text-neutral-900">{t('deleteAccountTitle')}</Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-500 mt-1">
                {t('deleteAccountDesc')}
              </Dialog.Description>
            </div>
            <button onClick={handleClose} className="ml-auto rounded-full p-1.5 hover:bg-neutral-100 shrink-0">
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          </div>

          {/* G10: Active bookings warning */}
          {activeBookings.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4 text-sm text-amber-800">
              <p className="font-medium">⚠ You have {activeBookings.length} active booking{activeBookings.length > 1 ? 's' : ''}</p>
              <p className="text-amber-700 mt-1">Please cancel or complete your active bookings before deleting your account. Deleting now may result in loss of deposits and booking guarantees.</p>
            </div>
          )}

          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-5 text-sm space-y-1 text-red-800">
            <p className="font-medium">What will be deleted:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              <li>Your profile, name, email and phone number</li>
              <li>Your photo and any uploaded documents</li>
              <li>Your listings will be archived</li>
              <li>All booking history and messages</li>
              <li>Reviews you have written</li>
            </ul>
          </div>

          <div className="space-y-2 mb-5">
            <label className="text-sm font-medium text-neutral-700">
              {t('typeDeleteToConfirm')}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={handleClose} disabled={mutation.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              size="md"
              className="flex-1 !bg-red-600 hover:!bg-red-700"
              disabled={confirmText !== 'DELETE' || mutation.isPending || activeBookings.length > 0}
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t('deleteAccount')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ChangeEmailModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ newEmail: string }>();

  const mutation = useMutation({
    mutationFn: ({ newEmail }: { newEmail: string }) => authApi.requestEmailChange(newEmail),
    onSuccess: () => {
      setStep('sent');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send verification email');
    },
  });

  const handleClose = () => {
    reset();
    setStep('input');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-neutral-900">{t('changeEmailTitle')}</Dialog.Title>
            <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-neutral-100">
              <X className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
          {step === 'input' ? (
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <Input
                label={t('newEmailAddress')}
                type="email"
                placeholder="you@example.com"
                error={errors.newEmail?.message}
                {...register('newEmail', {
                  required: 'Required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
              <p className="text-sm text-neutral-500">
                We will send a confirmation link to your new address. Your email will not change until you click the link.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="md" onClick={handleClose}>{tCommon('cancel')}</Button>
                <Button type="submit" size="md" isLoading={mutation.isPending}>{t('sendConfirmation')}</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="text-5xl">📧</div>
              <p className="text-neutral-700 font-medium">{t('checkNewInbox')}</p>
              <p className="text-sm text-neutral-500">
                {t('emailChangeSentDesc')}
              </p>

              <Button variant="outline" size="md" className="mt-2" onClick={handleClose}>{tCommon('done')}</Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AccountPageContent() {
  const locale = useLocale();
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isLoggedIn, hasHydrated, user, setUser, logout, isHost, isConsultant } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SECTIONS = [
    ...BASE_SECTIONS,
    ...(isHost ? [HOST_SECTION] : []),
    ...(isConsultant ? [CONSULTANT_SECTION] : []),
  ];
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [totpStep, setTotpStep] = useState<'idle' | 'scan' | 'verify-enable' | 'disable'>('idle');
  const [totpQr, setTotpQr] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCodeInput] = useState('');

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: authApi.getSessions,
    enabled: false,
  });

  const exportMutation = useMutation({
    mutationFn: usersApi.exportData,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-sakan-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data downloaded');
    },
    onError: () => toast.error('Export failed — please try again'),
  });

  const unlinkGoogleMutation = useMutation({
    mutationFn: authApi.unlinkGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Google account unlinked');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Could not unlink Google'),
  });

  const setupTotpMutation = useMutation({
    mutationFn: authApi.setupTotp,
    onSuccess: (data) => {
      setTotpQr(data.qrDataUrl);
      setTotpSecret(data.secret);
      setTotpStep('scan');
    },
    onError: () => toast.error('Failed to start 2FA setup'),
  });

  const enableTotpMutation = useMutation({
    mutationFn: (code: string) => authApi.enableTotp(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setTotpStep('idle');
      setTotpCodeInput('');
      toast.success('Two-factor authentication enabled');
    },
    onError: () => toast.error('Invalid code — please try again'),
  });

  const disableTotpMutation = useMutation({
    mutationFn: (code: string) => authApi.disableTotp(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setTotpStep('idle');
      setTotpCodeInput('');
      toast.success('Two-factor authentication disabled');
    },
    onError: () => toast.error('Invalid code — please try again'),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => refetchSessions(),
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: authApi.revokeAllSessions,
    onSuccess: () => refetchSessions(),
  });

  useEffect(() => {
    const action = searchParams.get('action');
    const token = searchParams.get('token');
    if (action === 'confirm-email' && token) {
      authApi.confirmEmailChange(token)
        .then(() => {
          toast.success('Email changed! Please log in again.');
          logout();
          router.push(`/${locale}/login`);
        })
        .catch((err: any) => {
          toast.error(err?.response?.data?.message ?? 'Invalid or expired link');
          router.replace(`/${locale}/account`);
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
  }, [hasHydrated, isLoggedIn, locale, router]);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    enabled: hasHydrated && isLoggedIn,
  });

  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updated) => {
      const prevPhone = profile?.phone ?? user?.phone;
      setUser(updated);
      queryClient.setQueryData(['me'], updated);
      // If phone was changed, the backend resets isPhoneVerified → prompt re-verification
      if (prevPhone && updated.phone && updated.phone !== prevPhone && !(updated as any).isPhoneVerified) {
        toast.success('Profile updated. Please verify your new phone number.');
      } else {
        toast.success('Profile updated');
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Update failed'),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.setQueryData(['me'], updated);
      toast.success('Photo updated');
    },
    onError: () => toast.error('Upload failed'),
  });

  const { register: regProfile, handleSubmit: submitProfile, reset: resetProfile, setValue: setProfileValue, watch: watchProfile } = useForm({
    defaultValues: { firstName: '', lastName: '', phone: '', bio: '' },
  });

  const phoneValue = watchProfile('phone');

  useEffect(() => {
    if (profile) {
      resetProfile({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile, resetProfile]);

  if (!hasHydrated || !isLoggedIn) return <FullPageSpinner />;

  const currentUser = profile ?? user!;
  const avatarSrc = getImageUrl((currentUser as any)?.avatarUrl ?? currentUser?.avatar);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold text-neutral-900 mb-10">{t('title')}</h1>

      <Tabs.Root defaultValue="personal">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Tabs.List className="space-y-1" aria-label="Account sections">
            {SECTIONS.map(({ value, labelKey, label, icon: Icon }) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors text-left data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
                asChild
              >
                <button>
                  <Icon className="h-4 w-4" />
                  {label ?? t(labelKey as any)}
                </button>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="md:col-span-3 space-y-6">
            <Tabs.Content value="personal">
              {currentUser && !currentUser.isEmailVerified && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Verify your email to unlock bookings</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Check your inbox or{' '}
                      <button
                        onClick={() =>
                          authApi
                            .sendVerificationEmail()
                            .then(() => toast.success('Verification email sent!'))
                            .catch(() => toast.error('Could not send email — please try again'))
                        }
                        className="underline font-medium"
                      >
                        resend the link
                      </button>
                    </p>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center gap-5 p-6 border-b border-neutral-200">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar
                      src={avatarSrc}
                      firstName={currentUser?.firstName}
                      lastName={currentUser?.lastName}
                      size="xl"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadAvatarMutation.isPending
                        ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        : <Camera className="h-5 w-5 text-white" />
                      }
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadAvatarMutation.mutate(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900">{currentUser?.firstName} {currentUser?.lastName}</h2>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-neutral-700 hover:text-neutral-900 font-medium mt-0.5"
                    >
                      {t('changePhoto')}
                    </button>
                    <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed max-w-xs">
                      👀 Use a clear, front-facing photo of your face — no sunglasses, hats, or group shots.
                      Your profile photo must match your government ID for identity verification.
                    </p>
                  </div>
                </div>

                <form onSubmit={submitProfile((data) => {
                  // Normalize phone from PhoneInput format "+XX 0XXXXXXXXX" to backend format
                  if (data.phone) {
                    const raw = data.phone.replace(/\s+/g, ''); // "+2001012345678" or "01012345678"
                    // If it has country code + local with leading 0 (e.g. +2001012345678), strip the extra 0
                    const m = raw.match(/^(\+\d{2,4})(0)(\d+)$/);
                    data.phone = m ? `${m[1]}${m[3]}` : raw;
                  }
                  updateProfileMutation.mutate(data);
                })} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label={t('firstName')} {...regProfile('firstName')} />
                    <Input label={t('lastName')} {...regProfile('lastName')} />
                  </div>
                  <PhoneInput
                    value={phoneValue}
                    onChange={(v) => setProfileValue('phone', v, { shouldDirty: true })}
                  />
                  <Textarea label={t('bio')} placeholder="Tell others a little about yourself..." rows={4} {...regProfile('bio')} />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={updateProfileMutation.isPending} size="md">{t('saveChanges')}</Button>
                  </div>
                </form>
              </div>
            </Tabs.Content>

            <Tabs.Content value="security">
              {/* Login credentials */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t('security')}</h2>
                <div className="flex items-center justify-between py-4 border-b border-neutral-100">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{t('email')}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{currentUser?.email}</p>
                  </div>
                  <button onClick={() => setEmailModalOpen(true)}
                    className="text-sm font-semibold text-neutral-900 underline hover:text-neutral-700 transition-colors">
                    {t('update')}
                  </button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{t('passwordLabel')}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {profile?.googleId && !(profile as any)?.passwordHash ? 'Not set' : '••••••••••'}
                    </p>
                  </div>
                  <button onClick={() => setPasswordModalOpen(true)}
                    className="text-sm font-semibold text-neutral-900 underline hover:text-neutral-700 transition-colors">
                    {profile?.googleId && !(profile as any)?.passwordHash ? 'Add password' : t('update')}
                  </button>
                </div>
              </div>
              <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} hasPassword={!profile?.googleId} />
              <ChangeEmailModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} />

              {/* Two-Factor Authentication */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-neutral-600" />
                    <h3 className="text-base font-semibold text-neutral-900">Two-Factor Authentication</h3>
                  </div>
                  {(profile as any)?.isTotpEnabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <Check className="h-3 w-3" /> Enabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mb-4">
                  Add an extra layer of security by requiring a code from your authenticator app on every login.
                </p>

                {totpStep === 'idle' && (
                  <>
                    {(profile as any)?.isTotpEnabled ? (
                      <button
                        onClick={() => setTotpStep('disable')}
                        className="text-sm font-medium text-red-600 underline hover:text-red-700"
                      >
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={() => setupTotpMutation.mutate()}
                        disabled={setupTotpMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                        {setupTotpMutation.isPending ? 'Setting up…' : 'Set up 2FA'}
                      </button>
                    )}
                  </>
                )}

                {totpStep === 'scan' && (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-600">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.
                    </p>
                    {totpQr && <img src={totpQr} alt="2FA QR code" className="w-40 h-40 rounded-lg border border-neutral-200" />}
                    <p className="text-xs text-neutral-500">Manual entry key: <code className="font-mono bg-neutral-100 px-1 rounded">{totpSecret}</code></p>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={totpCode}
                        onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-32 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                      <button
                        onClick={() => enableTotpMutation.mutate(totpCode)}
                        disabled={totpCode.length !== 6 || enableTotpMutation.isPending}
                        className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        {enableTotpMutation.isPending ? 'Verifying…' : 'Confirm & Enable'}
                      </button>
                      <button onClick={() => { setTotpStep('idle'); setTotpCodeInput(''); }} className="text-sm text-neutral-500 hover:text-neutral-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {totpStep === 'disable' && (
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600">Enter the 6-digit code from your authenticator app to confirm disabling 2FA.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={totpCode}
                        onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-32 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                      <button
                        onClick={() => disableTotpMutation.mutate(totpCode)}
                        disabled={totpCode.length !== 6 || disableTotpMutation.isPending}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {disableTotpMutation.isPending ? 'Disabling…' : 'Disable 2FA'}
                      </button>
                      <button onClick={() => { setTotpStep('idle'); setTotpCodeInput(''); }} className="text-sm text-neutral-500 hover:text-neutral-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Connected Accounts */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <MonitorSmartphone className="h-4 w-4 text-neutral-600" />
                  <h3 className="text-base font-semibold text-neutral-900">Connected Accounts</h3>
                </div>
                <p className="text-sm text-neutral-500 mb-4">Manage social accounts linked to your profile.</p>
                <div className="flex items-center justify-between py-3 border border-neutral-100 rounded-xl px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold">G</div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Google</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {(profile as any)?.googleId ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {(profile as any)?.googleId ? (
                    <button
                      onClick={() => unlinkGoogleMutation.mutate()}
                      disabled={unlinkGoogleMutation.isPending}
                      className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-400">Sign in with Google to connect</span>
                  )}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-neutral-600" />
                    <h3 className="text-base font-semibold text-neutral-900">Active Sessions</h3>
                  </div>
                  <button
                    onClick={() => refetchSessions()}
                    className="text-xs text-neutral-500 underline hover:text-neutral-700"
                  >
                    {sessions ? 'Refresh' : 'View sessions'}
                  </button>
                </div>
                <p className="text-sm text-neutral-500 mb-4">See where you&apos;re logged in and revoke access from other devices.</p>
                {sessions && (
                  <>
                    <ul className="space-y-2 mb-3">
                      {(sessions as any[]).map((s: any) => (
                        <li key={s.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">{s.userAgent || 'Unknown device'}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{s.ipAddress || 'Unknown IP'} · {new Date(s.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => revokeSessionMutation.mutate(s.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 ml-4 shrink-0"
                          >
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                    {(sessions as any[]).length > 1 && (
                      <button
                        onClick={() => revokeAllSessionsMutation.mutate()}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Revoke all sessions
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* G11: Payment History link */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 mt-2">
                <h3 className="text-base font-semibold text-neutral-900 mb-1">Payment History</h3>
                <p className="text-sm text-neutral-500 mb-3">View all your booking payments and transactions.</p>
                <Link
                  href={`/${locale}/account/payments`}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  View Payment History
                </Link>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-2xl border border-red-200 p-6 mt-2">
                <h3 className="text-base font-semibold text-red-700 mb-1">{t('dangerZone')}</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  {t('dangerZoneDesc')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => exportMutation.mutate()}
                    disabled={exportMutation.isPending}
                    className="flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {exportMutation.isPending ? 'Exporting…' : 'Download my data'}
                  </button>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('deleteMyAccount')}
                  </button>
                </div>
              </div>
              <DeleteAccountModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} />
            </Tabs.Content>

            <Tabs.Content value="notifications">
              <NotificationPreferencesTab />
            </Tabs.Content>

            <Tabs.Content value="hosting">
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center gap-4 p-6 border-b border-neutral-200">
                  <div className="rounded-xl bg-neutral-100 p-3">
                    <Home className="h-5 w-5 text-neutral-700" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900">Hosting</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">Manage your listings and hosting settings</p>
                  </div>
                </div>
                <div className="divide-y divide-neutral-100">
                  <Link href={`/${locale}/hosting`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Host Dashboard</p>
                      <p className="text-xs text-neutral-500 mt-0.5">View bookings, earnings and performance</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                  <Link href={`/${locale}/hosting/listings`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">My Listings</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Add, edit or remove your properties</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                  <Link href={`/${locale}/hosting/calendar`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Availability Calendar</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Manage your availability and blocked dates</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="consultant">
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center gap-4 p-6 border-b border-neutral-200">
                  <div className="rounded-xl bg-rose-50 p-3">
                    <GraduationCap className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900">Consultant</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">Manage your consultant profile and sessions</p>
                  </div>
                </div>
                <div className="divide-y divide-neutral-100">
                  <Link href={`/${locale}/consultations/dashboard`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Consultant Dashboard</p>
                      <p className="text-xs text-neutral-500 mt-0.5">View sessions, earnings and reviews</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                  <Link href={`/${locale}/consultations/availability`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Manage Availability</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Set your available hours for consultations</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                  <Link href={`/${locale}/consultations/my-profile`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Profile Settings</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Update your public consultant profile</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                </div>
              </div>
            </Tabs.Content>
          </div>
        </div>
      </Tabs.Root>
    </div>
  );
}

// ─── G7: Notification Preferences Tab ─────────────────────────────────────────
const NOTIFICATION_PREF_KEYS = [
  { key: 'bookingConfirmed', label: 'Booking confirmed' },
  { key: 'bookingCancelled', label: 'Booking cancelled' },
  { key: 'bookingRequest', label: 'New booking request (hosts)' },
  { key: 'paymentConfirmed', label: 'Payment received' },
  { key: 'refundProcessed', label: 'Refund processed' },
  { key: 'newMessage', label: 'New message' },
  { key: 'newReview', label: 'New review' },
  { key: 'promotionsAndUpdates', label: 'Promotions & updates' },
] as const;

function NotificationPreferencesTab() {
  const { data: prefs, isLoading } = useQuery<Record<string, boolean>>({
    queryKey: ['notificationPreferences'],
    queryFn: () => usersApi.getNotificationPreferences(),
  });
  const queryClient = useQueryClient();

  const togglePref = async (key: string, current: boolean) => {
    const updated = { ...(prefs ?? {}), [key]: !current };
    await usersApi.updateNotificationPreferences(updated);
    queryClient.setQueryData(['notificationPreferences'], updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-1">Notification Preferences</h2>
      <p className="text-sm text-neutral-500 mb-4">Choose which email notifications you want to receive.</p>
      {isLoading ? (
        <div className="h-10 w-32 rounded-xl bg-neutral-100 animate-pulse" />
      ) : (
        NOTIFICATION_PREF_KEYS.map(({ key, label }) => {
          const enabled = prefs?.[key] !== false; // default true
          return (
            <div key={key} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <p className="text-sm font-medium text-neutral-900">{label}</p>
              <button
                role="switch"
                aria-checked={enabled}
                onClick={() => togglePref(key, enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none ${enabled ? 'bg-neutral-900' : 'bg-neutral-200'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AccountPageContent />
    </Suspense>
  );
}