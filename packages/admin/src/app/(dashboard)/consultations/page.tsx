'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, CheckCircle, XCircle, Clock, Eye,
  TrendingUp, Users, DollarSign,
  ChevronDown, Search, Filter,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

export default function AdminConsultationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ── Stats ──
  const { data: stats } = useQuery({
    queryKey: ['admin-consultation-stats'],
    queryFn: () => apiClient.get('/admin/consultations/stats').then((r) => r.data),
  });

  // ── Consultants List ──
  const { data: consultantsData, isLoading } = useQuery({
    queryKey: ['admin-consultants', statusFilter, page],
    queryFn: () =>
      apiClient
        .get('/admin/consultations/consultants', {
          params: { status: statusFilter || undefined, page, limit: 20 },
        })
        .then((r) => r.data),
  });

  // ── Approve/Reject mutation ──
  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, reason }: { id: number; decision: string; reason?: string }) =>
      apiClient.patch(`/admin/consultations/consultants/${id}/review`, {
        decision,
        rejectionReason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultation-stats'] });
      setSelectedConsultant(null);
      setRejectionReason('');
    },
  });

  const consultants = consultantsData?.data ?? [];
  const totalPages = consultantsData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultation Marketplace</h1>
        <p className="text-sm text-gray-500">
          Manage consultant applications and marketplace metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Total Consultants"
          value={stats?.consultants?.total ?? 0}
          color="rose"
        />
        <StatCard
          icon={Clock}
          label="Pending Applications"
          value={stats?.consultants?.pending ?? 0}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Completed Sessions"
          value={stats?.bookings?.completed ?? 0}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Platform Revenue (EGP)"
          value={stats?.platformRevenue?.toLocaleString() ?? '0'}
          color="blue"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        {['', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition',
              statusFilter === s
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Consultant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Specializations</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Rate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-6 animate-pulse rounded bg-gray-100" />
                        </td>
                      </tr>
                    ))
                  : consultants.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-sm font-medium text-rose-600">
                              {c.user?.firstName?.[0] ?? '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{c.displayName}</div>
                              <div className="text-xs text-gray-400">{c.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(c.specializations ?? []).slice(0, 2).map((s: string) => (
                              <span key={s} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                                {s.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {(c.specializations ?? []).length > 2 && (
                              <span className="text-xs text-gray-400">+{c.specializations.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {c.currency} {Number(c.hourlyRate).toLocaleString()}/hr
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            {Number(c.avgRating).toFixed(1)} ({c.reviewCount})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES[c.status])}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedConsultant(c)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {c.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => reviewMutation.mutate({ id: c.id, decision: 'approved' })}
                                  className="rounded-lg p-1.5 text-green-500 transition hover:bg-green-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setSelectedConsultant({ ...c, _rejectMode: true })}
                                  className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                                  title="Reject"
                                >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'h-9 w-9 rounded-lg text-sm font-medium transition',
                page === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Consultant Detail Modal */}
      {selectedConsultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {selectedConsultant._rejectMode ? 'Reject Consultant' : 'Consultant Details'}
            </h2>

            {selectedConsultant._rejectMode ? (
              <>
                <p className="mb-3 text-sm text-gray-500">
                  Provide a reason for rejecting <strong>{selectedConsultant.displayName}</strong>:
                </p>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Reason for rejection..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setSelectedConsultant(null); setRejectionReason(''); }}
                    className="flex-1 rounded-lg border py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      reviewMutation.mutate({
                        id: selectedConsultant.id,
                        decision: 'rejected',
                        reason: rejectionReason,
                      })
                    }
                    className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3 text-sm">
                  <Row label="Name" value={selectedConsultant.displayName} />
                  <Row label="Email" value={selectedConsultant.user?.email} />
                  <Row label="Experience" value={`${selectedConsultant.yearsExperience} years`} />
                  <Row label="Rate" value={`${selectedConsultant.currency} ${selectedConsultant.hourlyRate}/hr`} />
                  <Row label="Languages" value={(selectedConsultant.languages ?? []).join(', ')} />
                  <Row label="Status" value={selectedConsultant.status} />
                  <Row label="Total Sessions" value={selectedConsultant.totalSessions} />
                  <Row label="Bio" value={selectedConsultant.bio || '—'} />
                  <div>
                    <span className="font-medium text-gray-500">Specializations:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(selectedConsultant.specializations ?? []).map((s: string) => (
                        <span key={s} className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-600">
                          {s.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(selectedConsultant.documents ?? []).length > 0 && (
                    <div>
                      <span className="font-medium text-gray-500">
                        Documents ({selectedConsultant.documents.length}):
                      </span>
                      <div className="mt-2 space-y-2">
                        {selectedConsultant.documents.map((d: any) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileUrl ?? '');
                          const statusColors: Record<string, string> = {
                            pending:  'bg-amber-50 text-amber-700 border-amber-200',
                            verified: 'bg-green-50 text-green-700 border-green-200',
                            approved: 'bg-green-50 text-green-700 border-green-200',
                            rejected: 'bg-red-50 text-red-700 border-red-200',
                          };
                          const statusColor = statusColors[d.status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
                          return (
                            <div
                              key={d.id}
                              className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
                            >
                              {/* Image preview */}
                              {isImage && (
                                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={d.fileUrl}
                                    alt={d.originalName ?? d.documentType}
                                    className="h-32 w-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </a>
                              )}
                              <div className="flex items-center justify-between gap-2 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-gray-700">
                                    {d.originalName ?? d.documentType}
                                  </p>
                                  <p className="text-xs text-gray-400 capitalize">
                                    {(d.documentType ?? '').replace(/_/g, ' ')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', statusColor)}>
                                    {d.status}
                                  </span>
                                  <a
                                    href={d.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 transition"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedConsultant(null)}
                    className="flex-1 rounded-lg border py-2 text-sm font-medium"
                  >
                    Close
                  </button>
                  {selectedConsultant.status === 'pending' && (
                    <>
                      <button
                        onClick={() => reviewMutation.mutate({ id: selectedConsultant.id, decision: 'approved' })}
                        className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedConsultant({ ...selectedConsultant, _rejectMode: true })}
                        className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
