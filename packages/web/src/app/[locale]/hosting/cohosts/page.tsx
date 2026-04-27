'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, UserPlus, Trash2, RefreshCw, Home, Shield, Brush, ChevronDown, ChevronUp, X, Info } from 'lucide-react';
import { cohostsApi, propertiesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { CoHost, CohostRole, Property } from '@/types';

// ─── Permissions summary ─────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<CohostRole, { label: string; icon: React.ReactNode; perms: string[] }> = {
  co_host: {
    label: 'Co-host',
    icon: <Shield className="h-4 w-4 text-indigo-600" />,
    perms: [
      'View and respond to guest messages',
      'Manage calendar & availability',
      'Update pricing',
      'Accept and decline booking requests',
      'Access booking details',
    ],
  },
  cleaner: {
    label: 'Cleaner',
    icon: <Brush className="h-4 w-4 text-emerald-600" />,
    perms: [
      'Receive turnover notifications (check-out day alerts)',
      'View upcoming check-in / check-out schedule',
      'No access to messages, pricing, or bookings',
    ],
  },
};

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CoHost['status'] }) {
  const cls = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    declined: 'bg-red-50 text-red-600 border-red-200',
  }[status];
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border capitalize', cls)}>
      {status}
    </span>
  );
}

// ─── Property cohost card ─────────────────────────────────────────────────────
function PropertyCohostSection({
  property,
  locale,
}: {
  property: Property;
  locale: string;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CohostRole>('co_host');
  const [showPermissions, setShowPermissions] = useState(false);

  const { data: cohostData, isLoading } = useQuery({
    queryKey: ['property-cohosts', property.id],
    queryFn: () => cohostsApi.getCohosts(property.id),
    enabled: expanded,
  });

  const cohosts: CoHost[] = cohostData?.items ?? [];

  const inviteMutation = useMutation({
    mutationFn: () =>
      cohostsApi.invite(property.id, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: () => {
      toast.success('Invitation sent!');
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['property-cohosts', property.id] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Could not send invitation');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cohostId: number) => cohostsApi.remove(property.id, cohostId),
    onSuccess: () => {
      toast.success('Co-host removed');
      queryClient.invalidateQueries({ queryKey: ['property-cohosts', property.id] });
    },
    onError: () => toast.error('Could not remove co-host'),
  });

  const reinviteMutation = useMutation({
    mutationFn: (cohostId: number) => cohostsApi.reinvite(property.id, cohostId),
    onSuccess: () => {
      toast.success('Invitation re-sent');
      queryClient.invalidateQueries({ queryKey: ['property-cohosts', property.id] });
    },
  });

  const coverPhoto = property.photos?.find((p: any) => p.isCover) ?? property.photos?.[0];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhoto.url} alt={property.title} className="h-full w-full object-cover" />
          ) : (
            <Home className="absolute inset-0 m-auto h-6 w-6 text-neutral-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{property.title}</p>
          <p className="text-xs text-neutral-500 truncate">{property.city}, {property.country}</p>
        </div>
        <div className="flex items-center gap-2 text-neutral-500">
          <Users className="h-4 w-4" />
          <span className="text-xs text-neutral-500">Team</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-neutral-100 p-4 space-y-4">
          {/* Permissions info button */}
          <button
            type="button"
            onClick={() => setShowPermissions(true)}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
          >
            <Info className="h-3.5 w-3.5" /> What can each role do?
          </button>

          {/* Current team */}
          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : cohosts.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-3">No team members yet. Invite someone below.</p>
          ) : (
            <ul className="space-y-2">
              {cohosts.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 shrink-0">
                    {(c.cohost?.firstName?.[0] ?? c.cohost?.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {c.cohost?.firstName ? `${c.cohost.firstName} ${c.cohost.lastName ?? ''}`.trim() : c.cohost?.email ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-neutral-500 capitalize">
                        {c.role === 'co_host' ? <Shield className="h-3 w-3 text-indigo-500" /> : <Brush className="h-3 w-3 text-emerald-500" />}
                        {c.role.replace('_', '-')}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.status === 'declined' && (
                      <button
                        type="button"
                        onClick={() => reinviteMutation.mutate(c.id)}
                        disabled={reinviteMutation.isPending}
                        className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
                        title="Re-invite"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(c.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Invite form */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-indigo-500" /> Invite someone
            </p>
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex gap-2">
              {(['co_host', 'cleaner'] as CohostRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteRole(r)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors',
                    inviteRole === r
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  {r === 'co_host' ? <Shield className="h-3.5 w-3.5" /> : <Brush className="h-3.5 w-3.5" />}
                  {ROLE_PERMISSIONS[r].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => inviteEmail.trim() && inviteMutation.mutate()}
              disabled={!inviteEmail.trim() || inviteMutation.isPending}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {inviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </div>
      )}

      {/* Permissions modal (WF-03) */}
      <Modal open={showPermissions} onClose={() => setShowPermissions(false)}>
        <div className="p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-neutral-900">Co-host Permissions</h2>
            <button onClick={() => setShowPermissions(false)} className="p-1 rounded-lg hover:bg-neutral-100">
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
          <div className="space-y-5">
            {(Object.entries(ROLE_PERMISSIONS) as [CohostRole, (typeof ROLE_PERMISSIONS)[CohostRole]][]).map(([role, info]) => (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2">
                  {info.icon}
                  <p className="font-semibold text-neutral-800">{info.label}</p>
                </div>
                <ul className="space-y-1 pl-6">
                  {info.perms.map((p) => (
                    <li key={p} className="text-sm text-neutral-600 list-disc">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CohostsPage() {
  const locale = useLocale();
  const { isLoggedIn, hasHydrated } = useAuth();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['host-listings-for-cohosts'],
    queryFn: () => propertiesApi.getHostListings(),
    enabled: isLoggedIn,
  });

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-neutral-900">Co-host &amp; Team</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-7">
        Manage who helps run your listings. Co-hosts have full access; cleaners receive turnover notifications only.
      </p>

      {properties.length === 0 ? (
        <div className="text-center py-16">
          <Home className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium mb-1">No listings yet</p>
          <p className="text-sm text-neutral-400 mb-6">Create a listing first to start managing your team.</p>
          <Link
            href={`/${locale}/hosting/listings/new`}
            className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Create a listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property: Property) => (
            <PropertyCohostSection key={property.id} property={property} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
