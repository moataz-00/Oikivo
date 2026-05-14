'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Shield, ShieldOff, Ban, Trash2, Save, Building2, CalendarCheck, Star, DollarSign, Bell, Clock, X, AlertTriangle, MapPin, Globe, Calendar, Activity, FileText } from 'lucide-react';
import { adminApi, getUploadUrl, apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

/** Fetches a protected upload via the credentialed API client and renders via a blob URL */
function AuthImg({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return;
    let revoked = false;
    setBlobUrl(null);
    setFailed(false);
    apiClient.get('/admin/secure-file', { params: { path: (() => { try { return new URL(src).pathname; } catch { return src; } })() }, responseType: 'blob' })
      .then((res) => {
        if (!revoked) setBlobUrl(URL.createObjectURL(res.data));
      })
      .catch(() => { if (!revoked) setFailed(true); });
    return () => {
      revoked = true;
      setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [src]);

  if (failed) return (
    <div className={`${className ?? ''} flex items-center justify-center bg-gray-800 text-gray-500 text-xs rounded-lg border border-dashed border-gray-700`}>
      Failed to load
    </div>
  );
  if (!blobUrl) return (
    <div className={`${className ?? ''} bg-gray-800 animate-pulse rounded-lg`} />
  );
  return <img src={blobUrl} alt={alt} className={className} onClick={onClick} />;
}

function describeTimelineEvent(event: { type: string; date: string; detail: any }): string {
  const d = event.detail ?? {};
  switch (event.type) {
    case 'booking':
      return `Booking #${d.id} — ${d.status ?? 'unknown'} · ${Number(d.totalAmount ?? 0).toLocaleString()} ${d.currency ?? 'EGP'}`;
    case 'review':
      return `Left a ${d.overallRating ?? '?'}-star review${d.comment ? `: "${d.comment.slice(0, 60)}${d.comment.length > 60 ? '…' : ''}"` : ''}`;
    case 'property':
      return `Property "${d.title ?? `#${d.id}`}" — ${d.status ?? 'unknown'}`;
    case 'admin_action':
      return `Admin action: ${d.action ?? d.eventType ?? JSON.stringify(d).slice(0, 80)}`;
    default:
      return JSON.stringify(d).slice(0, 100);
  }
}

export default function UserDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user-uuid', uuid],
    queryFn: () => adminApi.getUserByUuid(uuid),
    enabled: !!uuid,
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [banReason, setBanReason] = useState('');
  const [showBan, setShowBan] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showNotify, setShowNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [idLightbox, setIdLightbox] = useState<string | null>(null);

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateUser(user!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user-uuid', uuid] }); qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditing(false); toast.success('User updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update user'),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteUser(user!.id, deleteReason.trim() || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted'); router.push('/users'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete user'),
  });

  const banMut = useMutation({
    mutationFn: (reason: string) => adminApi.banUser(user!.id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-uuid', uuid] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
      setShowBan(false);
      toast.success('User banned');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to ban user'),
  });

  const toggleActiveMut = useMutation({
    mutationFn: () => adminApi.toggleUserActive(user!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user-uuid', uuid] }); qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Status toggled'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to toggle status'),
  });

  const toggleAdminMut = useMutation({
    mutationFn: () => adminApi.toggleUserAdmin(user!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user-uuid', uuid] }); qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Admin role toggled'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to toggle admin'),
  });

  const suspendMut = useMutation({
    mutationFn: (reason: string) => adminApi.suspendUser(user!.id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-uuid', uuid] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
      setShowSuspend(false);
      setSuspendReason('');
      toast.success('User suspended — email notification sent');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to suspend user'),
  });

  const notifyMut = useMutation({
    mutationFn: (data: { title: string; message: string }) => adminApi.sendUserNotification(user!.id, data.title, data.message),
    onSuccess: () => { setShowNotify(false); setNotifyForm({ title: '', message: '' }); toast.success('Notification sent'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to send notification'),
  });

  const { data: timeline } = useQuery({
    queryKey: ['admin-user-timeline', uuid],
    queryFn: () => adminApi.getUserTimeline(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>;
  if (!user) return <div className="text-gray-500 dark:text-gray-400 text-center py-20">User not found</div>;

  const startEdit = () => {
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Invalid email format'); return; }
    updateMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/users')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">User #{user.id} · Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Edit</button>}
          {editing && <button onClick={saveEdit} disabled={updateMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"><Save className="h-4 w-4" />Save</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bookings', value: user.stats?.bookingCount ?? 0, icon: CalendarCheck, color: 'text-blue-400' },
          { label: 'Properties', value: user.stats?.propertyCount ?? 0, icon: Building2, color: 'text-emerald-400' },
          { label: 'Reviews', value: user.stats?.reviewCount ?? 0, icon: Star, color: 'text-yellow-400' },
          { label: 'Total Spent', value: `${(user.stats?.totalSpent ?? 0).toLocaleString()} EGP`, icon: DollarSign, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          <div className="flex items-center gap-4 mb-4">
            {user.avatarUrl ? (
              <img
                src={getUploadUrl(user.avatarUrl)}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            )}
            <div>
              {editing ? (
                <div className="flex gap-2">
                  <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-gray-900 dark:text-white text-sm" placeholder="First name" />
                  <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-gray-900 dark:text-white text-sm" placeholder="Last name" />
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {user.isAdmin ? '🛡 Admin' : user.isHost ? '🏠 Host' : '👤 Guest'}
                {user.isSuperhost && ' · ⭐ Superhost'}
                {user.isConsultant && ' · 💼 Consultant'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
              {editing ? (
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-900 dark:text-white mt-1"><Mail className="h-3.5 w-3.5 text-gray-500" />{user.email}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-900 dark:text-white mt-1"><Phone className="h-3.5 w-3.5 text-gray-500" />{user.phone || '—'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Bio</label>
              {editing ? (
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{user.bio || '—'}</p>
              )}
            </div>
          </div>

          {/* Verification Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {user.isEmailVerified && <span className="px-2.5 py-1 text-xs bg-emerald-900/40 text-emerald-400 rounded-full">Email Verified</span>}
            {user.isPhoneVerified && <span className="px-2.5 py-1 text-xs bg-emerald-900/40 text-emerald-400 rounded-full">Phone Verified</span>}
            {user.isIdVerified && <span className="px-2.5 py-1 text-xs bg-emerald-900/40 text-emerald-400 rounded-full">ID Verified</span>}
            {user.isHost && <span className="px-2.5 py-1 text-xs bg-blue-900/40 text-blue-400 rounded-full">Host</span>}
            {user.isSuperhost && <span className="px-2.5 py-1 text-xs bg-yellow-900/40 text-yellow-400 rounded-full">Superhost</span>}
            {user.isConsultant && <span className="px-2.5 py-1 text-xs bg-violet-900/40 text-violet-400 rounded-full">Consultant</span>}
            {user.isAdmin && <span className="px-2.5 py-1 text-xs bg-red-900/40 text-red-400 rounded-full">Admin</span>}
            {!user.isActive && <span className="px-2.5 py-1 text-xs bg-red-900/40 text-red-400 rounded-full">Suspended</span>}
          </div>

          {/* ID Document */}
          {user.idDocumentUrl && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <label className="text-xs text-gray-500 uppercase tracking-wide">ID Document</label>
                {user.idDocumentType && (
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    — {user.idDocumentType === 'national_id' ? 'National ID' : 'Passport'}
                  </span>
                )}
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                  user.idVerificationStatus === 'approved' ? 'bg-emerald-900/40 text-emerald-400' :
                  user.idVerificationStatus === 'rejected' ? 'bg-red-900/40 text-red-400' :
                  'bg-yellow-900/40 text-yellow-400'
                }`}>{user.idVerificationStatus}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIdLightbox(getUploadUrl(user.idDocumentUrl))} className="group relative flex-1 max-w-[160px]">
                  <p className="text-xs text-gray-400 mb-1">{user.idDocumentType === 'national_id' ? 'Front' : 'Photo page'}</p>
                  <AuthImg
                    src={getUploadUrl(user.idDocumentUrl)}
                    alt="ID Front"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 object-cover aspect-[3/2] group-hover:opacity-80 transition-opacity cursor-zoom-in"
                  />
                </button>
                {user.idDocumentBackUrl && (
                  <button onClick={() => setIdLightbox(getUploadUrl(user.idDocumentBackUrl))} className="group relative flex-1 max-w-[160px]">
                    <p className="text-xs text-gray-400 mb-1">Back</p>
                    <AuthImg
                      src={getUploadUrl(user.idDocumentBackUrl)}
                      alt="ID Back"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 object-cover aspect-[3/2] group-hover:opacity-80 transition-opacity cursor-zoom-in"
                    />
                  </button>
                )}
              </div>
              {user.idRejectionReason && (
                <p className="text-xs text-red-400 mt-1">Rejection reason: {user.idRejectionReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h2>
            {user.isActive ? (
              <button onClick={() => setShowSuspend(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-yellow-900/20 hover:bg-yellow-900/40 rounded-lg text-sm transition-colors">
                <ShieldOff className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400">Suspend User</span>
              </button>
            ) : (
              <button onClick={() => toggleActiveMut.mutate()} disabled={toggleActiveMut.isPending} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-gray-900 dark:text-white">Activate User</span>
              </button>
            )}
            <button onClick={() => toggleAdminMut.mutate()} disabled={toggleAdminMut.isPending} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50">
              {user.isAdmin ? <ShieldOff className="h-4 w-4 text-red-400" /> : <Shield className="h-4 w-4 text-indigo-400" />}
              <span className="text-gray-900 dark:text-white">{user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}</span>
            </button>
            <button onClick={() => setShowBan(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm transition-colors">
              <Ban className="h-4 w-4 text-red-400" />
              <span className="text-red-400">Ban User</span>
            </button>
            <button onClick={() => setShowNotify(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-sm transition-colors">
              <Bell className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400">Send Notification</span>
            </button>
            <button onClick={() => { setDeleteReason(''); setShowDelete(true); }} disabled={deleteMut.isPending} className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4 text-red-400" />
              <span className="text-red-400">Delete User</span>
            </button>
          </div>

          {/* Metadata */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Metadata</h2>
            {[
              ['ID', `#${user.id}`],
              ['UUID', user.profileUuid],
              ['Language', user.preferredLanguage?.toUpperCase()],
              ['Date of Birth', user.dateOfBirth || '—'],
              ['Last Login', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'],
              ['Last Booking', user.lastBookingAt ? new Date(user.lastBookingAt).toLocaleString() : '—'],
              ['Created', new Date(user.createdAt).toLocaleString()],
              ['Updated', new Date(user.updatedAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 dark:text-white text-right truncate ml-2 max-w-[180px]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      {(user.bookings?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h2>
            {user.bookings.length > 10 && <button onClick={() => router.push(`/bookings?userId=${user.id}`)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all {user.bookings.length} →</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 px-3">ID</th><th className="text-left py-2 px-3">Property</th><th className="text-left py-2 px-3">Check-in</th><th className="text-left py-2 px-3">Status</th><th className="text-right py-2 px-3">Amount</th>
              </tr></thead>
              <tbody>
                {user.bookings.slice(0, 10).map((b: any) => (
                  <tr key={b.id} onClick={() => router.push(`/bookings/${b.id}`)} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">#{b.id}</td>
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white">{b.property?.title || `Property #${b.propertyId}`}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{b.checkIn}</td>
                    <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'confirmed' ? 'bg-emerald-900/40 text-emerald-400' : b.status === 'cancelled' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{b.status}</span></td>
                    <td className="py-2.5 px-3 text-right text-gray-900 dark:text-white">{Number(b.totalAmount).toLocaleString()} {b.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Properties */}
      {(user.properties?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
            {user.properties.length > 10 && <button onClick={() => router.push(`/properties?userId=${user.id}`)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all {user.properties.length} →</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 px-3">ID</th><th className="text-left py-2 px-3">Title</th><th className="text-left py-2 px-3">City</th><th className="text-left py-2 px-3">Status</th><th className="text-right py-2 px-3">Price/night</th>
              </tr></thead>
              <tbody>
                {user.properties.slice(0, 10).map((p: any) => (
                  <tr key={p.id} onClick={() => router.push(`/properties/${p.id}`)} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">#{p.id}</td>
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white">{p.title}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{p.city}</td>
                    <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'published' ? 'bg-emerald-900/40 text-emerald-400' : p.status === 'draft' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{p.status}</span></td>
                    <td className="py-2.5 px-3 text-right text-gray-900 dark:text-white">{p.pricePerNight ? `${Number(p.pricePerNight).toLocaleString()} ${p.currency}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {Array.isArray(timeline) && timeline.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-400" />Activity Timeline</h2>
          <div className="space-y-3">
            {timeline.slice(0, 20).map((event: any, i: number) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${event.type === 'booking' ? 'bg-blue-500' : event.type === 'review' ? 'bg-yellow-500' : event.type === 'property' ? 'bg-emerald-500' : event.type === 'admin_action' ? 'bg-red-500' : 'bg-gray-500'}`} />
                  {i < Math.min(timeline.length, 20) - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mr-2 ${event.type === 'booking' ? 'bg-blue-900/40 text-blue-400' : event.type === 'review' ? 'bg-yellow-900/40 text-yellow-400' : event.type === 'property' ? 'bg-emerald-900/40 text-emerald-400' : event.type === 'admin_action' ? 'bg-red-900/40 text-red-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                        {event.type === 'admin_action' ? 'admin' : event.type}
                      </span>
                      <span className="text-gray-900 dark:text-white">{event.description || describeTimelineEvent(event)}</span>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 mt-0.5">{event.date ? new Date(event.date).toLocaleString() : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ID Document Lightbox */}
      {idLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIdLightbox(null)}>
          <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIdLightbox(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
            <AuthImg src={idLightbox!} alt="ID Document" className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-2 text-yellow-400 mb-3"><ShieldOff className="h-5 w-5" /><h3 className="text-lg font-semibold">Suspend User</h3></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This will deactivate <strong className="text-gray-900 dark:text-white">{user.firstName} {user.lastName}</strong>'s account. An email will be sent to the user with your message.</p>
            <textarea
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension (e.g. violation of community guidelines)..."
              rows={4}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm mb-3 resize-none"
            />
            <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2 mb-4">
              <Mail className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-300">An email notification with this message will be sent to {user.email}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowSuspend(false); setSuspendReason(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm">Cancel</button>
              <button onClick={() => suspendMut.mutate(suspendReason)} disabled={!suspendReason.trim() || suspendMut.isPending} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm disabled:opacity-50">{suspendMut.isPending ? 'Suspending...' : 'Suspend User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-3"><Ban className="h-5 w-5" /><h3 className="text-lg font-semibold">Permanently Ban User</h3></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This will <strong className="text-red-400">permanently</strong> ban <strong className="text-gray-900 dark:text-white">{user.firstName} {user.lastName}</strong>'s account. An email will be sent to the user with your message.</p>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Reason for ban (e.g. repeated violations, fraud, abuse)..."
              rows={4}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm mb-3 resize-none"
            />
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 mb-4">
              <Mail className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">An email notification with this message will be sent to {user.email}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBan(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm">Cancel</button>
              <button onClick={() => banMut.mutate(banReason)} disabled={!banReason.trim() || banMut.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm disabled:opacity-50">{banMut.isPending ? 'Banning...' : 'Permanently Ban'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-blue-400 mb-4"><Bell className="h-5 w-5" /><h3 className="text-lg font-semibold">Send Notification</h3></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Send a push notification to <strong className="text-gray-900 dark:text-white">{user.firstName} {user.lastName}</strong></p>
            <div className="mb-3">
              <label className="text-xs text-gray-500">Title</label>
              <input value={notifyForm.title} onChange={e => setNotifyForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Notification title" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mt-1" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Message</label>
              <textarea value={notifyForm.message} onChange={e => setNotifyForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Notification message..." rows={3} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNotify(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Cancel</button>
              <button onClick={() => notifyMut.mutate(notifyForm)} disabled={!notifyForm.title.trim() || !notifyForm.message.trim() || notifyMut.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-red-800/50 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Delete User Permanently</h3>
              </div>
              <button onClick={() => setShowDelete(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 mb-4 flex items-start gap-3">
              {user.avatarUrl ? (
                <img src={getUploadUrl(user.avatarUrl)} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This action is <strong className="text-red-400">permanent and irreversible</strong>. All data, bookings, listings, and reviews associated with this account will be deleted.
            </p>
            <div className="mb-3">
              <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Reason for deletion *</label>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Explain why this account is being deleted (e.g. fraudulent activity, user request, …)"
                rows={3}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 mb-4">
              <Mail className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                A farewell email with this reason will be sent to <strong>{user.email}</strong> before deletion.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate()}
                disabled={!deleteReason.trim() || deleteMut.isPending}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 font-medium"
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
