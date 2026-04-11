'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CreditCard, Users, Home, XCircle, RotateCcw, Save, AlertTriangle, Image, Clock, DollarSign, PiggyBank } from 'lucide-react';
import { adminApi, getUploadUrl } from '@/lib/api';

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2"><PiggyBank className="h-5 w-5 text-emerald-400" />Profit Breakdown</h2>
      <div className="text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-gray-400">Service Fee</span><span className="text-emerald-400">{egp(p.serviceFee)}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Gateway Fee</span><span className="text-amber-400">−{egp(p.gatewayFee)}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Payout Fee</span><span className="text-amber-400">−{egp(p.payoutFee)}</span></div>
        {isRefunded && <div className="flex justify-between"><span className="text-gray-400">Refund</span><span className="text-red-400">{egp(p.refundAmount)}</span></div>}
        <div className="border-t border-gray-700 pt-1.5 flex justify-between font-medium">
          <span className="text-gray-300">Net Profit</span>
          <span className={p.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{egp(p.netProfit)}</span>
        </div>
      </div>
      <p className="text-xs text-gray-600">Payment: {p.paymentMethod || '—'} • Payout: {p.payoutMethod || '—'}</p>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const bookingId = parseInt(id);

  const { data: booking, isLoading } = useQuery({
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); setEditing(false); },
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) => adminApi.adminCancelBooking(bookingId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); setCancelModal(false); setCancelReason(''); },
  });

  const refundMut = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) => adminApi.adminRefund(bookingId, amount, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); setRefundModal(false); setRefundAmount(''); setRefundReason(''); },
  });

  const adjustMut = useMutation({
    mutationFn: (data: { baseAmount?: number; cleaningFee?: number; serviceFee?: number; totalAmount?: number; reason: string }) => adminApi.adjustBookingAmounts(bookingId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-booking', bookingId] }); setAdjustModal(false); setAdjustForm({ baseAmount: '', cleaningFee: '', serviceFee: '', totalAmount: '', reason: '' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" /></div>;
  if (!booking) return <div className="text-gray-400 text-center py-20">Booking not found</div>;

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
    declined: 'bg-gray-700 text-gray-400',
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
        <button onClick={() => router.push('/bookings')} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Booking #{booking.shortCode || booking.id}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[booking.status] || 'bg-gray-700 text-gray-400'}`}>{booking.status?.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-sm text-gray-400">{booking.bookingUuid}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Edit</button>}
          {editing && <button onClick={() => updateMut.mutate(form)} disabled={updateMut.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"><Save className="h-4 w-4" />Save</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">Cancel</button>}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: `${fmt(booking.totalAmount)} ${currency}`, color: 'text-emerald-400' },
          { label: 'Base', value: `${fmt(booking.baseAmount)} ${currency}`, color: 'text-blue-400' },
          { label: 'Cleaning', value: `${fmt(booking.cleaningFee)} ${currency}`, color: 'text-gray-400' },
          { label: 'Service Fee', value: `${fmt(booking.serviceFee)} ${currency}`, color: 'text-violet-400' },
          { label: 'Taxes', value: `${fmt(booking.taxes)} ${currency}`, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <span className="text-xs text-gray-500 uppercase">{s.label}</span>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stay Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-400" />Stay Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Check-in', new Date(booking.checkIn).toLocaleDateString()],
                ['Check-out', new Date(booking.checkOut).toLocaleDateString()],
                ['Nights', booking.nights],
                ['Guests', booking.guestsCount],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <label className="text-xs text-gray-500 uppercase">{label}</label>
                  <p className="text-sm text-white mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            {booking.guestNote && <div className="mt-3 pt-3 border-t border-gray-800"><label className="text-xs text-gray-500">Guest Note</label><p className="text-sm text-gray-300 mt-1">{booking.guestNote}</p></div>}
            {booking.specialRequests && <div className="mt-2"><label className="text-xs text-gray-500">Special Requests</label><p className="text-sm text-gray-300 mt-1">{booking.specialRequests}</p></div>}
          </div>

          {/* Payment */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-400" />Payment</h2>
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
                      <select value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1 capitalize">
                        {f.options!.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                      </select>
                    ) : (
                      <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Guest Note</label>
                  <textarea value={form.guestNote} onChange={e => setForm(prev => ({ ...prev, guestNote: e.target.value }))} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-1" />
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
                      <p className="text-sm text-white mt-0.5 capitalize truncate">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Refund info */}
            {booking.refundAmount > 0 && (
              <div className="mt-4 p-4 bg-violet-900/20 border border-violet-800/30 rounded-lg">
                <p className="text-sm font-medium text-violet-400">Refund: {fmt(booking.refundAmount)} {currency}</p>
                {booking.refundReason && <p className="text-xs text-gray-400 mt-1">{booking.refundReason}</p>}
              </div>
            )}

            {/* Payment Proof */}
            {booking.paymentProofUrl && (
              <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Image className="h-4 w-4 text-blue-400" />Payment Proof</h3>
                <a href={getUploadUrl(booking.paymentProofUrl)} target="_blank" rel="noopener noreferrer">
                  <img src={getUploadUrl(booking.paymentProofUrl)} alt="Payment proof" className="max-w-full max-h-48 rounded-lg border border-gray-700 object-contain" />
                </a>
              </div>
            )}
          </div>

          {/* Cancellation */}
          {booking.status === 'cancelled' && (
            <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2"><XCircle className="h-5 w-5" />Cancelled</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-xs text-gray-500">Cancelled By</label><p className="text-white capitalize mt-0.5">{booking.cancelledBy || '—'}</p></div>
                <div><label className="text-xs text-gray-500">Cancelled At</label><p className="text-white mt-0.5">{booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : '—'}</p></div>
                <div className="col-span-2"><label className="text-xs text-gray-500">Reason</label><p className="text-gray-300 mt-0.5">{booking.cancellationReason || '—'}</p></div>
                <div><label className="text-xs text-gray-500">Policy</label><p className="text-white capitalize mt-0.5">{booking.cancellationPolicy || '—'}</p></div>
                <div><label className="text-xs text-gray-500">Cancellation Fee</label><p className="text-white mt-0.5">{booking.cancellationFee ? `${fmt(booking.cancellationFee)} ${currency}` : '—'}</p></div>
              </div>
            </div>
          )}

          {/* Review */}
          {booking.review && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Guest Review</h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">{'★'.repeat(booking.review.overallRating || booking.review.rating || 0)}</span>
                <span className="text-xs text-gray-500">{new Date(booking.review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-300">{booking.review.comment || '—'}</p>
            </div>
          )}

          {/* Modification History */}
          {booking.modificationHistory && Array.isArray(booking.modificationHistory) && booking.modificationHistory.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-400" />Modification History</h2>
              <div className="space-y-3">
                {booking.modificationHistory.map((mod: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1" />
                      {i < booking.modificationHistory.length - 1 && <div className="w-px flex-1 bg-gray-700 mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-gray-400 text-xs">{mod.changedAt ? new Date(mod.changedAt).toLocaleString() : '—'} {mod.changedBy ? `by ${mod.changedBy}` : ''}</p>
                      <div className="mt-1 space-y-1">
                        {mod.changes ? Object.entries(mod.changes).map(([field, vals]: [string, any]) => (
                          <p key={field} className="text-gray-300"><span className="text-gray-500">{field}:</span> <span className="text-red-400 line-through">{String(vals?.from ?? '—')}</span> → <span className="text-emerald-400">{String(vals?.to ?? '—')}</span></p>
                        )) : <p className="text-gray-300">{mod.reason || mod.description || JSON.stringify(mod)}</p>}
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Admin Actions</h2>
            {booking.status !== 'cancelled' && (
              <button onClick={() => setCancelModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-sm text-red-400 transition-colors">
                <XCircle className="h-4 w-4" />Admin Cancel
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
            <div onClick={() => router.push(`/properties/${booking.property.id}`)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 transition-colors">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Home className="h-5 w-5 text-indigo-400" />Property</h2>
              <p className="text-sm text-white font-medium truncate">{booking.property.title}</p>
              <p className="text-xs text-gray-500">{booking.property.city}, {booking.property.country}</p>
            </div>
          )}

          {/* Guest */}
          {booking.guest && (
            <div onClick={() => router.push(`/users/${booking.guest.id}`)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 transition-colors">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-blue-400" />Guest</h2>
              <p className="text-sm text-white font-medium">{booking.guest.firstName} {booking.guest.lastName}</p>
              <p className="text-xs text-gray-500">{booking.guest.email}</p>
            </div>
          )}

          {/* Host */}
          {booking.host && (
            <div onClick={() => router.push(`/users/${booking.host.id}`)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 transition-colors">
              <h2 className="text-lg font-semibold text-white mb-2">Host</h2>
              <p className="text-sm text-white font-medium">{booking.host.firstName} {booking.host.lastName}</p>
              <p className="text-xs text-gray-500">{booking.host.email}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase">Metadata</h2>
            {[
              ['ID', `#${booking.id}`],
              ['Short Code', booking.shortCode || '—'],
              ['Created', new Date(booking.createdAt).toLocaleString()],
              ['Updated', new Date(booking.updatedAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-4"><AlertTriangle className="h-5 w-5" /><h3 className="text-lg font-semibold">Admin Cancel Booking</h3></div>
            <p className="text-sm text-gray-400 mb-3">This will cancel booking <strong className="text-white">#{booking.shortCode || booking.id}</strong> and notify the guest.</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancellation reason..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCancelModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Back</button>
              <button onClick={() => cancelMut.mutate(cancelReason)} disabled={!cancelReason.trim() || cancelMut.isPending} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg disabled:opacity-50">Cancel Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-violet-400 mb-4"><RotateCcw className="h-5 w-5" /><h3 className="text-lg font-semibold">Issue Refund</h3></div>
            <p className="text-sm text-gray-400 mb-3">Total booking amount: <strong className="text-white">{fmt(booking.totalAmount)} {currency}</strong></p>
            <div className="mb-3">
              <label className="text-xs text-gray-500">Refund Amount ({currency})</label>
              <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} max={booking.totalAmount} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mt-1" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Reason</label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Refund reason..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRefundModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Back</button>
              <button onClick={() => refundMut.mutate({ amount: parseFloat(refundAmount), reason: refundReason })} disabled={!refundAmount || !refundReason.trim() || refundMut.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg disabled:opacity-50">Issue Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Amounts Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
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
                  <input type="number" value={(adjustForm as any)[f.key]} onChange={e => setAdjustForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mt-1" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500">Reason *</label>
              <textarea value={adjustForm.reason} onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="Why are you adjusting amounts..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdjustModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Back</button>
              <button onClick={() => adjustMut.mutate({ baseAmount: adjustForm.baseAmount ? parseFloat(adjustForm.baseAmount) : undefined, cleaningFee: adjustForm.cleaningFee ? parseFloat(adjustForm.cleaningFee) : undefined, serviceFee: adjustForm.serviceFee ? parseFloat(adjustForm.serviceFee) : undefined, totalAmount: adjustForm.totalAmount ? parseFloat(adjustForm.totalAmount) : undefined, reason: adjustForm.reason })} disabled={!adjustForm.reason.trim() || adjustMut.isPending} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
