'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  GraduationCap, CheckCircle, XCircle, Clock, Eye,
  TrendingUp, Users, DollarSign, Star, Search, Filter,
  ChevronLeft, ChevronRight, X, Edit3, Save, Ban,
  Shield, Sparkles, FileText, Calendar, MapPin, Globe,
  Banknote, CreditCard, Phone, Video, MessageSquare,
  Download, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function egp(n: number): string {
  return `EGP ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  approved: 'bg-emerald-900/50 text-emerald-400',
  rejected: 'bg-red-900/50 text-red-400',
  suspended: 'bg-gray-700 text-gray-400',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  confirmed: 'bg-blue-900/50 text-blue-400',
  in_progress: 'bg-indigo-900/50 text-indigo-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  cancelled: 'bg-red-900/50 text-red-400',
  no_show: 'bg-gray-700 text-gray-400',
  disputed: 'bg-orange-900/50 text-orange-400',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  submitted: 'bg-blue-900/50 text-blue-400',
  paid: 'bg-emerald-900/50 text-emerald-400',
  refunded: 'bg-red-900/50 text-red-400',
  hold: 'bg-gray-700 text-gray-400',
  refund_pending: 'bg-orange-900/50 text-orange-400',
};

const DOC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400 border-amber-700',
  approved: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  verified: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  rejected: 'bg-red-900/50 text-red-400 border-red-700',
};

const DELIVERY_ICONS: Record<string, React.ElementType> = {
  video_call: Video,
  phone: Phone,
  in_person: MapPin,
  chat: MessageSquare,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── Section Header ───────────────────────────────────────────────────────── */

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-wide mb-2', className)}>{children}</p>;
}

function InfoRow({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-2 py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={cn('text-sm font-medium text-right', valueClass ?? 'text-white')}>{value}</span>
    </div>
  );
}

/* ─── Metric Card ──────────────────────────────────────────────────────────── */

function MetricCard({ label, value, icon: Icon, gradient }: { label: string; value: string | number; icon: React.ElementType; gradient: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSULTANT DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════════════ */

function ConsultantDetailModal({ consultantId, onClose }: { consultantId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'profile' | 'bookings' | 'documents' | 'availability'>('profile');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingStatus, setBookingStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-consultant-detail', consultantId],
    queryFn: () => adminApi.getConsultantDetail(consultantId),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['admin-consultant-bookings', consultantId, bookingPage, bookingStatus],
    queryFn: () => adminApi.getConsultantBookings(consultantId, { page: bookingPage, limit: 10, status: bookingStatus || undefined }),
    enabled: tab === 'bookings',
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.updateConsultant(consultantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-consultant-detail', consultantId] });
      qc.invalidateQueries({ queryKey: ['admin-consultants'] });
      setEditing(false);
      toast.success('Consultant updated');
    },
    onError: () => toast.error('Failed to update consultant'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ decision, reason }: { decision: string; reason?: string }) =>
      adminApi.reviewConsultant(consultantId, decision, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-consultant-detail', consultantId] });
      qc.invalidateQueries({ queryKey: ['admin-consultants'] });
      qc.invalidateQueries({ queryKey: ['admin-consultation-stats'] });
      setRejectMode(false);
      setRejectionReason('');
      toast.success('Decision applied');
    },
    onError: () => toast.error('Action failed'),
  });

  const c = data as any;
  const bookings = bookingsData as any;

  function startEditing() {
    if (!c) return;
    setEditForm({
      displayName: c.displayName ?? '',
      bio: c.bio ?? '',
      specializations: (c.specializations ?? []).join(', '),
      yearsExperience: c.yearsExperience ?? 0,
      languages: (c.languages ?? []).join(', '),
      hourlyRate: c.hourlyRate ?? 0,
      isFeatured: c.isFeatured ?? false,
    });
    setEditing(true);
  }

  function saveEdit() {
    const payload: Record<string, unknown> = {
      displayName: editForm.displayName,
      bio: editForm.bio,
      specializations: editForm.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
      yearsExperience: Number(editForm.yearsExperience),
      languages: editForm.languages.split(',').map((s: string) => s.trim()).filter(Boolean),
      hourlyRate: Number(editForm.hourlyRate),
      isFeatured: editForm.isFeatured,
    };
    updateMutation.mutate(payload);
  }

  const TABS = [
    { key: 'profile', label: 'Profile' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'documents', label: 'Documents' },
    { key: 'availability', label: 'Availability' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-gray-800/80 p-2 text-gray-400 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="space-y-4 p-6 animate-pulse">
            <div className="h-8 w-1/3 bg-gray-800 rounded" />
            <div className="h-4 w-1/4 bg-gray-800 rounded" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-lg" />)}
            </div>
          </div>
        ) : c ? (
          <div>
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-2xl font-bold text-white shrink-0">
                  {c.displayName?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-white">{c.displayName}</h2>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[c.status])}>
                      {c.status}
                    </span>
                    {c.isFeatured && (
                      <span className="rounded-full bg-amber-900/50 text-amber-400 px-2.5 py-0.5 text-xs font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{c.user?.email}</p>
                  <p className="text-sm text-gray-500">{c.user?.firstName} {c.user?.lastName} • #{c.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!editing && (
                    <button onClick={startEditing} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors">
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3 text-center">
                  <p className="text-lg font-bold text-white">{c.stats?.bookingCount ?? 0}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
                <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{egp(c.stats?.totalEarnings ?? 0)}</p>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
                <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3 text-center">
                  <p className="text-lg font-bold text-amber-400">★ {Number(c.avgRating || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{c.stats?.reviewCount ?? c.reviewCount ?? 0} Reviews</p>
                </div>
                <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-3 text-center">
                  <p className="text-lg font-bold text-white">{egp(Number(c.hourlyRate || 0))}</p>
                  <p className="text-xs text-gray-500">Hourly Rate</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-5 border-b border-gray-800">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                      tab === t.key ? 'text-indigo-400 border-indigo-400' : 'text-gray-500 border-transparent hover:text-gray-300',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-5">
              {/* ── PROFILE TAB ── */}
              {tab === 'profile' && (
                <>
                  {editing ? (
                    <div className="space-y-4">
                      <SectionLabel className="text-indigo-400">Edit Consultant Profile</SectionLabel>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                          <input value={editForm.displayName} onChange={(e) => setEditForm((f: any) => ({ ...f, displayName: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Hourly Rate (EGP)</label>
                          <input type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm((f: any) => ({ ...f, hourlyRate: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Years of Experience</label>
                          <input type="number" value={editForm.yearsExperience} onChange={(e) => setEditForm((f: any) => ({ ...f, yearsExperience: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                            Featured
                            <Sparkles className="h-3 w-3 text-amber-400" />
                          </label>
                          <button
                            onClick={() => setEditForm((f: any) => ({ ...f, isFeatured: !f.isFeatured }))}
                            className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full', editForm.isFeatured ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700')}
                          >
                            {editForm.isFeatured ? 'Featured ★' : 'Not Featured'}
                          </button>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Specializations (comma-separated)</label>
                          <input value={editForm.specializations} onChange={(e) => setEditForm((f: any) => ({ ...f, specializations: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Languages (comma-separated)</label>
                          <input value={editForm.languages} onChange={(e) => setEditForm((f: any) => ({ ...f, languages: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Bio</label>
                          <textarea rows={3} value={editForm.bio} onChange={(e) => setEditForm((f: any) => ({ ...f, bio: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={updateMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </button>
                        <button onClick={() => setEditing(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Profile Info */}
                      <div className="grid lg:grid-cols-2 gap-5">
                        <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
                          <SectionLabel className="text-violet-400">Profile Details</SectionLabel>
                          <InfoRow label="Display Name" value={c.displayName} />
                          <InfoRow label="Hourly Rate" value={`${c.currency ?? 'EGP'} ${Number(c.hourlyRate).toLocaleString()}/hr`} valueClass="text-emerald-400" />
                          <InfoRow label="Experience" value={`${c.yearsExperience ?? 0} years`} />
                          <InfoRow label="Total Sessions" value={c.totalSessions ?? 0} />
                          <InfoRow label="Timezone" value={c.timezone ?? 'UTC'} />
                          <InfoRow label="Created" value={c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'} />
                          {c.approvedAt && <InfoRow label="Approved" value={new Date(c.approvedAt).toLocaleDateString()} valueClass="text-emerald-400" />}
                          {c.rejectionReason && <InfoRow label="Rejection Reason" value={c.rejectionReason} valueClass="text-red-400" />}
                        </div>

                        <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
                          <SectionLabel className="text-sky-400">User Account</SectionLabel>
                          <InfoRow label="Name" value={`${c.user?.firstName ?? ''} ${c.user?.lastName ?? ''}`} />
                          <InfoRow label="Email" value={c.user?.email ?? '—'} />
                          <InfoRow label="Phone" value={c.user?.phone ?? '—'} />
                          <InfoRow label="User ID" value={`#${c.userId}`} />
                          <InfoRow label="Is Consultant" value={c.user?.isConsultant ? 'Yes' : 'No'} valueClass={c.user?.isConsultant ? 'text-emerald-400' : 'text-red-400'} />
                          <InfoRow label="Is Host" value={c.user?.isHost ? 'Yes' : 'No'} />

                          <SectionLabel className="text-amber-400 mt-4">Payout Settings</SectionLabel>
                          <InfoRow label="Payout Method" value={c.payoutMethod ?? 'Not set'} valueClass={c.payoutMethod ? 'text-white' : 'text-gray-500'} />
                          <InfoRow label="Account Details" value={c.payoutAccountDetails ?? 'Not set'} valueClass={c.payoutAccountDetails ? 'text-white' : 'text-gray-500'} />
                        </div>
                      </div>

                      {/* Specializations & Languages */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <SectionLabel className="text-gray-500">Specializations</SectionLabel>
                          <div className="flex flex-wrap gap-2">
                            {(c.specializations ?? []).length > 0 ? (c.specializations ?? []).map((s: string) => (
                              <span key={s} className="rounded-full bg-violet-900/40 text-violet-300 border border-violet-700 px-3 py-1 text-xs">
                                {s.replace(/_/g, ' ')}
                              </span>
                            )) : <span className="text-sm text-gray-500">None</span>}
                          </div>
                        </div>
                        <div>
                          <SectionLabel className="text-gray-500">Languages</SectionLabel>
                          <div className="flex flex-wrap gap-2">
                            {(c.languages ?? []).length > 0 ? (c.languages ?? []).map((l: string) => (
                              <span key={l} className="rounded-full bg-sky-900/40 text-sky-300 border border-sky-700 px-3 py-1 text-xs">
                                {l}
                              </span>
                            )) : <span className="text-sm text-gray-500">None</span>}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {c.bio && (
                        <div>
                          <SectionLabel className="text-gray-500">Bio</SectionLabel>
                          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed bg-gray-800/60 border border-gray-700 rounded-xl p-4">{c.bio}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  {!editing && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                      {c.status === 'pending' && (
                        <>
                          <button onClick={() => reviewMutation.mutate({ decision: 'approved' })} disabled={reviewMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                            <CheckCircle className="h-4 w-4" /> Approve
                          </button>
                          <button onClick={() => setRejectMode(true)} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                            <XCircle className="h-4 w-4" /> Reject
                          </button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <button onClick={() => updateMutation.mutate({ status: 'suspended' })} disabled={updateMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 transition-colors">
                          <Ban className="h-4 w-4" /> Suspend
                        </button>
                      )}
                      {c.status === 'suspended' && (
                        <button onClick={() => updateMutation.mutate({ status: 'approved' })} disabled={updateMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                          <Shield className="h-4 w-4" /> Reactivate
                        </button>
                      )}
                      {c.status === 'rejected' && (
                        <button onClick={() => reviewMutation.mutate({ decision: 'approved' })} disabled={reviewMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                          <CheckCircle className="h-4 w-4" /> Re-Approve
                        </button>
                      )}
                      <button
                        onClick={() => updateMutation.mutate({ isFeatured: !c.isFeatured })}
                        disabled={updateMutation.isPending}
                        className={cn('flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50', c.isFeatured ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-amber-700 text-white hover:bg-amber-600')}
                      >
                        <Sparkles className="h-4 w-4" /> {c.isFeatured ? 'Remove Featured' : 'Set Featured'}
                      </button>
                    </div>
                  )}

                  {/* Rejection Modal */}
                  {rejectMode && (
                    <div className="rounded-xl border border-red-700 bg-red-900/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-medium">Reject Consultant — All active bookings will be cancelled</p>
                      </div>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => reviewMutation.mutate({ decision: 'rejected', reason: rejectionReason })}
                          disabled={reviewMutation.isPending}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Confirm Rejection
                        </button>
                        <button onClick={() => { setRejectMode(false); setRejectionReason(''); }} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── BOOKINGS TAB ── */}
              {tab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {['', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'disputed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setBookingStatus(s); setBookingPage(1); }}
                        className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', bookingStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
                      >
                        {s || 'All'}
                      </button>
                    ))}
                  </div>

                  {(bookings?.items ?? []).length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {(bookings?.items ?? []).map((b: any) => {
                          const DeliveryIcon = DELIVERY_ICONS[b.deliveryMode] ?? Calendar;
                          return (
                            <div key={b.id} className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3 min-w-0">
                                  <DeliveryIcon className="h-5 w-5 text-indigo-400 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-medium text-white">
                                        {b.client?.firstName ?? 'Unknown'} {b.client?.lastName ?? ''}
                                      </p>
                                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', BOOKING_STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-400')}>
                                        {b.status?.replace(/_/g, ' ')}
                                      </span>
                                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PAYMENT_STATUS_COLORS[b.paymentStatus] ?? 'bg-gray-700 text-gray-400')}>
                                        {b.paymentStatus}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '—'} • {b.durationMinutes}min • {b.deliveryMode?.replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-white">{egp(Number(b.price ?? 0))}</p>
                                  <p className="text-xs text-gray-500">Fee: {egp(Number(b.platformFee ?? 0))}</p>
                                  <p className="text-xs text-gray-500">Payout: {egp(Number(b.consultantPayout ?? 0))}</p>
                                </div>
                              </div>
                              {(b.clientNote || b.consultantNote) && (
                                <div className="mt-3 pt-3 border-t border-gray-700 grid sm:grid-cols-2 gap-3 text-xs">
                                  {b.clientNote && (
                                    <div>
                                      <p className="text-gray-500">Client Note</p>
                                      <p className="text-gray-300 mt-0.5">{b.clientNote}</p>
                                    </div>
                                  )}
                                  {b.consultantNote && (
                                    <div>
                                      <p className="text-gray-500">Consultant Note</p>
                                      <p className="text-gray-300 mt-0.5">{b.consultantNote}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {b.cancellationReason && (
                                <div className="mt-2 text-xs">
                                  <span className="text-red-400">Cancelled by {b.cancelledBy}: </span>
                                  <span className="text-gray-400">{b.cancellationReason}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {bookings?.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <button disabled={bookingPage === 1} onClick={() => setBookingPage((p) => p - 1)} className="rounded p-1 text-gray-400 hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                          <span className="text-gray-400">{bookingPage} / {bookings?.totalPages}</span>
                          <button disabled={bookingPage === bookings?.totalPages} onClick={() => setBookingPage((p) => p + 1)} className="rounded p-1 text-gray-400 hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-8 text-center">No bookings found.</p>
                  )}
                </div>
              )}

              {/* ── DOCUMENTS TAB ── */}
              {tab === 'documents' && (
                <div className="space-y-3">
                  {(c.documents ?? []).length > 0 ? c.documents.map((d: any) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileUrl ?? '');
                    const docUrl = getUploadUrl(d.fileUrl);
                    return (
                      <div key={d.id} className="rounded-xl bg-gray-800/60 border border-gray-700 overflow-hidden">
                        {isImage && (
                          <a href={docUrl} target="_blank" rel="noopener noreferrer">
                            <img src={docUrl} alt={d.originalName ?? d.documentType} className="h-40 w-full object-cover hover:opacity-80 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </a>
                        )}
                        <div className="flex items-center justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{d.originalName ?? d.documentType}</p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">{(d.documentType ?? '').replace(/_/g, ' ')}</p>
                            {d.uploadedAt && <p className="text-xs text-gray-600 mt-0.5">Uploaded: {new Date(d.uploadedAt).toLocaleDateString()}</p>}
                            {d.adminNote && <p className="text-xs text-gray-400 mt-1">Admin note: {d.adminNote}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', DOC_STATUS_COLORS[d.status] ?? 'bg-gray-700 text-gray-400 border-gray-600')}>
                              {d.status}
                            </span>
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Open">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <a href={docUrl} download className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Download">
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-gray-500 py-8 text-center">No documents uploaded.</p>
                  )}
                </div>
              )}

              {/* ── AVAILABILITY TAB ── */}
              {tab === 'availability' && (
                <div className="space-y-4">
                  {(c.availability ?? []).length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {DAY_NAMES.map((dayName, dayIndex) => {
                        const slots = (c.availability ?? []).filter((a: any) => Number(a.dayOfWeek) === dayIndex);
                        if (slots.length === 0) return null;
                        return (
                          <div key={dayIndex} className="rounded-xl bg-gray-800/60 border border-gray-700 p-3">
                            <p className="text-sm font-medium text-white mb-2">{dayName}</p>
                            <div className="space-y-1">
                              {slots.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-300">{s.startTime} — {s.endTime}</span>
                                  <span className={s.isActive ? 'text-emerald-400' : 'text-gray-500'}>{s.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-8 text-center">No availability slots configured.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400 text-sm">Consultant not found.</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function AdminConsultationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin-consultation-stats'],
    queryFn: () => adminApi.getConsultationStats(),
  });

  const { data: consultantsData, isLoading } = useQuery({
    queryKey: ['admin-consultants', statusFilter, page],
    queryFn: () => adminApi.getConsultants({ status: statusFilter || undefined, page, limit: 20 }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, reason }: { id: number; decision: string; reason?: string }) =>
      adminApi.reviewConsultant(id, decision, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-consultants'] });
      qc.invalidateQueries({ queryKey: ['admin-consultation-stats'] });
      toast.success('Done');
    },
    onError: () => toast.error('Action failed'),
  });

  const s = stats as any;
  const consultants = consultantsData?.data ?? [];
  const totalPages = consultantsData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Consultations</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage consultants, applications, bookings & payouts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Consultants" value={s?.consultants?.total ?? 0} icon={GraduationCap} gradient="bg-gradient-to-br from-violet-600 to-violet-700" />
        <MetricCard label="Pending Applications" value={s?.consultants?.pending ?? 0} icon={Clock} gradient="bg-gradient-to-br from-amber-600 to-amber-700" />
        <MetricCard label="Completed Sessions" value={s?.bookings?.completed ?? 0} icon={TrendingUp} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" />
        <MetricCard label="Platform Revenue" value={egp(s?.platformRevenue ?? 0)} icon={DollarSign} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {['', 'pending', 'approved', 'rejected', 'suspended'].map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', statusFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Specializations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sessions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-5 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                : consultants.map((c: any) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => setDetailId(c.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-700 text-sm font-medium text-white shrink-0">
                            {c.displayName?.[0] ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-white truncate">{c.displayName}</p>
                              {c.isFeatured && <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.specializations ?? []).slice(0, 2).map((sp: string) => (
                            <span key={sp} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">{sp.replace(/_/g, ' ')}</span>
                          ))}
                          {(c.specializations ?? []).length > 2 && (
                            <span className="text-xs text-gray-600">+{c.specializations.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{c.currency ?? 'EGP'} {Number(c.hourlyRate).toLocaleString()}/hr</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-amber-400">★ {Number(c.avgRating || 0).toFixed(1)} <span className="text-gray-600 text-xs">({c.reviewCount})</span></span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{c.totalSessions ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[c.status])}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailId(c.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {c.status === 'pending' && (
                            <>
                              <button onClick={() => reviewMutation.mutate({ id: c.id, decision: 'approved' })} disabled={reviewMutation.isPending} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-900/30 transition-colors" title="Approve">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setDetailId(c.id); }} className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/30 transition-colors" title="Reject">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            <span>{consultantsData?.total ?? 0} total consultants</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-white">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Consultant Detail Modal */}
      {detailId && <ConsultantDetailModal consultantId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
