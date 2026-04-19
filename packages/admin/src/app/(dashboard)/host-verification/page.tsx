'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  ShieldCheck,
  ShieldX,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  ImageOff,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HostVerificationPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [hostPage, setHostPage] = useState(1);
  const [showAllVerified, setShowAllVerified] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-pending-id', hostPage],
    queryFn: () => adminApi.getUsers({ page: hostPage, limit: 50, role: 'host' }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.reviewIdDocument(id, true),
    onSuccess: (_, id) => {
      toast.success('ID verified and approved');
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users-pending-id'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminApi.reviewIdDocument(id, false, reason),
    onSuccess: () => {
      toast.success('ID rejected');
      setSelectedUserId(null);
      setShowRejectModal(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-users-pending-id'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badge-counts'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to reject'),
  });

  const rawData = data as any;
  const users: any[] = rawData?.items ?? rawData?.data ?? (Array.isArray(rawData) ? rawData : []);
  const totalPages: number = rawData?.totalPages ?? 1;
  const pendingUsers = users.filter((u: any) => u.idVerificationStatus === 'pending');
  const verifiedUsers = users.filter((u: any) => u.isIdVerified);
  const selectedUser = users.find((u: any) => u.id === selectedUserId);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded-lg w-48" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Verification</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and approve host ID verification documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <Clock className="h-5 w-5 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingUsers.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending Review</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{verifiedUsers.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Verified Hosts</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <User className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Hosts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending list */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pending Verification</h2>
            {pendingUsers.length > 0 && (
              <span className="rounded-full bg-amber-900/50 border border-amber-800/50 px-2 py-0.5 text-xs font-medium text-amber-400">
                {pendingUsers.length} pending
              </span>
            )}
          </div>

          {pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-700" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">All caught up!</p>
              <p className="text-gray-600 text-xs">No pending ID verification requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {pendingUsers.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)}
                  className={cn(
                    'w-full flex items-center gap-3 py-3 text-left transition-colors rounded-lg px-2 -mx-2',
                    selectedUserId === u.id ? 'bg-indigo-900/20' : 'hover:bg-gray-800/40',
                  )}
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-sm font-bold text-white">
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="rounded-full bg-amber-900/40 border border-amber-800/40 px-2 py-0.5 text-xs text-amber-400">
                      Pending
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail / review panel */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          {!selectedUser ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <ShieldCheck className="h-10 w-10 text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Select a host to review</p>
              <p className="text-gray-600 text-xs">Click on a pending host from the list to view their submitted ID document.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-base font-bold text-white">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* ID Document image */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Submitted ID Document</p>
                {selectedUser.idDocument ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={getUploadUrl(selectedUser.idDocument)}
                      alt="ID Document"
                      className="w-full object-contain max-h-52"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextSibling && ((e.target as HTMLImageElement).nextSibling as HTMLElement)?.classList?.remove('hidden'); }}
                    />
                    <div className="hidden flex-col items-center gap-2 py-8 text-center">
                      <ImageOff className="h-7 w-7 text-gray-600" />
                      <p className="text-gray-500 text-xs">Could not load image</p>
                    </div>
                    <a
                      href={getUploadUrl(selectedUser.idDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <ImageOff className="h-7 w-7 text-gray-600" />
                    <p className="text-gray-500 text-xs">No document uploaded</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => approveMutation.mutate(selectedUser.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {approveMutation.isPending ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => { setShowRejectModal(true); }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-red-800 hover:bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  <ShieldX className="h-4 w-4" />
                  {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verified hosts list */}
      {verifiedUsers.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Verified Hosts
            <span className="ml-2 text-sm font-normal text-emerald-400">({verifiedUsers.length})</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(showAllVerified ? verifiedUsers : verifiedUsers.slice(0, 12)).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-700/50 px-3 py-2.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-xs font-bold text-white">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
          {verifiedUsers.length > 12 && (
            <button
              onClick={() => setShowAllVerified((v) => !v)}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors text-center w-full"
            >
              {showAllVerified ? 'Show less' : `Show all ${verifiedUsers.length} verified hosts`}
            </button>
          )}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reject ID Verification</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Rejecting <span className="text-gray-900 dark:text-white font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>'s ID document.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional — shown to host)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-700 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: selectedUser.id, reason: rejectReason || undefined })}
                disabled={rejectMutation.isPending}
                className="flex-1 rounded-lg bg-red-800 hover:bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <button disabled={hostPage === 1} onClick={() => setHostPage((p) => p - 1)} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">Previous</button>
          <span className="text-gray-900 dark:text-white">{hostPage} / {totalPages}</span>
          <button disabled={hostPage === totalPages} onClick={() => setHostPage((p) => p + 1)} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
