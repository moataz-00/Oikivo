'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  Search, ShieldCheck, ShieldOff, UserCheck, UserX,
  ChevronLeft, ChevronRight, BadgeCheck, BadgeX, FileText,
  CheckSquare, Square, Users, UserPlus, Eye, Ban,
  ChevronUp, ChevronDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const ROLE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'guest', label: 'Guest' },
  { value: 'host', label: 'Host' },
  { value: 'admin', label: 'Admin' },
];

const ID_COLORS: Record<string, string> = {
  none: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  pending: 'bg-amber-900/50 text-amber-400',
  approved: 'bg-emerald-900/50 text-emerald-400',
  rejected: 'bg-red-900/50 text-red-400',
};

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', color)}>
      {children}
    </span>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showCreate, setShowCreate] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [pendingBulkAction, setPendingBulkAction] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', isHost: false, isAdmin: false });

  // Reject ID modal state
  const [rejectModal, setRejectModal] = useState<{ userId: number; userName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Ban modal state
  const [banModal, setBanModal] = useState<{ userId: number; userName: string } | null>(null);
  const [banReason, setBanReason] = useState('');

  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, search, role, sortOrder],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined, role: role || undefined, sortBy: 'createdAt', sortOrder }),
    placeholderData: (prev: any) => prev,
  });

  const toggleActive = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const toggleAdmin = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const reviewId = useMutation({
    mutationFn: ({ id, approved, rejectionReason }: { id: number; approved: boolean; rejectionReason?: string }) =>
      adminApi.reviewIdDocument(id, approved, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to review ID'),
  });
  const banMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.banUser(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-badge-counts'] });
      setBanModal(null);
      setBanReason('');
      toast.success('User banned');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to ban user'),
  });
  const bulkAction = useMutation({
    mutationFn: (action: 'activate' | 'deactivate' | 'grant_admin' | 'revoke_admin') =>
      adminApi.bulkUserAction(selected, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setSelected([]);
    },
  });
  const createUserMut = useMutation({
    mutationFn: (data: typeof createForm) => adminApi.createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowCreate(false); setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', isHost: false, isAdmin: false }); },
  });

  const d = data as any;
  const items: any[] = d?.items ?? [];
  const allIds = items.map((u: any) => u.id);
  const allSelected = allIds.length > 0 && allIds.every((id: number) => selected.includes(id));
  const someSelected = selected.length > 0;

  function toggleOne(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelected(allSelected ? [] : allIds);
  }
  function openRejectModal(userId: number, userName: string) {
    setRejectReason('');
    setRejectModal({ userId, userName });
  }
  function openBanModal(userId: number, userName: string) {
    setBanReason('');
    setBanModal({ userId, userName });
  }

  if (isError) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load users</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">The backend may be unavailable. Try refreshing the page.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all platform users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
          <UserPlus className="h-4 w-4" />Create User
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); setSelected([]); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone…"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setRole(f.value); setPage(1); setSelected([]); }}
              className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                role === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-700 bg-indigo-900/30 px-4 py-3">
          <span className="text-sm text-indigo-300 font-medium">{selected.length} selected</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bulkAction.mutate('activate')} disabled={bulkAction.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">Activate</button>
            {pendingBulkAction === 'deactivate' ? (
              <><button onClick={() => { bulkAction.mutate('deactivate'); setPendingBulkAction(null); }} disabled={bulkAction.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-600 text-white animate-pulse">Confirm Suspend</button><button onClick={() => setPendingBulkAction(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-white">Cancel</button></>
            ) : (
              <button onClick={() => setPendingBulkAction('deactivate')} disabled={bulkAction.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-800 text-white hover:bg-red-700 transition-colors disabled:opacity-50">Suspend</button>
            )}
            <button onClick={() => bulkAction.mutate('grant_admin')} disabled={bulkAction.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Grant Admin</button>
            {pendingBulkAction === 'revoke_admin' ? (
              <><button onClick={() => { bulkAction.mutate('revoke_admin'); setPendingBulkAction(null); }} disabled={bulkAction.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-600 text-white animate-pulse">Confirm Revoke</button><button onClick={() => setPendingBulkAction(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-white">Cancel</button></>
            ) : (
              <button onClick={() => setPendingBulkAction('revoke_admin')} disabled={bulkAction.isPending} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Revoke Admin</button>
            )}
          </div>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Clear</button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleAll} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                {['User', 'Phone', 'Role', 'Status', 'ID Verification'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
                {/* Sortable Joined column */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => { setSortOrder((s) => s === 'DESC' ? 'ASC' : 'DESC'); setPage(1); setSelected([]); }}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors group"
                    title={`Sort by date joined — currently ${sortOrder === 'DESC' ? 'newest first' : 'oldest first'}`}
                  >
                    Joined
                    {sortOrder === 'DESC'
                      ? <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />
                      : <ChevronUp className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(8)].map((__, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>))}</tr>
                  ))
                : items.length === 0
                ? (
                  <tr><td colSpan={8} className="py-16 text-center"><div className="flex flex-col items-center gap-3"><Users className="h-10 w-10 text-gray-600" /><p className="text-gray-500">No users found</p></div></td></tr>
                )
                : items.map((user: any) => (
                  <tr key={user.id} className={cn('transition-colors', selected.includes(user.id) ? 'bg-indigo-900/20' : 'hover:bg-gray-800/50')}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleOne(user.id)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        {selected.includes(user.id) ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase shrink-0">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.isAdmin && <Badge color="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">Admin</Badge>}
                        {user.isHost && <Badge color="bg-emerald-900/50 text-emerald-400">Host</Badge>}
                        {!user.isAdmin && !user.isHost && <Badge color="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Guest</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={user.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge color={ID_COLORS[user.idVerificationStatus ?? 'none'] ?? ID_COLORS.none}>
                          {user.idVerificationStatus ?? 'none'}
                        </Badge>
                        {user.idDocumentUrl && (
                          <a href={getUploadUrl(user.idDocumentUrl)} target="_blank" rel="noopener noreferrer" title="View ID document" className="text-gray-500 dark:text-gray-400 hover:text-indigo-400 transition-colors">
                            <FileText className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {user.idVerificationStatus === 'pending' && (
                          <>
                            <button
                              title="Approve ID"
                              onClick={() => reviewId.mutate({ id: user.id, approved: true })}
                              disabled={reviewId.isPending && (reviewId.variables as any)?.id === user.id}
                              className="text-emerald-400 hover:bg-emerald-900/30 rounded p-0.5 transition-colors"
                            >
                              <BadgeCheck className="h-4 w-4" />
                            </button>
                            <button
                              title="Reject ID (with reason)"
                              onClick={() => openRejectModal(user.id, `${user.firstName} ${user.lastName}`)}
                              disabled={reviewId.isPending && (reviewId.variables as any)?.id === user.id}
                              className="text-red-400 hover:bg-red-900/30 rounded p-0.5 transition-colors"
                            >
                              <BadgeX className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View detail page */}
                        <button
                          title="View user details"
                          aria-label={`View details for ${user.firstName} ${user.lastName}`}
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-900/30 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Suspend / Activate */}
                        <button
                          title={user.isActive ? 'Suspend' : 'Activate'}
                          onClick={() => toggleActive.mutate(user.id)}
                          disabled={toggleActive.isPending}
                          className={cn('rounded-lg p-1.5 transition-colors', user.isActive ? 'text-red-400 hover:bg-red-900/30' : 'text-green-400 hover:bg-green-900/30')}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        {/* Ban with reason */}
                        {!user.isAdmin && (
                          <button
                            title="Ban user"
                            onClick={() => openBanModal(user.id, `${user.firstName} ${user.lastName}`)}
                            className="rounded-lg p-1.5 text-orange-400 hover:bg-orange-900/30 transition-colors"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {/* Toggle admin */}
                        <button
                          title={user.isAdmin ? 'Revoke admin' : 'Grant admin'}
                          onClick={() => toggleAdmin.mutate(user.id)}
                          disabled={toggleAdmin.isPending}
                          className={cn('rounded-lg p-1.5 transition-colors', user.isAdmin ? 'text-yellow-400 hover:bg-yellow-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
                        >
                          {user.isAdmin ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {(d?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{d?.total} total users</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => { setPage((p) => p - 1); setSelected([]); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-gray-900 dark:text-white">{page} / {d?.totalPages}</span>
              <button disabled={page === d?.totalPages} onClick={() => { setPage((p) => p + 1); setSelected([]); }} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reject ID Modal ─────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-400">
                <BadgeX className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject ID Document</h3>
              </div>
              <button onClick={() => setRejectModal(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Rejecting ID for <span className="font-medium text-gray-900 dark:text-white">{rejectModal.userName}</span>. Provide a reason so the user knows what to resubmit.
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Document is blurry, please resubmit a clearer photo…"
                rows={3}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  reviewId.mutate({ id: rejectModal.userId, approved: false, rejectionReason: rejectReason || undefined });
                  setRejectModal(null);
                  setRejectReason('');
                }}
                disabled={!rejectReason.trim() || reviewId.isPending}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                Reject ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ban User Modal ───────────────────────────────────────────────────── */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ban User</h3>
              </div>
              <button onClick={() => setBanModal(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You are about to ban <span className="font-medium text-gray-900 dark:text-white">{banModal.userName}</span>. Their account will be suspended and they will be notified with the reason below.
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ban Reason *</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Violation of platform terms — fraudulent listing…"
                rows={3}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setBanModal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={() => banMut.mutate({ id: banModal.userId, reason: banReason })}
                disabled={!banReason.trim() || banMut.isPending}
                className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                {banMut.isPending ? 'Banning…' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create User Modal ────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-400 mb-4"><UserPlus className="h-5 w-5" /><h3 className="text-lg font-semibold">Create User</h3></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">First Name *</label>
                  <input value={createForm.firstName} onChange={e => { setCreateForm(f => ({ ...f, firstName: e.target.value })); setCreateErrors(prev => ({ ...prev, firstName: '' })); }} className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1 ${createErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                  {createErrors.firstName && <p className="text-xs text-red-400 mt-0.5">{createErrors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500">Last Name *</label>
                  <input value={createForm.lastName} onChange={e => { setCreateForm(f => ({ ...f, lastName: e.target.value })); setCreateErrors(prev => ({ ...prev, lastName: '' })); }} className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1 ${createErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                  {createErrors.lastName && <p className="text-xs text-red-400 mt-0.5">{createErrors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email *</label>
                <input type="email" value={createForm.email} onChange={e => { setCreateForm(f => ({ ...f, email: e.target.value })); setCreateErrors(prev => ({ ...prev, email: '' })); }} className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1 ${createErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                {createErrors.email && <p className="text-xs text-red-400 mt-0.5">{createErrors.email}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500">Password * <span className="text-gray-600">(min 8 characters)</span></label>
                <input type="password" value={createForm.password} onChange={e => { setCreateForm(f => ({ ...f, password: e.target.value })); setCreateErrors(prev => ({ ...prev, password: '' })); }} className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1 ${createErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                {createErrors.password && <p className="text-xs text-red-400 mt-0.5">{createErrors.password}</p>}
              </div>
              <div><label className="text-xs text-gray-500">Phone</label><input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1" /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={createForm.isHost} onChange={e => setCreateForm(f => ({ ...f, isHost: e.target.checked }))} className="rounded" />Host</label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={createForm.isAdmin} onChange={e => setCreateForm(f => ({ ...f, isAdmin: e.target.checked }))} className="rounded" />Admin</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowCreate(false); setCreateErrors({}); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Cancel</button>
              <button onClick={() => {
                const errors: Record<string, string> = {};
                if (!createForm.firstName.trim()) errors.firstName = 'First name is required';
                if (!createForm.lastName.trim()) errors.lastName = 'Last name is required';
                if (!createForm.email.trim()) errors.email = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errors.email = 'Invalid email format';
                if (!createForm.password) errors.password = 'Password is required';
                else if (createForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
                if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }
                createUserMut.mutate(createForm);
              }} disabled={createUserMut.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

