'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  AlertTriangle, CheckCircle, XCircle, Eye, Loader2,
  Home, CalendarDays, Users, DollarSign, Mail, Phone,
  ImageIcon, X, Tag, Clock, Shield,
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-900/50 text-amber-400',
  under_review: 'bg-blue-900/50 text-blue-400',
  resolved: 'bg-emerald-900/50 text-emerald-400',
  closed: 'bg-gray-700 text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-amber-400',
  critical: 'text-red-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  property_not_as_described: 'Property not as described',
  no_show: 'Host no-show',
  safety_concern: 'Safety concern',
  refund_request: 'Refund request',
  damage_claim: 'Damage claim',
  other: 'Other',
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function toEvidenceUrls(paths: string[] | null | undefined, disputeId: number): string[] {
  return (paths ?? []).map((p) => {
    const filename = p.split('/').pop() ?? '';
    return `${apiBase}/disputes/${disputeId}/evidence/${encodeURIComponent(filename)}`;
  });
}

function EvidenceGrid({ urls, title }: { urls: string[]; title: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (!urls.length) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <span className="text-xs text-gray-500">No evidence uploaded</span>
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title} <span className="text-gray-600 font-normal">({urls.length})</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIdx(idx)}
            className="aspect-square rounded-xl overflow-hidden border border-gray-800 hover:border-indigo-500 transition-colors"
          >
            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >&#8249;</button>
          )}
          <img
            src={urls[lightboxIdx]}
            alt={`Evidence ${lightboxIdx + 1}`}
            className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIdx < urls.length - 1 && (
            <button
              className="absolute right-4 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >&#8250;</button>
          )}
          <p className="absolute bottom-4 text-white/60 text-sm">{lightboxIdx + 1} / {urls.length}</p>
        </div>
      )}
    </div>
  );
}

function DisputeDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const { data: d, isLoading } = useQuery({
    queryKey: ['admin-dispute-detail', id],
    queryFn: () => adminApi.getDisputeDetail(id),
  });

  const resolve = useMutation({
    mutationFn: () => adminApi.resolveDispute(id, resolution, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin-dispute-detail', id] });
      setShowResolveForm(false);
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => adminApi.updateDisputeStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin-dispute-detail', id] });
    },
  });

  const booking = d?.booking;
  const property = booking?.property;
  const coverPhoto = property?.photos?.find((p: any) => p.isCover) ?? property?.photos?.[0];
  const guest = d?.raisedBy ?? booking?.guest;
  const host = booking?.host ?? booking?.property?.host;

  const guestEvidence = toEvidenceUrls(d?.evidence, id);
  const hostEvidence = toEvidenceUrls(d?.hostEvidence, id);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-gray-950 border border-gray-800 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white">Dispute #{id}</h2>
              {d && (
                <p className="text-xs text-gray-500">
                  Filed {new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {d.priority && (
                    <span className={cn('ml-2 font-semibold capitalize', PRIORITY_COLORS[d.priority])}>
                      Â· {d.priority}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : !d ? (
          <p className="text-center text-gray-500 py-20">Failed to load dispute.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {/* Property preview */}
            {property && (
              <div className="px-6 py-5">
                {coverPhoto && (
                  <img
                    src={getImageUrl(coverPhoto.url)}
                    alt={property.title}
                    className="w-full h-44 object-cover rounded-xl mb-3"
                  />
                )}
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{property.title}</p>
                    {property.address && (
                      <p className="text-xs text-gray-500 mt-0.5">{property.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dispute info */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Dispute Details</h3>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[d.status] ?? 'bg-gray-700 text-gray-400')}>
                  {d.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="font-bold text-white text-base">{d.title}</p>
              {d.category && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  {CATEGORY_LABELS[d.category] ?? d.category.replace(/_/g, ' ')}
                </span>
              )}
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{d.description}</p>

              {booking && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {(booking.checkIn || booking.checkOut) && (
                    <div className="flex items-start gap-2 text-sm">
                      <CalendarDays className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Stay</p>
                        <p className="text-gray-300">
                          {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          {' â†’ '}
                          {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                  {booking.guestsCount && (
                    <div className="flex items-start gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Guests</p>
                        <p className="text-gray-300">{booking.guestsCount}</p>
                      </div>
                    </div>
                  )}
                  {booking.totalAmount && (
                    <div className="flex items-start gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Booking total</p>
                        <p className="text-gray-300 font-medium">
                          {Number(booking.totalAmount).toLocaleString()} {booking.currency ?? 'EGP'}
                        </p>
                      </div>
                    </div>
                  )}
                  {d.slaDeadline && (
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">SLA deadline</p>
                        <p className="text-gray-300">
                          {new Date(d.slaDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Parties */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {/* Guest */}
              {guest && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Guest (Raised By)</p>
                  <div className="flex items-center gap-2">
                    <Avatar src={guest.avatarUrl} firstName={guest.firstName} lastName={guest.lastName} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{guest.firstName} {guest.lastName}</p>
                      {guest.email && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {guest.email}
                        </p>
                      )}
                      {guest.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3 shrink-0" /> {guest.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Host */}
              {host && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Host</p>
                  <div className="flex items-center gap-2">
                    <Avatar src={host.avatarUrl} firstName={host.firstName} lastName={host.lastName} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{host.firstName} {host.lastName}</p>
                      {host.email && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {host.email}
                        </p>
                      )}
                      {host.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3 shrink-0" /> {host.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence */}
            <div className="px-6 py-5 space-y-5">
              <h3 className="text-sm font-semibold text-gray-300">Evidence</h3>
              <EvidenceGrid urls={guestEvidence} title="Guest Evidence" />
              <EvidenceGrid urls={hostEvidence} title="Host Evidence" />
            </div>

            {/* Additional info */}
            {d.additionalInfo && (
              <div className="px-6 py-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Dispute History / Updates</h3>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed bg-gray-900/60 rounded-xl p-4 border border-gray-800">
                  {d.additionalInfo}
                </pre>
              </div>
            )}

            {/* Current resolution */}
            {(d.adminNote || d.resolution) && (
              <div className="px-6 py-5">
                <h3 className="text-sm font-semibold text-emerald-400 mb-2">Admin Decision</h3>
                {d.resolution && (
                  <p className="text-sm font-medium text-emerald-300 capitalize mb-1">
                    Resolution: {d.resolution.replace(/_/g, ' ')}
                  </p>
                )}
                {d.adminNote && (
                  <p className="text-sm text-gray-400 leading-relaxed">{d.adminNote}</p>
                )}
                {d.resolvedAt && (
                  <p className="text-xs text-gray-600 mt-2">
                    Resolved {new Date(d.resolvedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}

            {/* Admin actions */}
            <div className="px-6 py-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Admin Actions</h3>
              <div className="flex flex-wrap gap-2">
                {d.status === 'open' && (
                  <button
                    onClick={() => updateStatus.mutate('under_review')}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/60 border border-blue-900/50 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Mark Under Review
                  </button>
                )}
                {(d.status === 'open' || d.status === 'under_review') && !showResolveForm && (
                  <button
                    onClick={() => setShowResolveForm(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-900/50 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
                {d.status !== 'closed' && d.status !== 'resolved' && (
                  <button
                    onClick={() => updateStatus.mutate('closed')}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Close
                  </button>
                )}
              </div>

              {/* Resolve form */}
              {showResolveForm && (
                <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select resolutionâ€¦</option>
                      <option value="resolved_for_guest">Resolved for Guest (full refund)</option>
                      <option value="resolved_for_host">Resolved for Host (release earnings)</option>
                      <option value="split">Split decision (50/50)</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Admin Note</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Explain the reasoning behind this resolutionâ€¦"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResolveForm(false)}
                      className="flex-1 rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!resolution || resolve.isPending}
                      onClick={() => resolve.mutate()}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {resolve.isPending ? 'Savingâ€¦' : 'Confirm Resolution'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const qc = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: () => adminApi.getDisputes(statusFilter || undefined),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution, adminNote }: { id: number; resolution: string; adminNote: string }) =>
      adminApi.resolveDispute(id, resolution, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolveId(null);
      setResolution('');
      setAdminNote('');
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateDisputeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-disputes'] }),
  });

  const items = (disputes as any)?.items ?? (disputes as any[]) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Disputes</h1>
        <p className="text-sm text-gray-400 mt-1">Manage guest-filed disputes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Filed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{d.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white line-clamp-1">{d.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{d.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs capitalize">
                        {CATEGORY_LABELS[d.category] ?? d.category}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {d.raisedBy?.firstName ?? d.guest?.firstName}{' '}
                        {d.raisedBy?.lastName ?? d.guest?.lastName}
                        <p className="text-xs text-gray-500">{d.raisedBy?.email ?? d.guest?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white line-clamp-1">{d.booking?.property?.title ?? `Booking #${d.bookingId}`}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[d.status] ?? 'bg-gray-700 text-gray-400')}>
                          {d.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setDetailId(d.id)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/60 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          {d.status === 'open' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: d.id, status: 'under_review' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/60 transition-colors disabled:opacity-50"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Review
                            </button>
                          )}
                          {(d.status === 'open' || d.status === 'under_review') && (
                            <button
                              onClick={() => setResolveId(d.id)}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Resolve
                            </button>
                          )}
                          {d.status !== 'closed' && d.status !== 'resolved' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: d.id, status: 'closed' })}
                              disabled={updateStatus.isPending}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full detail modal */}
      {detailId !== null && (
        <DisputeDetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Quick resolve modal (from table row) */}
      {resolveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Resolve Dispute #{resolveId}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select resolutionâ€¦</option>
                <option value="resolved_for_guest">Resolved for Guest (full refund)</option>
                <option value="resolved_for_host">Resolved for Host (release earnings)</option>
                <option value="split">Split decision (50/50)</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Admin Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Internal note about the resolutionâ€¦"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setResolveId(null); setResolution(''); setAdminNote(''); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!resolution || resolve.isPending}
                onClick={() => resolve.mutate({ id: resolveId, resolution, adminNote })}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {resolve.isPending ? 'Savingâ€¦' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
