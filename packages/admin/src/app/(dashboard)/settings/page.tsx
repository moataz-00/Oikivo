'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Percent, Save, Calculator, Info } from 'lucide-react';
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
    key: 'experience_guest_fee_pct',
    label: 'Experience — Guest Service Fee',
    description: 'Added on top of the experience booking subtotal — paid by the guest',
    color: 'text-emerald-400',
  },
  {
    key: 'experience_host_fee_pct',
    label: 'Experience — Host Commission',
    description: 'Deducted from the host payout on each experience booking',
    color: 'text-violet-400',
  },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [example, setExample] = useState(1000);

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

  const pGuestFee  = parseFloat(values['property_guest_fee_pct'] ?? '14');
  const pHostFee   = parseFloat(values['property_host_fee_pct'] ?? '3');
  const eGuestFee  = parseFloat(values['experience_guest_fee_pct'] ?? '10');
  const eHostFee   = parseFloat(values['experience_host_fee_pct'] ?? '5');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure service fees for property and experience bookings</p>
      </div>

      {/* ─── Fee Configuration ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <Percent className="h-4 w-4 text-indigo-400" />
          <h2 className="font-semibold text-white">Service Fee Configuration</h2>
        </div>

        <div className="divide-y divide-gray-800">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-gray-800 rounded w-52 animate-pulse" />
                    <div className="h-3 bg-gray-800 rounded w-80 animate-pulse" />
                  </div>
                  <div className="h-9 bg-gray-800 rounded w-32 animate-pulse" />
                </div>
              ))
            : FEE_KEYS.map((fee) => (
                <div key={fee.key} className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium', fee.color)}>{fee.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fee.description}</p>
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
                          'w-24 rounded-lg border bg-gray-800 pl-3 pr-7 py-2 text-sm text-white text-right focus:outline-none focus:ring-2',
                          errors[fee.key]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-700 focus:ring-indigo-500',
                        )}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
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

      {/* ─── Info banner ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300">
          Fee changes are applied to <strong>new bookings only</strong>. Existing bookings retain the
          fees that were active at the time of booking.
        </p>
      </div>

      {/* ─── Fee Preview Calculator ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-indigo-400" />
          <h2 className="font-semibold text-white">Fee Preview Calculator</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Booking subtotal (EGP)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={example}
            onChange={(e) => setExample(Number(e.target.value))}
            className="w-40 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Property */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
              Property Booking
            </p>
            <div className="text-sm space-y-1.5">
              <Row label="Subtotal" value={`EGP ${example.toLocaleString()}`} valueClass="text-white" />
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
              <div className="border-t border-gray-600 pt-2 space-y-1.5">
                <Row label="Guest pays total" value={`EGP ${(example * (1 + pGuestFee / 100)).toFixed(0)}`} bold />
                <Row label="Host receives" value={`EGP ${(example * (1 - pHostFee / 100)).toFixed(0)}`} valueClass="text-emerald-400" bold />
                <Row label="Platform earns" value={`EGP ${(example * (pGuestFee + pHostFee) / 100).toFixed(0)}`} valueClass="text-violet-400" bold />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              Experience Booking
            </p>
            <div className="text-sm space-y-1.5">
              <Row label="Subtotal" value={`EGP ${example.toLocaleString()}`} valueClass="text-white" />
              <Row
                label={`Guest service fee (+${eGuestFee}%)`}
                value={`+EGP ${(example * eGuestFee / 100).toFixed(0)}`}
                valueClass="text-amber-400"
              />
              <Row
                label={`Host commission (−${eHostFee}%)`}
                value={`−EGP ${(example * eHostFee / 100).toFixed(0)}`}
                valueClass="text-red-400"
              />
              <div className="border-t border-gray-600 pt-2 space-y-1.5">
                <Row label="Guest pays total" value={`EGP ${(example * (1 + eGuestFee / 100)).toFixed(0)}`} bold />
                <Row label="Host receives" value={`EGP ${(example * (1 - eHostFee / 100)).toFixed(0)}`} valueClass="text-emerald-400" bold />
                <Row label="Platform earns" value={`EGP ${(example * (eGuestFee + eHostFee) / 100).toFixed(0)}`} valueClass="text-violet-400" bold />
              </div>
            </div>
          </div>
        </div>
      </div>
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
      <span className="text-gray-400">{label}</span>
      <span className={valueClass ?? 'text-white'}>{value}</span>
    </div>
  );
}
