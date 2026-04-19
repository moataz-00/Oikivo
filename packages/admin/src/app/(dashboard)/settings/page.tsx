'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Percent, Save, Calculator, Info, AlertTriangle, CreditCard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Validation: all FEE_KEYS are percent fields (0–100)
function validatePercent(value: string): string | null {
  const n = parseFloat(value);
  if (value.trim() === '' || isNaN(n)) return 'Please enter a number';
  if (n < 0 || n > 100) return 'Must be between 0 and 100';
  return null;
}

const FEE_KEYS = [
  {
    key: 'property_guest_fee_pct',
    label: 'Property — Guest Service Fee',
    description: 'Added on top of the property booking subtotal — paid by the guest',
    color: 'text-sky-400',
  },
  {
    key: 'property_host_fee_pct',
    label: 'Property — Host Commission',
    description: 'Deducted from the host payout on each property booking',
    color: 'text-amber-400',
  },
  {
    key: 'consultation_user_fee_pct',
    label: 'Consultation — User Service Fee',
    description: 'Added on top of the consultation price — paid by the client',
    color: 'text-emerald-400',
  },
  {
    key: 'consultation_consultant_fee_pct',
    label: 'Consultation — Consultant Commission',
    description: 'Deducted from the consultant payout on each consultation booking',
    color: 'text-violet-400',
  },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saveAllLoading, setSaveAllLoading] = useState(false);
  const [confirmSaveAll, setConfirmSaveAll] = useState(false);
  const [example, setExample] = useState(1000);

  const feeWarning = FEE_KEYS.find((f) => {
    const n = parseFloat(values[f.key] ?? '');
    return n === 0 || n === 100;
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      (settings as any[]).forEach((s: any) => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const update = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.updateSetting(key, value),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved((prev) => ({ ...prev, [vars.key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [vars.key]: false })), 2000);
      toast.success('Setting saved');
    },
    onError: () => toast.error('Failed to save setting'),
  });

  const pGuestFee  = parseFloat(values['property_guest_fee_pct'] ?? '5');
  const pHostFee   = parseFloat(values['property_host_fee_pct'] ?? '0');
  const cUserFee   = parseFloat(values['consultation_user_fee_pct'] ?? '0');
  const cConsultFee = parseFloat(values['consultation_consultant_fee_pct'] ?? '10');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure service fees for property and consultation bookings</p>
      </div>

      {/* ─── Fee Configuration ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <Percent className="h-4 w-4 text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Service Fee Configuration</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-52 animate-pulse" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-80 animate-pulse" />
                  </div>
                  <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded w-32 animate-pulse" />
                </div>
              ))
            : FEE_KEYS.map((fee) => (
                <div key={fee.key} className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium', fee.color)}>{fee.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fee.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={values[fee.key] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setValues((prev) => ({ ...prev, [fee.key]: v }));
                          const err = validatePercent(v);
                          setErrors((prev) => ({ ...prev, [fee.key]: err ?? '' }));
                        }}
                        className={cn(
                          'w-24 rounded-lg border bg-gray-100 dark:bg-gray-800 pl-3 pr-7 py-2 text-sm text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2',
                          errors[fee.key]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500',
                        )}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                        %
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      {errors[fee.key] && (
                        <p className="text-xs text-red-400">{errors[fee.key]}</p>
                      )}
                      <button
                        onClick={() => {
                          const err = validatePercent(values[fee.key] ?? '');
                          if (err) {
                            setErrors((prev) => ({ ...prev, [fee.key]: err }));
                            return;
                          }
                          update.mutate({ key: fee.key, value: values[fee.key] ?? '' });
                        }}
                        disabled={update.isPending || !!errors[fee.key]}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
                          saved[fee.key]
                            ? 'bg-emerald-700 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700',
                        )}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saved[fee.key] ? 'Saved!' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* ─── 0 / 100 % edge-case warning ─────────────────────────────── */}
      {feeWarning && (() => {
        const n = parseFloat(values[feeWarning.key] ?? '');
        return (
          <div className="rounded-xl border border-amber-600/40 bg-amber-900/15 px-5 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">
              <strong>{feeWarning.label}</strong> is set to{' '}
              <strong>{n}%</strong>.{' '}
              {n === 0 ? 'Setting a fee to 0% disables it entirely — guests or hosts will not be charged.' : 'Setting a fee to 100% would capture all revenue from guests or pay nothing to the host.'}{' '}
              Make sure this is intentional.
            </p>
          </div>
        );
      })()}

      {/* ─── Save All Fees ───────────────────────────────────────────── */}
      <div className="flex justify-end">
        {confirmSaveAll ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-400">Overwrite all 4 fee settings?</span>
            <button
              onClick={() => setConfirmSaveAll(false)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setConfirmSaveAll(false);
                const errs: Record<string, string> = {};
                FEE_KEYS.forEach((f) => {
                  const err = validatePercent(values[f.key] ?? '');
                  if (err) errs[f.key] = err;
                });
                if (Object.keys(errs).length) { setErrors((p) => ({ ...p, ...errs })); return; }
                setSaveAllLoading(true);
                try {
                  await Promise.all(FEE_KEYS.map((f) => update.mutateAsync({ key: f.key, value: values[f.key] ?? '' })));
                  toast.success('All fees saved');
                } catch {
                  toast.error('Failed to save some fees');
                } finally {
                  setSaveAllLoading(false);
                }
              }}
              disabled={saveAllLoading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saveAllLoading ? 'Saving…' : 'Confirm Save All'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmSaveAll(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save All Fees
          </button>
        )}
      </div>

      {/* ─── Info banner ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300">
          Fee changes are applied to <strong>new bookings only</strong>. Existing bookings retain the
          fees that were active at the time of booking.
        </p>
      </div>

      {/* ─── Fee Preview Calculator ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Fee Preview Calculator</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Booking subtotal (EGP)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={example}
            onChange={(e) => setExample(Number(e.target.value))}
            className="w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Property */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
              Property Booking
            </p>
            <div className="text-sm space-y-1.5">
              <Row label="Subtotal" value={`EGP ${example.toLocaleString()}`} valueClass="text-gray-900 dark:text-white" />
              <Row
                label={`Guest service fee (+${pGuestFee}%)`}
                value={`+EGP ${(example * pGuestFee / 100).toFixed(0)}`}
                valueClass="text-amber-400"
              />
              <Row
                label={`Host commission (−${pHostFee}%)`}
                value={`−EGP ${(example * pHostFee / 100).toFixed(0)}`}
                valueClass="text-red-400"
              />
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 space-y-1.5">
                <Row label="Guest pays total" value={`EGP ${(example * (1 + pGuestFee / 100)).toFixed(0)}`} bold />
                <Row label="Host receives" value={`EGP ${(example * (1 - pHostFee / 100)).toFixed(0)}`} valueClass="text-emerald-400" bold />
                <Row label="Platform earns" value={`EGP ${(example * (pGuestFee + pHostFee) / 100).toFixed(0)}`} valueClass="text-violet-400" bold />
              </div>
            </div>
          </div>

          {/* Consultation */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              Consultation Booking
            </p>
            <div className="text-sm space-y-1.5">
              <Row label="Consultation price" value={`EGP ${example.toLocaleString()}`} valueClass="text-gray-900 dark:text-white" />
              <Row
                label={`Client service fee (+${cUserFee}%)`}
                value={`+EGP ${(example * cUserFee / 100).toFixed(0)}`}
                valueClass="text-amber-400"
              />
              <Row
                label={`Consultant commission (−${cConsultFee}%)`}
                value={`−EGP ${(example * cConsultFee / 100).toFixed(0)}`}
                valueClass="text-red-400"
              />
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 space-y-1.5">
                <Row label="Client pays total" value={`EGP ${(example * (1 + cUserFee / 100)).toFixed(0)}`} bold />
                <Row label="Consultant receives" value={`EGP ${(example * (1 - cConsultFee / 100)).toFixed(0)}`} valueClass="text-emerald-400" bold />
                <Row label="Platform earns" value={`EGP ${(example * (cUserFee + cConsultFee) / 100).toFixed(0)}`} valueClass="text-violet-400" bold />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Gateway Fees Reference ─────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Payment Gateway Fees (Reference)</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">These are fixed costs charged by payment providers — not configurable.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide">OPay (Card Payments)</p>
            <div className="text-sm space-y-1">
              <Row label="Pay-in fee" value="2.25% + EGP 2" valueClass="text-amber-400" />
              <Row label="Refund fee" value="Free" valueClass="text-emerald-400" />
            </div>
          </div>
          <div className="rounded-xl bg-gray-800/60 border border-gray-300 dark:border-gray-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">InstaPay</p>
            <div className="text-sm space-y-1">
              <Row label="Pay-in fee" value="Free" valueClass="text-emerald-400" />
              <Row label="Payout fee" value="0.1% (min 0.50, max 20 EGP)" valueClass="text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Maintenance Mode ─────────────────────────────────────────── */}
      <MaintenanceModeSection settings={settings as any[]} update={update} />

      {/* ─── Payment Gateway Config ───────────────────────────────────── */}
      <PaymentGatewaySection settings={settings as any[]} update={update} />
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
  bold,
}: {
  label: string;
  value: string;
  valueClass?: string;
  bold?: boolean;
}) {
  return (
    <div className={cn('flex justify-between gap-2', bold ? 'font-medium' : '')}>
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={valueClass ?? 'text-gray-900 dark:text-white'}>{value}</span>
    </div>
  );
}

function MaintenanceModeSection({ settings, update }: { settings: any[]; update: any }) {
  const isEnabled = (settings ?? []).find((s: any) => s.key === 'maintenance_mode')?.value === 'true';
  const currentMsg = (settings ?? []).find((s: any) => s.key === 'maintenance_message')?.value ?? '';
  const [msg, setMsg] = useState(currentMsg || 'Platform is under maintenance. Please try again later.');

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Maintenance Mode</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Scheduled Maintenance</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">When enabled, the platform shows a maintenance page to users</p>
          </div>
          <button
            onClick={() => update.mutate({ key: 'maintenance_mode', value: isEnabled ? 'false' : 'true' })}
            disabled={update.isPending}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50',
              isEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700',
            )}
          >
            <span className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
              isEnabled ? 'translate-x-5' : 'translate-x-0.5',
              'mt-0.5',
            )} />
          </button>
        </div>
        {isEnabled && (
          <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 p-3">
            <p className="text-xs text-amber-300 font-medium">⚠️ Maintenance mode is ACTIVE</p>
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 uppercase mb-1 block">Maintenance Message</label>
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => update.mutate({ key: 'maintenance_message', value: msg })}
              disabled={update.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentGatewaySection({ settings, update }: { settings: any[]; update: any }) {
  const getValue = (key: string) => (settings ?? []).find((s: any) => s.key === key)?.value ?? '';

  const gateways = [
    {
      name: 'OPay',
      icon: '💳',
      fields: [
        { key: 'opay_merchant_id', label: 'Merchant ID' },
        { key: 'opay_public_key', label: 'Public Key' },
        { key: 'opay_environment', label: 'Environment (sandbox/live)' },
      ],
    },
    {
      name: 'InstaPay',
      icon: '📱',
      fields: [
        { key: 'instapay_account', label: 'Receiving Account' },
        { key: 'instapay_ipa_handle', label: 'IPA Handle' },
      ],
    },
  ];

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-emerald-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Payment Gateway Configuration</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {gateways.map((gw) => (
          <div key={gw.name} className="p-5 space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{gw.icon} {gw.name}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {gw.fields.map((f) => {
                const current = getValue(f.key);
                const editVal = editValues[f.key];
                return (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                    <div className="flex gap-1.5">
                      <input
                        value={editVal ?? current}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {editVal !== undefined && editVal !== current && (
                        <button
                          onClick={() => {
                            update.mutate({ key: f.key, value: editVal });
                            setEditValues((prev) => { const n = { ...prev }; delete n[f.key]; return n; });
                          }}
                          disabled={update.isPending}
                          className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/30">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Sensitive keys (secret keys, API secrets) should be configured via environment variables, not here.
        </p>
      </div>
    </div>
  );
}
