'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  User,
  Home,
  AlertTriangle,
  ImageOff,
  X,
  Star,
  ShieldCheck,
  BedDouble,
  Bath,
  Users,
  Tag,
  FileText,
  DollarSign,
  CalendarClock,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const QUEUE_TABS = [
  { value: 'draft', label: 'Pending Review', color: 'text-amber-400' },
  { value: 'published', label: 'Published', color: 'text-emerald-400' },
  { value: 'archived', label: 'Archived', color: 'text-gray-500 dark:text-gray-400' },
];

// ─── Full-detail property modal ───────────────────────────────────────────────
function PropertyDetailModal({
  property,
  tab,
  onClose,
  onApprove,
  onReject,
  onArchive,
  onRestore,
  isPending,
}: {
  property: any;
  tab: string;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  isPending: boolean;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos: any[] = property.photos ?? [];
  const amenities: any[] = property.amenities ?? [];
  const houseRules: any[] = property.houseRules ?? [];

  const coverPhoto = photos[photoIndex] ?? null;

  const infoItem = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Photo gallery */}
        <div className="relative h-64 sm:h-80 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
          {coverPhoto ? (
            <img
              src={getUploadUrl(typeof coverPhoto === 'string' ? coverPhoto : (coverPhoto.url ?? null))}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-12 w-12 text-gray-500" />
            </div>
          )}

          {/* Status badge */}
          <span className={cn(
            'absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold border',
            property.status === 'published' && 'bg-emerald-900/80 border-emerald-700 text-emerald-300',
            property.status === 'draft' && 'bg-amber-900/80 border-amber-700 text-amber-300',
            property.status === 'archived' && 'bg-gray-700/80 border-gray-600 text-gray-300',
          )}>
            {property.status}
          </span>

          {/* Photo navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
              <button
                onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                disabled={photoIndex === 0}
                className="rounded-full bg-black/60 p-1 disabled:opacity-30 hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white">
                {photoIndex + 1} / {photos.length}
              </span>
              <button
                onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
                disabled={photoIndex === photos.length - 1}
                className="rounded-full bg-black/60 p-1 disabled:opacity-30 hover:bg-black/80 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-1 overflow-x-auto px-3 pb-10">
              {photos.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={cn(
                    'shrink-0 h-10 w-14 rounded overflow-hidden border-2 transition-colors',
                    i === photoIndex ? 'border-indigo-400' : 'border-transparent',
                  )}
                >
                  <img
                    src={getUploadUrl(typeof img === 'string' ? img : (img.url ?? null))}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title & category */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{property.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {property.category?.name && (
                <span className="rounded-full bg-indigo-900/40 border border-indigo-700/50 px-2 py-0.5 text-xs text-indigo-300">
                  {property.category.name}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                {[property.address, property.city, property.state, property.country].filter(Boolean).join(', ') || '—'}
              </div>
            </div>
          </div>

          {/* Key stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Price/night</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  EGP {Number(property.pricePerNight ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Guests</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{property.maxGuests ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Beds / Bedrooms</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {property.beds ?? '—'} / {property.bedrooms ?? '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Bathrooms</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{property.bathrooms ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {infoItem('Space type', property.spaceType?.replace(/_/g, ' '))}
            {infoItem('Property kind', property.propertyKind)}
            {infoItem('Cancellation', property.cancellationPolicy)}
            {infoItem('Min nights', property.minNights)}
            {infoItem('Max nights', property.maxNights)}
            {infoItem('Cleaning fee', property.cleaningFee ? `EGP ${Number(property.cleaningFee).toLocaleString()}` : 'None')}
            {infoItem('Security deposit', property.securityDeposit ? `EGP ${Number(property.securityDeposit).toLocaleString()}` : 'None')}
            {infoItem('Booking mode', property.bookingMode?.replace(/_/g, ' '))}
            {infoItem('Check-in after', property.checkInAfter)}
            {infoItem('Check-out before', property.checkOutBefore)}
            {infoItem('Allows pets', property.allowsPets ? 'Yes' : 'No')}
            {infoItem('Allows smoking', property.allowsSmoking ? 'Yes' : 'No')}
            {infoItem('Allows parties', property.allowsParties ? 'Yes' : 'No')}
            {infoItem('Allows children', property.allowsChildren ? 'Yes' : 'No')}
            {infoItem('Wizard step', property.wizardLastStep)}
            {property.latitude && infoItem('Coordinates', `${property.latitude}, ${property.longitude}`)}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Amenities ({amenities.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((a: any, ai: number) => (
                  <span key={a.id ?? ai} className="rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300">
                    {typeof a === 'string' ? a : (a.name ?? '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* House rules */}
          {houseRules.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                House Rules ({houseRules.length})
              </p>
              <ul className="space-y-1">
                {houseRules.map((r: any, ri: number) => (
                  <li key={r.id ?? ri} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {typeof r === 'string' ? r : (r.rule ?? '')}
                    {r.ruleAr ? <span className="text-gray-500 text-xs">({r.ruleAr})</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Host info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Host</p>
            <div className="flex items-center gap-3">
              {property.host?.avatarUrl ? (
                <img
                  src={getUploadUrl(property.host.avatarUrl)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {property.host?.firstName} {property.host?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{property.host?.email}</p>
                {property.host?.phone && (
                  <p className="text-xs text-gray-500">{property.host.phone}</p>
                )}
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                {property.host?.isIdVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-900/50 border border-emerald-700/50 px-2 py-0.5 text-xs text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> ID verified
                  </span>
                )}
                {property.host?.isSuperhost && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-900/50 border border-amber-700/50 px-2 py-0.5 text-xs text-amber-400">
                    <Star className="h-3 w-3" /> Superhost
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            {tab === 'draft' && (
              <>
                <button
                  onClick={() => onApprove(property.id)}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Publish
                </button>
                <button
                  onClick={() => onReject(property.id)}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </>
            )}
            {tab === 'published' && (
              <button
                onClick={() => onArchive(property.id)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Archive
              </button>
            )}
            {tab === 'archived' && (
              <button
                onClick={() => onRestore(property.id)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Restore & Publish
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentModerationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'draft' | 'published' | 'archived'>('draft');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalPropertyId, setModalPropertyId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; status: 'published' | 'archived'; label: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-moderation', tab, page, search],
    queryFn: () =>
      adminApi.getProperties({ page, limit: 15, status: tab, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' }) =>
      adminApi.updatePropertyStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(
        status === 'published' ? 'Listing approved and published' :
        status === 'archived' ? 'Listing rejected and archived' :
        'Listing moved to draft',
      );
      setModalPropertyId(null);
      setConfirmAction(null);
      qc.invalidateQueries({ queryKey: ['admin-moderation'] });
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Action failed'),
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];
  const modalProperty = items.find((p: any) => p.id === modalPropertyId);

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load moderation queue</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">The backend may be unavailable. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review property listings before they go public</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {QUEUE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value as any); setPage(1); }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.value
                ? `border-indigo-500 ${t.color}`
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        className="flex gap-2"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, city, host…"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-100 dark:bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <CheckCircle2 className="h-10 w-10 text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No listings in this queue</p>
          <p className="text-gray-600 text-sm">
            {tab === 'draft' ? 'No pending listings awaiting review.' : 'None found.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p: any) => {
            const coverImage = p.photos?.[0] ?? null;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col"
              >
                {/* Cover image */}
                <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
                  {coverImage ? (
                    <img
                      src={getUploadUrl(typeof coverImage === 'string' ? coverImage : (coverImage.url ?? null))}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium border',
                      p.status === 'published' && 'bg-emerald-900/70 border-emerald-800/50 text-emerald-400',
                      p.status === 'draft' && 'bg-amber-900/70 border-amber-800/50 text-amber-400',
                      p.status === 'archived' && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400',
                    )}
                  >
                    {p.status}
                  </span>
                  {(p.photos?.length ?? 0) > 1 && (
                    <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-gray-300">
                      +{p.photos.length - 1} photos
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {p.city}{p.country ? `, ${p.country}` : ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    {p.host?.firstName} {p.host?.lastName}
                    <span className="text-gray-600">·</span>
                    <span>{p.host?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Home className="h-3 w-3" />{p.propertyKind ?? p.spaceType ?? '—'}</span>
                    <span>{p.maxGuests ?? '—'} guests</span>
                    <span>EGP {Number(p.pricePerNight ?? 0).toLocaleString()}/night</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2">
                  <button
                    onClick={() => setModalPropertyId(p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Full Details
                  </button>
                  {tab === 'draft' && (
                    <>
                      <button
                        onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                        disabled={updateStatus.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirmAction({ id: p.id, status: 'archived', label: 'Reject' })}
                        disabled={updateStatus.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-800 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  {tab === 'published' && (
                    <button
                      onClick={() => setConfirmAction({ id: p.id, status: 'archived', label: 'Archive' })}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  )}
                  {tab === 'archived' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: p.id, status: 'published' })}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{d?.total ?? 0} total listings</span>
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-900 dark:text-white">{page} / {d.totalPages}</span>
            <button
              disabled={page === d.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Full-detail modal */}
      {modalProperty && (
        <PropertyDetailModal
          property={modalProperty}
          tab={tab}
          onClose={() => setModalPropertyId(null)}
          onApprove={(id) => updateStatus.mutate({ id, status: 'published' })}
          onReject={(id) => { setModalPropertyId(null); setConfirmAction({ id, status: 'archived', label: 'Reject' }); }}
          onArchive={(id) => { setModalPropertyId(null); setConfirmAction({ id, status: 'archived', label: 'Archive' }); }}
          onRestore={(id) => updateStatus.mutate({ id, status: 'published' })}
          isPending={updateStatus.isPending}
        />
      )}

      {/* Confirmation modal for reject/archive */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{confirmAction.label} Listing?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will {confirmAction.label === 'Reject' ? 'archive the listing and remove it from public view' : 'move the listing to the archive'}. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: confirmAction.id, status: confirmAction.status })}
                disabled={updateStatus.isPending}
                className="flex-1 rounded-lg bg-red-800 hover:bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Processing…' : `Confirm ${confirmAction.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
