'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CreditCard, Users, Home, XCircle, RotateCcw, Save, AlertTriangle, Image, Clock, DollarSign, PiggyBank, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { adminApi, getUploadUrl } from '@/lib/api';
import toast from 'react-hot-toast';

function BookingProfitCard({ bookingId }: { bookingId: number }) {
  const { data: profit } = useQuery({
    queryKey: ['admin-booking-profit', bookingId],
    queryFn: () => adminApi.getBookingProfit(bookingId),
  });
  const p = profit as any;
  if (!p) return null;
  const egp = (n: number) => `EGP ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const isRefunded = p.refundAmount > 0;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><PiggyBank className="h-5 w-5 text-emerald-400" />Profit Breakdown</h2>
      <div className="text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Service Fee</span><span className="text-emerald-400">{egp(p.serviceFee)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Gateway Fee</span><span className="text-amber-400">−{egp(p.gatewayFee)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Payout Fee</span><span className="text-amber-400">−{egp(p.payoutFee)}</span></div>
        {isRefunded && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Refund</span><span className="text-red-400">{egp(p.refundAmount)}</span></div>}
        <div className="border-t border-gray-300 dark:border-gray-700 pt-1.5 flex justify-between font-medium">
          <span className="text-gray-600 dark:text-gray-300">Net Profit</span>
          <span className={p.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{egp(p.netProfit)}</span>
        </div>
      </div>
      <p className="text-xs text-gray-600">Payment: {p.paymentMethod || '—'} • Payout: {p.payoutMethod || '—'}</p>
    </div>
  );
}

function DepositClaimPanel({ booking, bookingId }: { booking: any; bookingId: number }) {
  const qc = useQueryClient();
  const [approveModal, setApproveModal] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMut = useMutation({
    mutationFn: (adminNote?: string) => adminApi.approveDepositClaim(bookingId, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['admin-deposit-claims'] });
      setApproveModal(false);
      setApproveNote('');
      toast.success('Deposit claim approved — host keeps the deposit');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Approve failed'),
  });

  const rejectMut = useMutation({
    mutationFn: (reason?: string) => adminApi.rejectDepositClaim(bookingId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['admin-deposit-claims'] });
      setRejectModal(false);
      setRejectReason('');
      toast.success('Deposit claim rejected — host must return deposit to guest');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Reject failed'),
  });

  const statusLabel: Record<string, { label: string; cls: string }> = {
    none:     { label: 'No deposit', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
    held:     { label: 'Held (awaiting checkout)', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    claimed:  { label: 'Claim submitted — awaiting review', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    released: { label: 'Released to guest', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    approved: { label: 'Claim approved — host keeps deposit', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    rejected: { label: 'Claim rejected — host must return deposit', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  };

  const s = statusLabel[booking.depositStatus ?? 'none'] ?? statusLabel.none;
  const fmt = (n: number) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const currency = booking.displayCurrency ?? booking.currency ?? 'EGP';
  const evidence: string[] = Array.isArray(booking.depositClaimEvidence) ? booking.depositClaimEvidence : [];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-amber-400" /> Security Deposit
      </h2>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs text-gray-500 uppercase">Amount</label>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{fmt(booking.depositAmount)} {currency}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase">Status</label>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${s.cls}`}>{s.label}</span>
        </div>
        {booking.depositClaimDeadline && (
          <div>
            <label className="text-xs text-gray-500 uppercase">Claim Deadline</label>
            <p className="text-sm text-gray-900 dark:text-white mt-0.5">{new Date(booking.depositClaimDeadline).toLocaleString()}</p>
          </div>
        )}
      </div>

      {booking.depositStatus === 'claimed' && (
        <>
          {booking.depositClaimReason && (
            <div>
              <label className="text-xs text-gray-500 uppercase">Host's Claim Reason</label>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                {booking.depositClaimReason}
              </p>
            </div>
          )}

          {evidence.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 uppercase">Evidence Photos</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {evidence.map((path: string, i: number) => (
                  <a key={i} href={getUploadUrl(path)} target="_blank" rel="noopener noreferrer">
                    <img src={getUploadUrl(path)} alt={`Evidence ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setApproveModal(true)}
              disabled={approveMut.isPending || rejectMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              ✓ Approve claim
            </button>
            <button
              onClick={() => setRejectModal(true)}
              disabled={approveMut.isPending || rejectMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              ✗ Reject claim
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Approving means the host keeps the cash deposit they collected. Rejecting means they must return it to the guest.
          </p>

          {/* Approve modal */}
          {approveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve Deposit Claim</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The host will be allowed to keep the cash deposit. Both host and guest will be notified by email.
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Admin Note (optional)</label>
                  <textarea
                    rows={3}
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    placeholder="e.g. Evidence of damage confirmed — towels and mirror broken."
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setApproveModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                  <button
                    onClick={() => approveMut.mutate(approveNote || undefined)}
                    disabled={approveMut.isPending}
                    className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
                  >
                    {approveMut.isPending ? 'Approving…' : 'Confirm Approval'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {rejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Deposit Claim</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The host will be required to return the deposit to the guest. Both parties will be notified.
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Reason for rejection <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Insufficient evidence — photos do not show damage caused by guest."
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setRejectModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                  <button
                    onClick={() => rejectMut.mutate(rejectReason || undefined)}
                    disabled={rejectMut.isPending || !rejectReason.trim()}
                    className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
                  >
                    {rejectMut.isPending ? 'Rejecting…' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const bookingId = parseInt(id, 10);
  const invalidId = isNaN(bookingId);

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['admin-booking', bookingId],
    queryFn: () => adminApi.getBookingDetail(bookingId),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundModal, setRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ baseAmount: '', cleaningFee: '', serviceFee: '', totalAmount: '', reason: '' });

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateBooking(bookingId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); setEditing(false); toast.success('Booking updated'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Update failed'),
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) => adminApi.adminCancelBooking(bookingId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); setCancelModal(false); setCancelReason(''); toast.success('Booking cancelled'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Cancel failed'),
  });

  const refundMut = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) => adminApi.adminRefund(bookingId, amount, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); setRefundModal(false); setRefundAmount(''); setRefundReason(''); toast.success('Refund issued'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Refund failed'),
  });

  const adjustMut = useMutation({
    mutationFn: (data: { baseAmount?: number; cleaningFee?: number; serviceFee?: number; totalAmount?: number; reason: string }) => adminApi.adjustBookingAmounts(bookingId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); setAdjustModal(false); setAdjustForm({ baseAmount: '', cleaningFee: '', serviceFee: '', totalAmount: '', reason: '' }); toast.success('Amounts adjusted'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Adjust failed'),
  });

  const markProofViewedMut = useMutation({
    mutationFn: () => adminApi.markProofViewed(bookingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }),
  });

  const confirmPaymentMut = useMutation({
    mutationFn: () => adminApi.confirmPayment(bookingId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); toast.success('Payment confirmed'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Confirm failed'),
  });

  if (invalidId) return <div className="text-gray-500 dark:text-gray-400 text-center py-20">Invalid booking ID</div>;
  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>;
  if (isError) return <div className="flex flex-col items-center gap-3 py-20 text-center"><span className="text-4xl">⚠️</span><p className="text-lg font-semibold text-gray-900 dark:text-white">{(error as any)?.response?.status === 404 ? 'Booking not found' : 'Failed to load booking'}</p><p className="text-sm text-gray-500 dark:text-gray-400">{(error as any)?.response?.status === 404 ? 'This booking may have been deleted.' : 'The backend may be unavailable. Try refreshing the page.'}</p></div>;
  if (!booking) return <div className="text-gray-500 dark:text-gray-400 text-center py-20">Booking not found</div>;

  const startEdit = () => {
    setForm({
      status: booking.status ?? '',
      paymentStatus: booking.paymentStatus ?? '',
      paymentMethod: booking.paymentMethod ?? '',
      paymentReference: booking.paymentReference ?? '',
      guestNote: booking.guestNote ?? '',
      specialRequests: booking.specialRequests ?? '',
    });
    setEditing(true);
  };

  const statusMap: Record<string, string> = {
    pending: 'bg-yellow-900/40 text-yellow-400',
    confirmed: 'bg-blue-900/40 text-blue-400',
    in_progress: 'bg-indigo-900/40 text-indigo-400',
    completed: 'bg-emerald-900/40 text-emerald-400',
    cancelled: 'bg-red-900/40 text-red-400',
    declined: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  };

  const paymentStatusMap: Record<string, string> = {
    pending: 'bg-yellow-900/40 text-yellow-400',
    paid: 'bg-emerald-900/40 text-emerald-400',
    partially_paid: 'bg-blue-900/40 text-blue-400',
    refunded: 'bg-violet-900/40 text-violet-400',
    failed: 'bg-red-900/40 text-red-400',
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString();
  const currency = booking.currency || 'EGP';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/bookings')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking #{booking.shortCode || booking.id}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[booking.status] || 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{booking.status?.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{booking.bookingUuid}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Edit</button>}
          {editing && <button onClick={() => updateMut.mutate(form)} disabled={updateMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"><Save className="h-4 w-4" />Save</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm">Cancel</button>}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: `${fmt(booking.totalAmount)} ${currency}`, color: 'text-emerald-400' },
          { label: 'Base', value: `${fmt(booking.baseAmount)} ${currency}`, color: 'text-blue-400' },
          { label: 'Cleaning', value: `${fmt(booking.cleaningFee)} ${currency}`, color: 'text-gray-500 dark:text-gray-400' },
          { label: 'Service Fee', value: `${fmt(booking.serviceFee)} ${currency}`, color: 'text-violet-400' },
          { label: 'Taxes', value: `${fmt(booking.taxes)} ${currency}`, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <span className="text-xs text-gray-500 uppercase">{s.label}</span>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stay Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-400" />Stay Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Check-in', new Date(booking.checkIn).toLocaleDateString()],
                ['Check-out', new Date(booking.checkOut).toLocaleDateString()],
                ['Nights', booking.nights],
                ['Guests', booking.guestsCount],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <label className="text-xs text-gray-500 uppercase">{label}</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            {booking.guestNote && <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800"><label className="text-xs text-gray-500">Guest Note</label><p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{booking.guestNote}</p></div>}
            {booking.specialRequests && <div className="mt-2"><label className="text-xs text-gray-500">Special Requests</label><p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{booking.specialRequests}</p></div>}
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-400" />Payment</h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined'] },
                  { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'] },
                  { key: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['bank_transfer', 'instapay', 'cash', 'stripe', 'opay'] },
                  { key: 'paymentReference', label: 'Payment Reference', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500">{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1 capitalize">
                        {f.options!.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                      </select>
                    ) : (
                      <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Guest Note</label>
                  <textarea value={form.guestNote} onChange={e => setForm(prev => ({ ...prev, guestNote: e.target.value }))} rows={2} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white text-sm mt-1" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Payment Status', booking.paymentStatus, paymentStatusMap[booking.paymentStatus]],
                  ['Method', booking.paymentMethod?.replace(/_/g, ' '), null],
                  ['Reference', booking.paymentReference || '—', null],
                  ['Deposit', booking.depositAmount ? `${fmt(booking.depositAmount)} ${currency} (${booking.depositStatus})` : '—', null],
                  ['Stripe Intent', booking.stripePaymentIntentId || '—', null],
                  ['OPay Ref', booking.opayOrderReference || '—', null],
                ].map(([label, value, badge]) => (
                  <div key={label as string}>
                    <label className="text-xs text-gray-500 uppercase">{label}</label>
                    {badge ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 capitalize ${badge}`}>{(value as string)?.replace(/_/g, ' ')}</span>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white mt-0.5 capitalize truncate">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Refund info */}
            {booking.refundAmount > 0 && (
              <div className="mt-4 p-4 bg-violet-900/20 border border-violet-800/30 rounded-lg">
                <p className="text-sm font-medium text-violet-400">Refund: {fmt(booking.refundAmount)} {currency}</p>
                {booking.refundReason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.refundReason}</p>}
              </div>
            )}

            {/* Payment Proof */}
            {booking.paymentProofUrl && (
              <div className="mt-4 p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Image className="h-4 w-4 text-blue-400" />Payment Proof</h3>
                <a href={getUploadUrl(booking.paymentProofUrl)} target="_blank" rel="noopener noreferrer" onClick={() => !booking.proofViewedAt && markProofViewedMut.mutate()}>
                  <img src={getUploadUrl(booking.paymentProofUrl)} alt="Payment proof" className="max-w-full max-h-48 rounded-lg border border-gray-300 dark:border-gray-700 object-contain" />
                </a>
                {booking.proofViewedAt ? (
                  <p className="text-xs text-emerald-500 mt-2">✓ Viewed {new Date(booking.proofViewedAt).toLocaleString()}</p>
                ) : (
                  <p className="text-xs text-amber-400 mt-2">Click image to mark as viewed before approving</p>
                )}
              </div>
            )}
          </div>

          {/* Deposit Claim Review */}
          {(booking.depositAmount ?? 0) > 0 && booking.depositStatus && booking.depositStatus !== 'none' && (
            <DepositClaimPanel booking={booking} bookingId={bookingId} />
          )}

          {/* Cancellation */}
          {booking.status === 'cancelled' && (
            <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2"><XCircle className="h-5 w-5" />Cancelled</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-xs text-gray-500">Cancelled By</label><p className="text-gray-900 dark:text-white capitalize mt-0.5">{booking.cancelledBy || '—'}</p></div>
                <div><label className="text-xs text-gray-500">Cancelled At</label><p className="text-gray-900 dark:text-white mt-0.5">{booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : '—'}</p></div>
                <div className="col-span-2"><label className="text-xs text-gray-500">Reason</label><p className="text-gray-600 dark:text-gray-300 mt-0.5">{booking.cancellationReason || '—'}</p></div>
                <div><label className="text-xs text-gray-500">Policy</label><p className="text-gray-900 dark:text-white capitalize mt-0.5">{booking.cancellationPolicy || '—'}</p></div>
                <div><label className="text-xs text-gray-500">Cancellation Fee</label><p className="text-gray-900 dark:text-white mt-0.5">{booking.cancellationFee ? `${fmt(booking.cancellationFee)} ${currency}` : '—'}</p></div>
                <div><label className="text-xs text-gray-500">Guest Refund</label>
                  <p className={`mt-0.5 font-semibold ${Number(booking.refundAmount) > 0 ? 'text-violet-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {Number(booking.refundAmount) > 0 ? `${fmt(booking.refundAmount)} ${currency}` : 'No refund'}
                  </p>
                </div>
                <div><label className="text-xs text-gray-500">Host Retains</label>
                  <p className="text-emerald-400 font-semibold mt-0.5">
                    {Number(booking.cancellationFee) > 0
                      ? `${fmt(Number(booking.totalAmount) - Number(booking.refundAmount || 0))} ${currency}`
                      : (Number(booking.refundAmount) > 0 ? '—' : `${fmt(booking.totalAmount)} ${currency}`)}
                  </p>
                </div>
              </div>
              {/* Policy tier explanation */}
              {booking.cancellationPolicy && booking.cancelledAt && booking.checkIn && (() => {
                const cancelledAt = new Date(booking.cancelledAt);
                const checkIn = new Date(String(booking.checkIn) + 'T00:00:00');
                const daysAtCancel = Math.ceil((checkIn.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24));
                const p = booking.cancellationPolicy;
                let tier = '';
                let color = '';
                if (p === 'flexible') {
                  tier = daysAtCancel >= 1 ? '🟢 Full refund window (≥24 h before check-in)' : '🔴 Past refund window (check-in day)';
                  color = daysAtCancel >= 1 ? 'text-emerald-400' : 'text-red-400';
                } else if (p === 'moderate') {
                  if (daysAtCancel >= 5) { tier = '🟢 Full refund window (≥5 days before)'; color = 'text-emerald-400'; }
                  else if (daysAtCancel >= 1) { tier = '🟡 Partial refund window (1–4 days before)'; color = 'text-amber-400'; }
                  else { tier = '🔴 Past refund window (check-in day)'; color = 'text-red-400'; }
                } else if (p === 'strict') {
                  if (daysAtCancel >= 14) { tier = '🟢 Full refund window (≥14 days before)'; color = 'text-emerald-400'; }
                  else if (daysAtCancel >= 7) { tier = '🟡 Partial refund window (7–13 days before)'; color = 'text-amber-400'; }
                  else { tier = '🔴 No refund window (<7 days before)'; color = 'text-red-400'; }
                }
                return tier ? (
                  <div className="mt-3 pt-3 border-t border-red-800/20">
                    <p className="text-xs text-gray-500 uppercase mb-1">Refund Tier at Cancellation</p>
                    <p className={`text-xs font-medium ${color}`}>{tier}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{daysAtCancel} day{daysAtCancel !== 1 ? 's' : ''} before check-in · {p} policy</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Review */}
          {booking.review && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Guest Review</h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">{'★'.repeat(booking.review.overallRating || booking.review.rating || 0)}</span>
                <span className="text-xs text-gray-500">{new Date(booking.review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{booking.review.comment || '—'}</p>
            </div>
          )}

          {/* Modification History */}
          {booking.modificationHistory && Array.isArray(booking.modificationHistory) && booking.modificationHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-400" />Modification History</h2>
              <div className="space-y-3">
                {booking.modificationHistory.map((mod: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1" />
                      {i < booking.modificationHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{mod.changedAt ? new Date(mod.changedAt).toLocaleString() : '—'} {mod.changedBy ? `by ${mod.changedBy}` : ''}</p>
                      <div className="mt-1 space-y-1">
                        {mod.changes ? Object.entries(mod.changes).map(([field, vals]: [string, any]) => (
                          <p key={field} className="text-gray-600 dark:text-gray-300"><span className="text-gray-500">{field}:</span> <span className="text-red-400 line-through">{String(vals?.from ?? '—')}</span> → <span className="text-emerald-400">{String(vals?.to ?? '—')}</span></p>
                        )) : <p className="text-gray-600 dark:text-gray-300">{mod.reason || mod.description || JSON.stringify(mod)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Admin Actions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Actions</h2>
            {booking.status !== 'cancelled' && (
              <button onClick={() => setCancelModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm text-red-400 transition-colors">
                <XCircle className="h-4 w-4" />Admin Cancel
              </button>
            )}
            {booking.paymentProofUrl && booking.paymentStatus !== 'paid' && (
              <button
                onClick={() => confirmPaymentMut.mutate()}
                disabled={!booking.proofViewedAt || confirmPaymentMut.isPending}
                title={!booking.proofViewedAt ? 'View payment proof first' : 'Confirm payment'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-900/20 hover:bg-emerald-900/40 rounded-lg text-sm text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <CreditCard className="h-4 w-4" />{!booking.proofViewedAt ? 'View Proof to Approve' : 'Confirm Payment'}
              </button>
            )}
            <button onClick={() => { setRefundAmount(String(booking.totalAmount || 0)); setRefundModal(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-900/20 hover:bg-violet-900/40 rounded-lg text-sm text-violet-400 transition-colors">
              <RotateCcw className="h-4 w-4" />Issue Refund
            </button>
            <button onClick={() => { setAdjustForm({ baseAmount: String(booking.baseAmount || 0), cleaningFee: String(booking.cleaningFee || 0), serviceFee: String(booking.serviceFee || 0), totalAmount: String(booking.totalAmount || 0), reason: '' }); setAdjustModal(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-900/20 hover:bg-amber-900/40 rounded-lg text-sm text-amber-400 transition-colors">
              <DollarSign className="h-4 w-4" />Adjust Amounts
            </button>
          </div>

          {/* Profit Breakdown */}
          <BookingProfitCard bookingId={bookingId} />

          {/* Property */}
          {booking.property && (
            <Link href={`/properties/${booking.property.id}`} className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Home className="h-5 w-5 text-indigo-400" />Property</h2>
              <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{booking.property.title}</p>
              <p className="text-xs text-gray-500">{booking.property.city}, {booking.property.country}</p>
            </Link>
          )}

          {/* Guest */}
          {booking.guest && (
            <Link href={`/users/${booking.guest.id}`} className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-blue-400" />Guest</h2>
              <p className="text-sm text-gray-900 dark:text-white font-medium">{booking.guest.firstName} {booking.guest.lastName}</p>
              <p className="text-xs text-gray-500">{booking.guest.email}</p>
            </Link>
          )}

          {/* Host */}
          {booking.host && (
            <Link href={`/users/${booking.host.id}`} className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Host</h2>
              <p className="text-sm text-gray-900 dark:text-white font-medium">{booking.host.firstName} {booking.host.lastName}</p>
              <p className="text-xs text-gray-500">{booking.host.email}</p>
            </Link>
          )}

          {/* Metadata */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Metadata</h2>
            {[
              ['ID', `#${booking.id}`],
              ['Short Code', booking.shortCode || '—'],
              ['Created', new Date(booking.createdAt).toLocaleString()],
              ['Updated', new Date(booking.updatedAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-4"><AlertTriangle className="h-5 w-5" /><h3 className="text-lg font-semibold">Admin Cancel Booking</h3></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">This will cancel booking <strong className="text-gray-900 dark:text-white">#{booking.shortCode || booking.id}</strong> and notify the guest.</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancellation reason..." rows={3} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCancelModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Back</button>
              <button onClick={() => cancelMut.mutate(cancelReason)} disabled={!cancelReason.trim() || cancelMut.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg disabled:opacity-50">Cancel Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-violet-400 mb-4"><RotateCcw className="h-5 w-5" /><h3 className="text-lg font-semibold">Issue Refund</h3></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Total booking amount: <strong className="text-gray-900 dark:text-white">{fmt(booking.totalAmount)} {currency}</strong></p>
            <div className="mb-3">
              <label className="text-xs text-gray-500">Refund Amount ({currency})</label>
              <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} min={0.01} max={booking.totalAmount} step="0.01" className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1 ${parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > booking.totalAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
              {parseFloat(refundAmount) <= 0 && refundAmount !== '' && <p className="text-xs text-red-400 mt-0.5">Amount must be greater than 0</p>}
              {parseFloat(refundAmount) > booking.totalAmount && <p className="text-xs text-red-400 mt-0.5">Amount cannot exceed total ({fmt(booking.totalAmount)} {currency})</p>}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Reason</label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Refund reason..." rows={3} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRefundModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Back</button>
              <button onClick={() => refundMut.mutate({ amount: parseFloat(refundAmount), reason: refundReason })} disabled={!refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > booking.totalAmount || !refundReason.trim() || refundMut.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg disabled:opacity-50">Issue Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Amounts Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-4"><DollarSign className="h-5 w-5" /><h3 className="text-lg font-semibold">Adjust Booking Amounts</h3></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { key: 'baseAmount', label: 'Base Amount' },
                { key: 'cleaningFee', label: 'Cleaning Fee' },
                { key: 'serviceFee', label: 'Service Fee' },
                { key: 'totalAmount', label: 'Total Amount' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500">{f.label} ({currency})</label>
                  <input type="number" value={(adjustForm as any)[f.key]} onChange={e => setAdjustForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white mt-1" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Reason *</label>
              <textarea value={adjustForm.reason} onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="Why are you adjusting amounts..." rows={3} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdjustModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg">Back</button>
              <button onClick={() => adjustMut.mutate({ baseAmount: adjustForm.baseAmount ? parseFloat(adjustForm.baseAmount) : undefined, cleaningFee: adjustForm.cleaningFee ? parseFloat(adjustForm.cleaningFee) : undefined, serviceFee: adjustForm.serviceFee ? parseFloat(adjustForm.serviceFee) : undefined, totalAmount: adjustForm.totalAmount ? parseFloat(adjustForm.totalAmount) : undefined, reason: adjustForm.reason })} disabled={!adjustForm.reason.trim() || adjustMut.isPending} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
