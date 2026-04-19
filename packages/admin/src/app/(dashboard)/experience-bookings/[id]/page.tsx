'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  ArrowLeft, Ticket, User, MapPin, Calendar, Users, CreditCard,
  CheckCircle, Clock, XCircle, Image, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  confirmed: 'bg-sky-900/50 text-sky-400',
  completed: 'bg-emerald-900/50 text-emerald-400',
  cancelled: 'bg-red-900/50 text-red-400',
  declined: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  submitted: 'bg-violet-900/50 text-violet-400',
  paid: 'bg-emerald-900/50 text-emerald-400',
  refunded: 'bg-red-900/50 text-red-400',
};

export default function ExperienceBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['admin-experience-booking', id],
    queryFn: () => adminApi.getExperienceBookingDetail(Number(id)),
    enabled: !!id,
  });

  const confirmPayment = useMutation({
    mutationFn: () => adminApi.confirmExpBookingPayment(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-experience-booking', id] });
      toast.success('Payment confirmed');
    },
    onError: () => toast.error('Failed to confirm payment'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-64 animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>Experience booking not found</p>
      </div>
    );
  }

  const b = booking as any;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Experience Booking #{b.id}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Created {b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', STATUS_COLORS[b.status] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
          {b.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Experience Info */}
        <Card title="Experience" icon={<Ticket className="h-4 w-4 text-indigo-400" />}>
          <Row label="Title" value={b.experience?.title ?? '—'} />
          <Row label="Date" value={b.bookingDate ?? '—'} />
          <Row label="Start time" value={b.startTime ?? '—'} />
          <Row label="Location" value={b.experience?.city ?? '—'} />
        </Card>

        {/* Guest Info */}
        <Card title="Guest" icon={<User className="h-4 w-4 text-sky-400" />}>
          <Row label="Name" value={`${b.guest?.firstName ?? ''} ${b.guest?.lastName ?? ''}`} />
          <Row label="Email" value={b.guest?.email ?? '—'} />
          <Row label="Phone" value={b.guest?.phone ?? '—'} />
        </Card>

        {/* Host Info */}
        <Card title="Host" icon={<User className="h-4 w-4 text-emerald-400" />}>
          <Row label="Name" value={`${b.host?.firstName ?? ''} ${b.host?.lastName ?? ''}`} />
          <Row label="Email" value={b.host?.email ?? '—'} />
          <Row label="Phone" value={b.host?.phone ?? '—'} />
        </Card>

        {/* Booking Details */}
        <Card title="Booking Details" icon={<Users className="h-4 w-4 text-violet-400" />}>
          <Row label="Guests" value={String(b.guestsCount ?? 1)} />
          <Row label="Price / person" value={`EGP ${Number(b.pricePerPerson ?? 0).toLocaleString()}`} />
          <Row label="Subtotal" value={`EGP ${Number(b.subtotal ?? 0).toLocaleString()}`} />
          {Number(b.discountAmount) > 0 && (
            <Row label="Discount" value={`-EGP ${Number(b.discountAmount).toLocaleString()}`} valueClass="text-red-400" />
          )}
          <Row label="Service fee" value={`EGP ${Number(b.serviceFee ?? 0).toLocaleString()}`} />
          <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
            <Row label="Total" value={`EGP ${Number(b.totalAmount ?? 0).toLocaleString()}`} bold />
          </div>
        </Card>

        {/* Payment Info */}
        <Card title="Payment" icon={<CreditCard className="h-4 w-4 text-amber-400" />}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Status:</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PAYMENT_COLORS[b.paymentStatus] ?? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
              {b.paymentStatus}
            </span>
          </div>
          <Row label="Method" value={b.paymentMethod ?? 'Not set'} />
          <Row label="Reference" value={b.paymentReference ?? '—'} />
          {b.opayOrderReference && <Row label="OPay Ref" value={b.opayOrderReference} />}
          {b.stripePaymentIntentId && <Row label="Stripe PI" value={b.stripePaymentIntentId} />}
          {b.paymentProofUrl && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Payment Proof:</p>
              <a href={getUploadUrl(b.paymentProofUrl)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                <Image className="h-3.5 w-3.5" /> View proof
              </a>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card title="Notes" icon={<MessageSquare className="h-4 w-4 text-pink-400" />}>
          <Row label="Guest note" value={b.guestNote ?? 'None'} />
          {b.cancellationReason && (
            <Row label="Cancellation reason" value={b.cancellationReason} valueClass="text-red-400" />
          )}
          {b.cancelledAt && (
            <Row label="Cancelled at" value={new Date(b.cancelledAt).toLocaleString()} />
          )}
        </Card>
      </div>

      {/* Review */}
      {b.review && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Guest Review</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 font-bold">{b.review.rating ?? b.review.overallRating}/5</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">stars</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{b.review.comment ?? 'No comment'}</p>
        </div>
      )}

      {/* Admin Actions */}
      {b.paymentStatus !== 'paid' && b.paymentStatus !== 'refunded' && b.status !== 'cancelled' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => confirmPayment.mutate()}
              disabled={confirmPayment.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value, valueClass, bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-2', bold ? 'font-medium' : '')}>
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={valueClass ?? 'text-gray-900 dark:text-white'}>{value}</span>
    </div>
  );
}
