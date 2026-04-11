'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Shield, ShieldOff, Ban, Trash2, Save, Building2, CalendarCheck, Star, DollarSign, Bell, Clock } from 'lucide-react';
import { adminApi, getUploadUrl } from '@/lib/api';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const userId = parseInt(id);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getUserDetail(userId),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [banReason, setBanReason] = useState('');
  const [showBan, setShowBan] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateUser(userId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); setEditing(false); },
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteUser(userId),
    onSuccess: () => router.push('/users'),
  });

  const banMut = useMutation({
    mutationFn: (reason: string) => adminApi.banUser(userId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); setShowBan(false); },
  });

  const toggleActiveMut = useMutation({
    mutationFn: () => adminApi.toggleUserActive(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', userId] }),
  });

  const toggleAdminMut = useMutation({
    mutationFn: () => adminApi.toggleUserAdmin(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', userId] }),
  });

  const notifyMut = useMutation({
    mutationFn: (data: { title: string; message: string }) => adminApi.sendUserNotification(userId, data.title, data.message),
    onSuccess: () => { setShowNotify(false); setNotifyForm({ title: '', message: '' }); },
  });

  const { data: timeline } = useQuery({
    queryKey: ['admin-user-timeline', userId],
    queryFn: () => adminApi.getUserTimeline(userId),
    enabled: !!userId,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>;
  if (!user) return <div className="text-gray-400 text-center py-20">User not found</div>;

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

  const saveEdit = () => updateMut.mutate(form);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/users')} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-gray-400">User #{user.id} · Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Edit</button>}
          {editing && <button onClick={saveEdit} disabled={updateMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"><Save className="h-4 w-4" />Save</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>}
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
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Profile Information</h2>
          <div className="flex items-center gap-4 mb-4">
            {user.avatarUrl ? (
              <img src={getUploadUrl(user.avatarUrl)} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xl font-bold text-white">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            )}
            <div>
              {editing ? (
                <div className="flex gap-2">
                  <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm" placeholder="First name" />
                  <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm" placeholder="Last name" />
                </div>
              ) : (
                <p className="text-lg font-semibold text-white">{user.firstName} {user.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
              {editing ? (
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
              ) : (
                <p className="flex items-center gap-2 text-sm text-white mt-1"><Mail className="h-3.5 w-3.5 text-gray-500" />{user.email}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
              ) : (
                <p className="flex items-center gap-2 text-sm text-white mt-1"><Phone className="h-3.5 w-3.5 text-gray-500" />{user.phone || '—'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Bio</label>
              {editing ? (
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
              ) : (
                <p className="text-sm text-gray-300 mt-1">{user.bio || '—'}</p>
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
            <div className="pt-2">
              <label className="text-xs text-gray-500 uppercase tracking-wide">ID Document</label>
              <div className="mt-1">
                <img src={getUploadUrl(user.idDocumentUrl)} alt="ID" className="max-w-xs rounded-lg border border-gray-700" />
                <p className="text-xs text-gray-500 mt-1">Status: <span className={user.idVerificationStatus === 'approved' ? 'text-emerald-400' : user.idVerificationStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>{user.idVerificationStatus}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-2">Quick Actions</h2>
            <button onClick={() => toggleActiveMut.mutate()} disabled={toggleActiveMut.isPending} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50">
              {user.isActive ? <ShieldOff className="h-4 w-4 text-yellow-400" /> : <Shield className="h-4 w-4 text-emerald-400" />}
              <span className="text-white">{user.isActive ? 'Suspend User' : 'Activate User'}</span>
            </button>
            <button onClick={() => toggleAdminMut.mutate()} disabled={toggleAdminMut.isPending} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50">
              <Shield className="h-4 w-4 text-indigo-400" />
              <span className="text-white">{user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}</span>
            </button>
            <button onClick={() => setShowBan(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm transition-colors">
              <Ban className="h-4 w-4 text-red-400" />
              <span className="text-red-400">Ban User</span>
            </button>
            <button onClick={() => setShowNotify(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-sm transition-colors">
              <Bell className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400">Send Notification</span>
            </button>
            <button onClick={() => { if (confirm('Delete this user permanently?')) deleteMut.mutate(); }} disabled={deleteMut.isPending} className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4 text-red-400" />
              <span className="text-red-400">Delete User</span>
            </button>
          </div>

          {/* Metadata */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-lg font-semibold text-white mb-2">Metadata</h2>
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
                <span className="text-white text-right truncate ml-2 max-w-[180px]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      {user.bookings?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 px-3">ID</th><th className="text-left py-2 px-3">Property</th><th className="text-left py-2 px-3">Check-in</th><th className="text-left py-2 px-3">Status</th><th className="text-right py-2 px-3">Amount</th>
              </tr></thead>
              <tbody>
                {user.bookings.slice(0, 10).map((b: any) => (
                  <tr key={b.id} onClick={() => router.push(`/bookings/${b.id}`)} className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="py-2.5 px-3 text-gray-400">#{b.id}</td>
                    <td className="py-2.5 px-3 text-white">{b.property?.title || `Property #${b.propertyId}`}</td>
                    <td className="py-2.5 px-3 text-gray-300">{b.checkIn}</td>
                    <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'confirmed' ? 'bg-emerald-900/40 text-emerald-400' : b.status === 'cancelled' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{b.status}</span></td>
                    <td className="py-2.5 px-3 text-right text-white">{Number(b.totalAmount).toLocaleString()} {b.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Properties */}
      {user.properties?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Properties</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 px-3">ID</th><th className="text-left py-2 px-3">Title</th><th className="text-left py-2 px-3">City</th><th className="text-left py-2 px-3">Status</th><th className="text-right py-2 px-3">Price/night</th>
              </tr></thead>
              <tbody>
                {user.properties.slice(0, 10).map((p: any) => (
                  <tr key={p.id} onClick={() => router.push(`/properties/${p.id}`)} className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <td className="py-2.5 px-3 text-gray-400">#{p.id}</td>
                    <td className="py-2.5 px-3 text-white">{p.title}</td>
                    <td className="py-2.5 px-3 text-gray-300">{p.city}</td>
                    <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'published' ? 'bg-emerald-900/40 text-emerald-400' : p.status === 'draft' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{p.status}</span></td>
                    <td className="py-2.5 px-3 text-right text-white">{p.pricePerNight ? `${Number(p.pricePerNight).toLocaleString()} ${p.currency}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {Array.isArray(timeline) && timeline.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-400" />Activity Timeline</h2>
          <div className="space-y-3">
            {timeline.slice(0, 20).map((event: any, i: number) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${event.type === 'booking' ? 'bg-blue-500' : event.type === 'review' ? 'bg-yellow-500' : event.type === 'property' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                  {i < Math.min(timeline.length, 20) - 1 && <div className="w-px flex-1 bg-gray-700 mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-white">{event.description}</p>
                  <p className="text-xs text-gray-500">{event.date ? new Date(event.date).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-3">Ban User</h3>
            <p className="text-sm text-gray-400 mb-4">This will deactivate the user and send a notification with the reason.</p>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Ban reason..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBan(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">Cancel</button>
              <button onClick={() => banMut.mutate(banReason)} disabled={!banReason.trim() || banMut.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm disabled:opacity-50">Ban User</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-blue-400 mb-4"><Bell className="h-5 w-5" /><h3 className="text-lg font-semibold">Send Notification</h3></div>
            <p className="text-sm text-gray-400 mb-3">Send a push notification to <strong className="text-white">{user.firstName} {user.lastName}</strong></p>
            <div className="mb-3">
              <label className="text-xs text-gray-500">Title</label>
              <input value={notifyForm.title} onChange={e => setNotifyForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Notification title" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mt-1" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Message</label>
              <textarea value={notifyForm.message} onChange={e => setNotifyForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Notification message..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNotify(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Cancel</button>
              <button onClick={() => notifyMut.mutate(notifyForm)} disabled={!notifyForm.title.trim() || !notifyForm.message.trim() || notifyMut.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
