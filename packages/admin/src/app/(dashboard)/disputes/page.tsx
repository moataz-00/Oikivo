'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, apiClient, getUploadUrl } from '@/lib/api';
import {
  Scale, CheckCircle, XCircle, Eye, Clock, AlertTriangle, Search,
  ChevronLeft, ChevronRight, Flag, X, ExternalLink, FileImage, User,
  Building2, Calendar, Hash, UserPlus, Shield, Info, ChevronDown, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-900/50 text-red-400',
  under_review: 'bg-amber-900/50 text-amber-400',
  resolved: 'bg-emerald-900/50 text-emerald-400',
  closed: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  medium: 'bg-blue-900/50 text-blue-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const RESOLUTION_OPTIONS = [
  { value: 'resolved_for_guest', label: 'Resolved for Guest' },
  { value: 'resolved_for_host', label: 'Resolved for Host' },
  { value: 'split', label: 'Split Decision' },
  { value: 'dismissed', label: 'Dismissed' },
];

const RESOLUTION_COLORS: Record<string, string> = {
  resolved_for_guest: 'text-blue-400',
  resolved_for_host: 'text-violet-400',
  split: 'text-amber-400',
  dismissed: 'text-gray-400',
};

// ─── SecureImg ────────────────────────────────────────────────────────────────

function SecureImg({
  path, alt, className, onClick,
}: {
  path: string; alt?: string; className?: string; onClick?: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objUrl = '';
    apiClient
      .get('/admin/secure-file', { params: { path }, responseType: 'blob' })
      .then((r) => { objUrl = URL.createObjectURL(r.data); setSrc(objUrl); })
      .catch(() => setError(true));
    return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [path]);

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-gray-500', className)}>
        <FileImage className="h-5 w-5" />
      </div>
    );
  }
  if (!src) {
    return <div className={cn('bg-gray-200 dark:bg-gray-800 animate-pulse rounded', className)} />;
  }
  return <img src={src} alt={alt ?? ''} className={cn('object-cover', className)} onClick={onClick} />;
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({ user, label, isRaiser }: { user: any; label: string; isRaiser?: boolean }) {
  if (!user) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-0.5">{label}</p>
          <p className="text-sm text-gray-400 italic">Unknown user</p>
        </div>
      </div>
    );
  }

  const avatarUrl = user.avatarUrl ? getUploadUrl(user.avatarUrl) : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt={user.firstName} className="h-full w-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-xs font-medium text-gray-400 uppercase">{label}</p>
          {isRaiser && (
            <span className="text-[10px] bg-red-900/30 text-red-400 rounded-full px-1.5 py-0.5 font-medium">
              Raised dispute
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
      {user.profileUuid && (
        <Link
          href={`/users/${user.profileUuid}`}
          className="shrink-0 p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-900/30 transition-colors"
          title="View user"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ─── EvidenceGallery ──────────────────────────────────────────────────────────

function EvidenceGallery({ files, label, accent }: { files: string[] | null; label: string; accent: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!files || files.length === 0) {
    return (
      <div>
        <p className={cn('text-xs font-semibold uppercase mb-1', accent)}>{label}</p>
        <p className="text-xs text-gray-500 italic">No evidence submitted</p>
      </div>
    );
  }

  return (
    <div>
      <p className={cn('text-xs font-semibold uppercase mb-2', accent)}>
        {label}{' '}
        <span className="normal-case text-gray-400 font-normal">
          ({files.length} file{files.length !== 1 ? 's' : ''})
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {files.map((path, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(path)}
            className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <SecureImg path={path} alt={`Evidence ${i + 1}`} className="h-20 w-20 cursor-pointer" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl max-h-[90vh] overflow-auto rounded-xl">
            <SecureImg path={lightbox} alt="Evidence" className="max-w-full max-h-[85vh] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CustomSelect ────────────────────────────────────────────────────────────

function CustomSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder = 'Select…',
}: {
  value: string | number;
  onChange: (val: string) => void;
  options: { value: string | number; label: string; dot?: string; avatar?: string | null }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
          'hover:border-indigo-400 dark:hover:border-indigo-500',
          open && 'border-indigo-500 ring-2 ring-indigo-500/20',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {selected?.dot && (
          <span className={cn('h-2 w-2 rounded-full shrink-0', selected.dot)} />
        )}
        {selected?.avatar !== undefined && (
          <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {selected.avatar
              ? <img src={selected.avatar} className="h-full w-full object-cover rounded-full" alt="" />
              : selected.label !== (placeholder) ? selected.label.charAt(0).toUpperCase() : '?'
            }
          </span>
        )}
        <span className={cn('flex-1 text-left truncate', !selected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  {opt.dot && <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />}
                  {opt.avatar !== undefined && (
                    <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                      {opt.avatar
                        ? <img src={opt.avatar} className="h-full w-full object-cover" alt="" />
                        : opt.label !== placeholder ? opt.label.charAt(0).toUpperCase() : ''
                      }
                    </span>
                  )}
                  <span className="flex-1 text-left truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CalendarPicker ───────────────────────────────────────────────────────────

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [cursor, setCursor] = useState<{ year: number; month: number }>({
    year: selected?.getFullYear() ?? today.getFullYear(),
    month: selected?.getMonth() ?? today.getMonth(),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pick = (day: number) => {
    const d = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(d);
    setOpen(false);
  };

  const prevMonth = () => setCursor((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCursor((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const quickPicks = [
    { label: '+3d', days: 3 }, { label: '+1w', days: 7 }, { label: '+2w', days: 14 }, { label: '+1m', days: 30 },
  ];

  const isOverdue = selected && selected < today;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (selected) setCursor({ year: selected.getFullYear(), month: selected.getMonth() });
          setOpen((o) => !o);
        }}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
          'hover:border-indigo-400 dark:hover:border-indigo-500',
          open && 'border-indigo-500 ring-2 ring-indigo-500/20',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Calendar className={cn('h-4 w-4 shrink-0', isOverdue ? 'text-red-400' : selected ? 'text-indigo-400' : 'text-gray-400')} />
        <span className={cn('flex-1 text-left', !selected ? 'text-gray-400 dark:text-gray-500' : isOverdue ? 'text-red-400 font-medium' : 'text-gray-900 dark:text-white')}>
          {selected
            ? selected.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Set deadline…'
          }
        </span>
        {selected && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        {!selected && <ChevronDown className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-180')} />}
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 right-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-3 w-72">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick picks */}
          <div className="flex gap-1.5 mb-3">
            {quickPicks.map((q) => {
              const d = new Date();
              d.setDate(d.getDate() + q.days);
              const iso = d.toISOString().split('T')[0];
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className="flex-1 rounded-md py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 pb-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const cellIso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === cellIso;
              const isToday = (
                day === today.getDate() &&
                cursor.month === today.getMonth() &&
                cursor.year === today.getFullYear()
              );
              const isPast = new Date(cellIso + 'T00:00:00') < new Date(today.toISOString().split('T')[0] + 'T00:00:00');
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(day)}
                  className={cn(
                    'w-full aspect-square text-xs rounded-lg transition-colors font-medium',
                    isSelected && 'bg-indigo-600 text-white',
                    !isSelected && isToday && 'border border-indigo-400 text-indigo-400',
                    !isSelected && !isToday && isPast && 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800',
                    !isSelected && !isToday && !isPast && 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DisputeViewModal ─────────────────────────────────────────────────────────

function DisputeViewModal({
  disputeId,
  onClose,
  adminUsers,
}: {
  disputeId: number;
  onClose: () => void;
  adminUsers: any[];
}) {
  const qc = useQueryClient();

  const { data: d, isLoading } = useQuery({
    queryKey: ['admin-dispute-detail', disputeId],
    queryFn: () => adminApi.getDisputeDetail(disputeId),
  });

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolution, setResolution] = useState('resolved_for_guest');
  const [adminNote, setAdminNote] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-disputes'] });
    qc.invalidateQueries({ queryKey: ['admin-dispute-detail', disputeId] });
    qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
  };

  const resolveMut = useMutation({
    mutationFn: ({ resolution, adminNote }: { resolution: string; adminNote: string }) =>
      adminApi.resolveDispute(disputeId, resolution, adminNote),
    onSuccess: () => { invalidate(); setShowResolveForm(false); toast.success('Dispute resolved'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to resolve'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => adminApi.updateDisputeStatus(disputeId, status),
    onSuccess: () => { invalidate(); toast.success('Status updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const assignMut = useMutation({
    mutationFn: (assignedToId: number | null) => adminApi.assignDispute(disputeId, assignedToId),
    onSuccess: () => { invalidate(); toast.success('Assigned'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const priorityMut = useMutation({
    mutationFn: (priority: string) => adminApi.setDisputePriority(disputeId, priority),
    onSuccess: () => { invalidate(); toast.success('Priority updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const slaMut = useMutation({
    mutationFn: (slaDeadline: string | null) => adminApi.setDisputeSla(disputeId, slaDeadline),
    onSuccess: () => { invalidate(); toast.success('SLA updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const guest = d?.booking?.guest ?? null;
  const host = d?.booking?.host ?? null;
  const guestIsRaiser = guest && d?.raisedById === guest.id;
  const hostIsRaiser = host && d?.raisedById === host.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <Scale className="h-5 w-5 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-mono">#{disputeId}</span>
                {d && (
                  <>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[d.status] ?? STATUS_COLORS.open)}>
                      {d.status?.replace('_', ' ')}
                    </span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[d.priority] ?? PRIORITY_COLORS.medium)}>
                      <Flag className="h-2.5 w-2.5 mr-1" />{d.priority ?? 'medium'}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 capitalize">
                      {d.category?.replace(/_/g, ' ')}
                    </span>
                  </>
                )}
              </div>
              {d && <h2 className="text-base font-semibold text-gray-900 dark:text-white mt-0.5 truncate">{d.title}</h2>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 shrink-0 ml-3">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : !d ? (
          <div className="flex items-center justify-center h-64 text-gray-400">Failed to load dispute</div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Booking summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 col-span-2">
                <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Property</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                    {d.booking?.property?.title ?? 'Unknown'}
                  </p>
                </div>
                {d.booking?.property?.uuid && (
                  <Link href={`/properties/${d.booking.property.uuid}`} className="ml-auto shrink-0 text-indigo-400 hover:text-indigo-300 p-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
                <Hash className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Booking</p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">#{d.bookingId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Filed</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              {d.booking?.checkIn && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 col-span-2">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Stay</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(d.booking.checkIn).toLocaleDateString()} → {new Date(d.booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {d.booking?.totalPrice != null && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 col-span-2">
                  <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Total Booking Amount</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {d.booking.currency ?? 'EGP'} {Number(d.booking.totalPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Parties */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Parties Involved</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UserCard user={guest} label="Guest" isRaiser={!!guestIsRaiser} />
                <UserCard user={host} label="Host" isRaiser={!!hostIsRaiser} />
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Description</p>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {d.description}
              </div>
            </div>

            {d.additionalInfo && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Additional Information</p>
                <div className="p-4 rounded-lg bg-amber-900/10 border border-amber-900/30 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {d.additionalInfo}
                </div>
              </div>
            )}

            {/* Evidence */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Evidence</p>
              <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
                <EvidenceGallery files={d.evidence} label="Guest evidence" accent="text-blue-400" />
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <EvidenceGallery files={d.hostEvidence} label="Host evidence" accent="text-violet-400" />
                </div>
              </div>
            </div>

            {/* Management controls */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Management</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assign To</label>
                  <CustomSelect
                    value={d.assignedToId ?? ''}
                    onChange={(val) => assignMut.mutate(val ? Number(val) : null)}
                    disabled={assignMut.isPending}
                    placeholder="Unassigned"
                    options={[
                      { value: '', label: 'Unassigned', avatar: null },
                      ...adminUsers.map((u: any) => ({
                        value: u.id,
                        label: `${u.firstName} ${u.lastName}`,
                        avatar: u.avatarUrl ? getUploadUrl(u.avatarUrl) : null,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
                  <CustomSelect
                    value={d.priority ?? 'medium'}
                    onChange={(val) => priorityMut.mutate(val)}
                    disabled={priorityMut.isPending}
                    options={[
                      { value: 'low', label: 'Low', dot: 'bg-green-400' },
                      { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
                      { value: 'high', label: 'High', dot: 'bg-orange-400' },
                      { value: 'critical', label: 'Critical', dot: 'bg-red-500' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">SLA Deadline</label>
                  <CalendarPicker
                    value={d.slaDeadline ? new Date(d.slaDeadline).toISOString().split('T')[0] : ''}
                    onChange={(val) => slaMut.mutate(val)}
                    disabled={slaMut.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Status actions */}
            {(d.status === 'open' || d.status === 'under_review') && !showResolveForm && (
              <div className="flex flex-wrap gap-2">
                {d.status === 'open' && (
                  <button
                    onClick={() => updateStatus.mutate('under_review')}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    <Clock className="h-4 w-4" />Mark Under Review
                  </button>
                )}
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />Resolve Dispute
                </button>
              </div>
            )}

            {d.status === 'resolved' && (
              <button
                onClick={() => updateStatus.mutate('closed')}
                disabled={updateStatus.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />Close Dispute
              </button>
            )}

            {/* Inline resolve form */}
            {showResolveForm && (
              <div className="space-y-3 p-4 rounded-xl border border-indigo-500/40 bg-indigo-900/10">
                <p className="text-sm font-semibold text-indigo-400">Resolve Dispute</p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                  >
                    {RESOLUTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Admin Note <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Explain the resolution…"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveMut.mutate({ resolution, adminNote })}
                    disabled={!adminNote.trim() || resolveMut.isPending}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {resolveMut.isPending ? 'Resolving…' : 'Confirm Resolution'}
                  </button>
                  <button
                    onClick={() => setShowResolveForm(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Resolution result */}
            {d.resolution && (
              <div className="p-4 rounded-lg bg-emerald-900/10 border border-emerald-900/30 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-400">
                    {RESOLUTION_OPTIONS.find((o) => o.value === d.resolution)?.label ?? d.resolution}
                  </p>
                  {d.resolvedAt && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(d.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                {d.adminNote && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">{d.adminNote}</p>
                )}
              </div>
            )}

            {/* Appeal */}
            {d.appealRequested && (
              <div className="p-4 rounded-lg bg-amber-900/10 border border-amber-900/30 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <p className="text-sm font-semibold text-amber-400">Appeal Requested</p>
                  {d.appealedAt && (
                    <span className="text-xs text-gray-500 ml-auto">{new Date(d.appealedAt).toLocaleString()}</span>
                  )}
                </div>
                {d.appealReason && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">{d.appealReason}</p>
                )}
              </div>
            )}

            {/* Footer meta */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-800">
              {d.assignedTo && (
                <span className="flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Assigned to <span className="text-gray-300">{d.assignedTo.firstName} {d.assignedTo.lastName}</span>
                </span>
              )}
              {d.slaDeadline && (
                <span className={cn('flex items-center gap-1', new Date(d.slaDeadline) < new Date() ? 'text-red-400' : 'text-amber-400')}>
                  <Info className="h-3 w-3" />
                  SLA: {new Date(d.slaDeadline).toLocaleDateString()}
                  {new Date(d.slaDeadline) < new Date() && ' — OVERDUE'}
                </span>
              )}
              <span>Created: {new Date(d.createdAt).toLocaleString()}</span>
              {d.updatedAt && <span>Updated: {new Date(d.updatedAt).toLocaleString()}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter, page, search],
    queryFn: () => adminApi.getDisputes({ status: statusFilter || undefined, page, limit: 20, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateDisputeStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update status'),
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users-for-assign'],
    queryFn: () => adminApi.getUsers({ limit: 100 }),
    select: (d: any) => (d?.items ?? []).filter((u: any) => u.isAdmin),
  });

  const items: any[] = disputes?.items ?? [];
  const paginatedData = disputes;

  return (
    <div className="space-y-5">
      {viewId !== null && (
        <DisputeViewModal
          disputeId={viewId}
          onClose={() => setViewId(null)}
          adminUsers={adminUsers}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disputes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and resolve booking disputes</p>
      </div>

      {/* Summary cards */}
      {!isLoading && (paginatedData?.total ?? 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open', value: items.filter((x) => x.status === 'open').length, color: 'text-red-400', bg: 'bg-red-900/20 border-red-900/40' },
            { label: 'Under Review', value: items.filter((x) => x.status === 'under_review').length, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-900/40' },
            { label: 'Resolved', value: items.filter((x) => x.status === 'resolved').length, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-900/40' },
            { label: 'Total', value: paginatedData?.total ?? items.length, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          className="relative ml-auto"
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search disputes…"
            className="w-56 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
            ))
          : items.length === 0
          ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center py-16 gap-3">
              <Scale className="h-10 w-10 text-gray-600" />
              <p className="text-gray-500 text-sm">No disputes found</p>
            </div>
          )
          : items.map((item: any) => {
            const raiserAvatar = item.raisedBy?.avatarUrl ? getUploadUrl(item.raisedBy.avatarUrl) : null;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 flex flex-wrap items-start gap-4"
              >
                {/* Raiser avatar */}
                <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center mt-0.5">
                  {raiserAvatar ? (
                    <img src={raiserAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">#{item.id}</span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[item.status] ?? STATUS_COLORS.open)}>
                      {item.status?.replace('_', ' ')}
                    </span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.medium)}>
                      <Flag className="h-2.5 w-2.5 mr-1" />{item.priority ?? 'medium'}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 capitalize">
                      {item.category?.replace(/_/g, ' ')}
                    </span>
                    {item.assignedTo && (
                      <span className="text-xs bg-indigo-900/30 text-indigo-400 rounded-full px-2 py-0.5">
                        <UserPlus className="h-2.5 w-2.5 inline mr-1" />{item.assignedTo.firstName}
                      </span>
                    )}
                    {item.slaDeadline && (
                      <span className={cn('text-xs rounded-full px-2 py-0.5', new Date(item.slaDeadline) < new Date() ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400')}>
                        SLA: {new Date(item.slaDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="text-gray-600 dark:text-gray-300">{item.raisedBy?.firstName} {item.raisedBy?.lastName}</span>
                    {' '}· Booking <span className="font-mono">#{item.bookingId}</span>
                    {item.booking?.property && <span> · {item.booking.property.title}</span>}
                    {' '}· {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </p>
                  {item.resolution && (
                    <p className={cn('text-xs mt-0.5 font-medium capitalize', RESOLUTION_COLORS[item.resolution] ?? 'text-gray-400')}>
                      ✓ {item.resolution.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    onClick={() => setViewId(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />View
                  </button>
                  {item.status === 'open' && (
                    <button
                      title="Mark under review"
                      onClick={() => updateStatus.mutate({ id: item.id, status: 'under_review' })}
                      disabled={updateStatus.isPending}
                      className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  )}
                  {(item.status === 'open' || item.status === 'under_review') && (
                    <button
                      onClick={() => setViewId(item.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />Resolve
                    </button>
                  )}
                  {item.status === 'resolved' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: item.id, status: 'closed' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />Close
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Pagination */}
      {(paginatedData?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{paginatedData?.total} total disputes</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-900 dark:text-white">{page} / {paginatedData?.totalPages}</span>
            <button disabled={page === paginatedData?.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
