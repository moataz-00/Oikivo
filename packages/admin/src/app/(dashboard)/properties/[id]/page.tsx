'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Trash2, MapPin, Bed, Bath, Users, Star, CalendarCheck, DollarSign,
  Eye, Sparkles, Percent, MessageSquare, Archive, FileEdit, X, AlertTriangle,
  Home, Calendar, Clock, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, getUploadUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

/* ─── Action Confirm Modal ───────────────────────────────────────────────────── */
function ActionModal({
  title, message, confirmLabel, confirmClass, icon: Icon, onConfirm, onCancel, loading,
}: {
  title: string; message: React.ReactNode; confirmLabel: string; confirmClass: string;
  icon: React.ElementType; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-red-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={cn('flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50', confirmClass)}>
            <Icon className="h-4 w-4" />
            {loading ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-900/50 text-emerald-400',
  draft: 'bg-amber-900/50 text-amber-400',
  pending_review: 'bg-blue-900/50 text-blue-400',
  archived: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function PropertyDetailPage() {
  const { id: uuid } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['admin-property', uuid],
    queryFn: () => adminApi.getPropertyByUuid(uuid),
    enabled: !!uuid,
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  // Action modals
  const [showDelete, setShowDelete] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-property', uuid] });
    qc.invalidateQueries({ queryKey: ['admin-properties'] });
  };

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updatePropertyByUuid(uuid, data),
    onSuccess: () => { invalidateAll(); setEditing(false); toast.success('Property updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update property'),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.deletePropertyByUuid(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-properties'] }); router.push('/properties'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete property'),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => adminApi.updatePropertyStatusByUuid(uuid, status as any),
    onSuccess: (_, status) => {
      invalidateAll();
      setShowArchive(false); setShowPublish(false); setShowDraft(false);
      toast.success(`Property set to ${status}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update status'),
  });

  const featuredMut = useMutation({
    mutationFn: () => adminApi.toggleFeaturedByUuid(uuid),
    onSuccess: () => { invalidateAll(); toast.success('Featured status toggled'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to toggle featured'),
  });

  const [commissionEdit, setCommissionEdit] = useState(false);
  const [commissionVal, setCommissionVal] = useState('');
  const commissionMut = useMutation({
    mutationFn: (percent: number) => adminApi.updateCommissionByUuid(uuid, percent),
    onSuccess: () => { invalidateAll(); setCommissionEdit(false); toast.success('Commission updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update commission'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" />
    </div>
  );
  if (isError || !property) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <Home className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      <p className="text-lg font-semibold text-gray-900 dark:text-white">Property not found</p>
      <button onClick={() => router.push('/properties')} className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Properties</button>
    </div>
  );

  const p = property as any;
  const isFeatured = !!p.isFeatured;

  const startEdit = () => {
    setForm({
      title: p.title ?? '',
      description: p.description ?? '',
      pricePerNight: p.pricePerNight ?? '',
      weekendPrice: p.weekendPrice ?? '',
      cleaningFee: p.cleaningFee ?? 0,
      securityDeposit: p.securityDeposit ?? 0,
      maxGuests: p.maxGuests ?? 1,
      bedrooms: p.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? 1,
      beds: p.beds ?? 1,
      minNights: p.minNights ?? 1,
      maxNights: p.maxNights ?? 365,
      city: p.city ?? '',
      country: p.country ?? '',
      checkInAfter: p.checkInAfter ?? '',
      checkOutBefore: p.checkOutBefore ?? '',
      allowsPets: p.allowsPets ?? false,
      allowsSmoking: p.allowsSmoking ?? false,
      allowsParties: p.allowsParties ?? false,
      cancellationPolicy: p.cancellationPolicy ?? 'flexible',
    });
    setEditing(true);
  };

  const saveEdit = () => updateMut.mutate({
    ...form,
    pricePerNight: parseFloat(form.pricePerNight) || null,
    weekendPrice: parseFloat(form.weekendPrice) || null,
    cleaningFee: parseFloat(form.cleaningFee) || 0,
    securityDeposit: parseFloat(form.securityDeposit) || 0,
    maxGuests: parseInt(form.maxGuests) || 1,
    bedrooms: parseInt(form.bedrooms) || 0,
    bathrooms: parseFloat(form.bathrooms) || 1,
    beds: parseInt(form.beds) || 1,
    minNights: parseInt(form.minNights) || 1,
    maxNights: parseInt(form.maxNights) || 365,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/properties')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{p.title}</h1>
            {isFeatured && <span className="text-amber-400 text-lg">⭐</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[p.city, p.state, p.country].filter(Boolean).join(', ')}
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
              {p.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing && <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Edit</button>}
          {editing && (
            <>
              <button onClick={saveEdit} disabled={updateMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save className="h-4 w-4" />Save
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors">Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Bookings', value: p.stats?.bookingCount ?? 0, icon: CalendarCheck, color: 'text-blue-400' },
          { label: 'Revenue', value: `EGP ${(p.stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Avg Rating', value: Number(p.avgRating || 0) > 0 ? `★ ${Number(p.avgRating).toFixed(1)}` : '—', icon: Star, color: 'text-amber-400' },
          { label: 'Reviews', value: p.reviewCount ?? 0, icon: MessageSquare, color: 'text-violet-400' },
          { label: 'Views', value: (p.viewCount ?? 0).toLocaleString(), icon: Eye, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('h-4 w-4', s.color)} />
              <span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Booking breakdown */}
      {p.stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Paid', value: p.stats.paidCount ?? 0, cls: 'text-emerald-400' },
            { label: 'Pending', value: p.stats.pendingCount ?? 0, cls: 'text-amber-400' },
            { label: 'Cancelled', value: p.stats.cancelledCount ?? 0, cls: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span>
              <span className={cn('text-lg font-bold', s.cls)}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Photos */}
      {(p.photos?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Photos ({p.photos.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {p.photos.map((photo: any, i: number) => (
              <img key={photo.id ?? i} src={getUploadUrl(photo.url)} alt="" className="w-full h-28 object-cover rounded-lg border border-gray-300 dark:border-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details (left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Property Details</h2>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {([
                    ['pricePerNight', 'Price/Night (EGP)'],
                    ['weekendPrice', 'Weekend Price'],
                    ['cleaningFee', 'Cleaning Fee'],
                    ['securityDeposit', 'Security Deposit'],
                    ['maxGuests', 'Max Guests'],
                    ['bedrooms', 'Bedrooms'],
                    ['bathrooms', 'Bathrooms'],
                    ['beds', 'Beds'],
                    ['minNights', 'Min Nights'],
                    ['maxNights', 'Max Nights'],
                    ['city', 'City'],
                    ['country', 'Country'],
                    ['checkInAfter', 'Check-in After'],
                    ['checkOutBefore', 'Check-out Before'],
                  ] as [string, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500">{label}</label>
                      <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500">Cancellation Policy</label>
                    <select value={form.cancellationPolicy} onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1">
                      <option value="flexible">Flexible</option>
                      <option value="moderate">Moderate</option>
                      <option value="strict">Strict</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-1 text-sm">
                  {(['allowsPets', 'allowsSmoking', 'allowsParties'] as string[]).map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-700" />
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace('allows', 'Allows ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {p.description && <p className="text-sm text-gray-600 dark:text-gray-300">{p.description}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 pt-2 text-sm">
                  {([
                    ['Space Type', p.spaceType?.replace(/_/g, ' ')],
                    ['Property Kind', p.propertyKind],
                    ['Price/Night', p.pricePerNight ? `EGP ${Number(p.pricePerNight).toLocaleString()}` : '—'],
                    ['Weekend Price', p.weekendPrice ? `EGP ${Number(p.weekendPrice).toLocaleString()}` : '—'],
                    ['Weekly Discount', p.weeklyDiscount ? `${p.weeklyDiscount}%` : '—'],
                    ['Monthly Discount', p.monthlyDiscount ? `${p.monthlyDiscount}%` : '—'],
                    ['Cleaning Fee', `EGP ${Number(p.cleaningFee || 0).toLocaleString()}`],
                    ['Security Deposit', `EGP ${Number(p.securityDeposit || 0).toLocaleString()}`],
                    ['Cancellation', p.cancellationPolicy],
                    ['Booking Mode', p.bookingMode?.replace(/_/g, ' ')],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 uppercase">{label}</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-0.5 capitalize">{value ?? '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800">
                  <span className="flex items-center gap-1"><Bed className="h-4 w-4 text-gray-500" />{p.bedrooms} bedroom{p.bedrooms !== 1 ? 's' : ''} · {p.beds} bed{p.beds !== 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-gray-500" />{p.bathrooms} bath</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4 text-gray-500" />Max {p.maxGuests} guests</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-500" />Check-in {p.checkInAfter || '—'} · out {p.checkOutBefore || '—'}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: 'Pets', allowed: p.allowsPets },
                    { label: 'Smoking', allowed: p.allowsSmoking },
                    { label: 'Parties', allowed: p.allowsParties },
                    { label: 'Children', allowed: p.allowsChildren },
                  ].map(rule => (
                    <span key={rule.label} className={cn('text-xs px-2 py-0.5 rounded-full', rule.allowed ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400')}>
                      {rule.allowed ? '✓' : '✗'} {rule.label}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Amenities */}
            {(p.amenities?.length ?? 0) > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Amenities ({p.amenities.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {p.amenities.map((a: any) => (
                    <span key={a.id} className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">{a.icon ?? ''} {a.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {(p.houseRules?.length ?? 0) > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">House Rules</h3>
                <ul className="space-y-1">
                  {p.houseRules.map((r: any, i: number) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-300">• {typeof r === 'string' ? r : (r.rule ?? r.ruleEn ?? '')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          {(p.recentBookings?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings (last {p.recentBookings.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                      <th className="pb-2 text-xs text-gray-500 uppercase">Guest</th>
                      <th className="pb-2 text-xs text-gray-500 uppercase">Check-in</th>
                      <th className="pb-2 text-xs text-gray-500 uppercase">Check-out</th>
                      <th className="pb-2 text-xs text-gray-500 uppercase">Guests</th>
                      <th className="pb-2 text-xs text-gray-500 uppercase">Total</th>
                      <th className="pb-2 text-xs text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {p.recentBookings.map((b: any) => (
                      <tr key={b.id}>
                        <td className="py-2 text-gray-900 dark:text-white">{b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : '—'}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '—'}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : '—'}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{b.guests ?? '—'}</td>
                        <td className="py-2 text-gray-900 dark:text-white font-medium">{b.totalAmount ? `EGP ${Number(b.totalAmount).toLocaleString()}` : '—'}</td>
                        <td className="py-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', b.status === 'paid' || b.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' : b.status === 'pending' ? 'bg-amber-900/40 text-amber-400' : b.status === 'cancelled' ? 'bg-red-900/40 text-red-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reviews */}
          {(p.reviews?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reviews ({p.reviewCount ?? p.reviews.length})</h2>
              <div className="space-y-3">
                {p.reviews.slice(0, 10).map((r: any) => (
                  <div key={r.id} className="border-b border-gray-200/50 dark:border-gray-800/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(r.overallRating || r.rating || 0))}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : 'Guest'}</span>
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (right 1/3) */}
        <div className="space-y-4">
          {/* Status Actions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Status Actions</h2>
            <button onClick={() => setShowPublish(true)} disabled={p.status === 'published' || statusMut.isPending}
              className={cn('w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors', p.status === 'published' ? 'bg-emerald-600 text-white cursor-default' : 'bg-gray-100 dark:bg-gray-800 hover:bg-emerald-900/30 hover:text-emerald-400 text-gray-600 dark:text-gray-300 disabled:opacity-30')}>
              <Eye className="h-4 w-4 inline mr-1.5" />Publish
            </button>
            <button onClick={() => setShowDraft(true)} disabled={p.status === 'draft' || statusMut.isPending}
              className={cn('w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors', p.status === 'draft' ? 'bg-amber-600 text-white cursor-default' : 'bg-gray-100 dark:bg-gray-800 hover:bg-amber-900/30 hover:text-amber-400 text-gray-600 dark:text-gray-300 disabled:opacity-30')}>
              <FileEdit className="h-4 w-4 inline mr-1.5" />Set to Draft
            </button>
            <button onClick={() => setShowArchive(true)} disabled={p.status === 'archived' || statusMut.isPending}
              className={cn('w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors', p.status === 'archived' ? 'bg-gray-600 text-white cursor-default' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30')}>
              <Archive className="h-4 w-4 inline mr-1.5" />Archive
            </button>
            <button onClick={() => setShowDelete(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm text-red-400 transition-colors mt-1">
              <Trash2 className="h-4 w-4" />Delete Property
            </button>
          </div>

          {/* Featured & Commission */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Promotion</h2>
            <button onClick={() => featuredMut.mutate()} disabled={featuredMut.isPending}
              className={cn('w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50', isFeatured ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300')}>
              <Sparkles className="h-4 w-4" />{isFeatured ? '★ Featured' : 'Mark as Featured'}
            </button>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase flex items-center gap-1"><Percent className="h-3 w-3" />Commission</span>
                {!commissionEdit && <button onClick={() => { setCommissionVal(String(p.serviceFeePercent ?? 14)); setCommissionEdit(true); }} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>}
              </div>
              {commissionEdit ? (
                <div className="flex gap-2">
                  <input type="number" step="0.5" min="0" max="100" value={commissionVal} onChange={e => setCommissionVal(e.target.value)} className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-gray-900 dark:text-white text-sm" />
                  <button onClick={() => commissionMut.mutate(parseFloat(commissionVal))} disabled={commissionMut.isPending} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded disabled:opacity-50">Save</button>
                  <button onClick={() => setCommissionEdit(false)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs rounded">×</button>
                </div>
              ) : (
                <p className="text-sm text-gray-900 dark:text-white font-medium">{Number(p.serviceFeePercent ?? 14).toFixed(1)}%</p>
              )}
            </div>
          </div>

          {/* Host */}
          {p.host && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Host</h2>
              <Link href={`/users/${p.host.profileUuid ?? p.host.id}`} className="flex items-center gap-3 hover:bg-gray-800/50 rounded-lg p-2 -mx-2 transition-colors">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {p.host.firstName?.[0]}{p.host.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.host.firstName} {p.host.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{p.host.email}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Metadata</h2>
            {([
              ['ID', `#${p.id}`],
              ['UUID', p.uuid?.substring(0, 13) + '…'],
              ['Category', p.category?.name],
              ['Min/Max Nights', `${p.minNights} – ${p.maxNights}`],
              ['Instant Book', p.instantBook ? 'Yes' : 'No'],
              ['Verified Guest', p.requireVerifiedGuest ? 'Required' : 'No'],
              ['Approvals', p.approvedBookingsCount ?? 0],
              ['Impressions', p.impressionCount ?? 0],
              ['Latitude', p.latitude],
              ['Longitude', p.longitude],
              ['Created', new Date(p.createdAt).toLocaleDateString()],
              ['Updated', new Date(p.updatedAt).toLocaleDateString()],
            ] as [string, any][]).filter(([, v]) => v !== undefined && v !== null).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm gap-2">
                <span className="text-gray-500 shrink-0">{label}</span>
                <span className="text-gray-900 dark:text-white text-right truncate">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <AdminNotesSection uuid={uuid} currentNote={p.adminNote} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-property', uuid] })} />

      {/* Action Modals */}
      {showPublish && (
        <ActionModal title="Publish Property" icon={Eye} message={<>Make <strong className="text-gray-900 dark:text-white">"{p.title}"</strong> live? Guests will be able to book it immediately.</>} confirmLabel="Publish" confirmClass="bg-emerald-600 hover:bg-emerald-500" loading={statusMut.isPending} onConfirm={() => statusMut.mutate('published')} onCancel={() => setShowPublish(false)} />
      )}
      {showDraft && (
        <ActionModal title="Set to Draft" icon={FileEdit} message={<>Set <strong className="text-gray-900 dark:text-white">"{p.title}"</strong> to draft? It will be hidden from guests until re-published.</>} confirmLabel="Set Draft" confirmClass="bg-amber-600 hover:bg-amber-500" loading={statusMut.isPending} onConfirm={() => statusMut.mutate('draft')} onCancel={() => setShowDraft(false)} />
      )}
      {showArchive && (
        <ActionModal title="Archive Property" icon={Archive} message={<>Archive <strong className="text-gray-900 dark:text-white">"{p.title}"</strong>? Data is preserved but the listing is removed from search.</>} confirmLabel="Archive" confirmClass="bg-gray-600 hover:bg-gray-500" loading={statusMut.isPending} onConfirm={() => statusMut.mutate('archived')} onCancel={() => setShowArchive(false)} />
      )}
      {showDelete && (
        <ActionModal title="Delete Property" icon={AlertTriangle} message={<>This will <strong className="text-red-400">permanently delete</strong> <strong className="text-gray-900 dark:text-white">"{p.title}"</strong> and ALL associated bookings, reviews, and data. This cannot be undone.</>} confirmLabel="Delete Forever" confirmClass="bg-red-600 hover:bg-red-700" loading={deleteMut.isPending} onConfirm={() => deleteMut.mutate()} onCancel={() => setShowDelete(false)} />
      )}
    </div>
  );
}

/* ─── Admin Notes Sub-component ─────────────────────────────────────────────── */
function AdminNotesSection({ uuid, currentNote, onSaved }: { uuid: string; currentNote?: string; onSaved: () => void }) {
  const [note, setNote] = useState(currentNote ?? '');
  const [editing, setEditing] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => adminApi.updatePropertyByUuid(uuid, { adminNote: note }),
    onSuccess: () => { onSaved(); setEditing(false); toast.success('Note saved'); },
    onError: () => toast.error('Failed to save note'),
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Notes</h2>
        </div>
        {!editing && (
          <button onClick={() => { setNote(currentNote ?? ''); setEditing(true); }} className="text-xs text-indigo-400 hover:text-indigo-300">
            {currentNote ? 'Edit' : 'Add Note'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Add admin notes, change request details, or internal flags…"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      ) : currentNote ? (
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{currentNote}</p>
      ) : (
        <p className="text-sm text-gray-500 italic">No admin notes yet</p>
      )}
    </div>
  );
}
