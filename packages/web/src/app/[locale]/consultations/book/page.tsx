'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, CreditCard, CheckCircle, AlertCircle, Video, Phone, MessageSquare, Users } from 'lucide-react';
import { consultationsApi } from '@/lib/api';

const DURATIONS = [30, 45, 60, 90, 120];

const DELIVERY_MODES = [
  { value: 'video_call', labelEn: 'Video Call', labelAr: 'مكالمة فيديو', icon: Video },
  { value: 'phone', labelEn: 'Phone Call', labelAr: 'مكالمة هاتفية', icon: Phone },
  { value: 'in_person', labelEn: 'In Person', labelAr: 'شخصياً', icon: Users },
  { value: 'chat', labelEn: 'Chat', labelAr: 'دردشة', icon: MessageSquare },
];

export default function BookConsultationPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultantId = Number(searchParams.get('consultantId'));

  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [deliveryMode, setDeliveryMode] = useState('video_call');
  const [clientNote, setClientNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [booked, setBooked] = useState(false);

  const { data: consultant, isLoading } = useQuery({
    queryKey: ['consultant-profile', consultantId],
    queryFn: () => consultationsApi.getConsultant(consultantId),
    enabled: !!consultantId,
    select: (d) => d?.consultant ?? d,
  });

  const mutation = useMutation({
    mutationFn: () =>
      consultationsApi.bookSession({
        consultantId,
        durationMinutes,
        deliveryMode,
        scheduledAt: new Date(scheduledAt).toISOString(),
        clientNote: clientNote || undefined,
        paymentMethod: paymentMethod as 'card' | 'instapay' | 'wallet',
      }),
    onSuccess: () => setBooked(true),
  });

  const hourlyRate = consultant ? Number(consultant.hourlyRate) : 0;
  const basePrice = Math.round(hourlyRate * (durationMinutes / 60) * 100) / 100;
  const clientFee = Math.round(basePrice * 0.10 * 100) / 100;
  const total = Math.round((basePrice + clientFee) * 100) / 100;
  const currency = consultant?.currency ?? 'EGP';

  if (!consultantId) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-gray-500">{isAr ? 'معرف المستشار مفقود' : 'Consultant ID is missing'}</p>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        </motion.div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          {isAr ? 'تم حجز الاستشارة!' : 'Consultation Booked!'}
        </h1>
        <p className="mb-8 max-w-sm text-gray-500">
          {isAr
            ? 'المستشار سيقوم بتأكيد الحجز وإرسال رابط الاجتماع قريباً'
            : 'The consultant will confirm your booking and send a meeting link soon.'}
        </p>
        <button
          onClick={() => router.push(`/${locale}/consultations/my-bookings`)}
          className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600"
        >
          {isAr ? 'حجوزاتي' : 'My Bookings'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-xl px-4">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          {isAr ? 'حجز استشارة' : 'Book a Consultation'}
        </h1>

        {consultant && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">
                {(consultant.displayName ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{consultant.displayName}</h2>
                <p className="text-sm text-gray-500">{currency} {hourlyRate.toLocaleString()} / hr</p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="space-y-6 rounded-2xl bg-white p-8 shadow-sm"
        >
          {/* Duration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Clock className="mr-1 inline h-4 w-4" />
              {isAr ? 'مدة الجلسة' : 'Session Duration'}
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMinutes(d)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                    durationMinutes === d
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d} {isAr ? 'دقيقة' : 'min'}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Mode */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {isAr ? 'طريقة التواصل' : 'Delivery Mode'}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DELIVERY_MODES.map(({ value, labelEn, labelAr, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeliveryMode(value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-xs font-medium transition ${
                    deliveryMode === value
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {isAr ? labelAr : labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4" />
              {isAr ? 'تاريخ ووقت الجلسة' : 'Session Date & Time'}
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {isAr ? 'ملاحظة (اختياري)' : 'Note (optional)'}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder={isAr ? 'أخبر المستشار بما تحتاج مساعدة فيه' : 'Tell the consultant what you need help with'}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <CreditCard className="mr-1 inline h-4 w-4" />
              {isAr ? 'طريقة الدفع' : 'Payment Method'}
            </label>
            <div className="flex gap-3">
              {[
                { value: 'card', label: isAr ? 'بطاقة' : 'Card' },
                { value: 'instapay', label: 'InstaPay' },
                { value: 'wallet', label: isAr ? 'محفظة' : 'Wallet' },
              ].map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition ${
                    paymentMethod === pm.value
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          {consultant && (
            <div className="rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {isAr ? `${durationMinutes} دقيقة استشارة` : `${durationMinutes} min consultation`}
                </span>
                <span className="font-medium">{currency} {basePrice.toLocaleString()}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>{isAr ? 'رسوم الخدمة (10%)' : 'Service fee (10%)'}</span>
                <span>{currency} {clientFee.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-900">{isAr ? 'الإجمالي' : 'Total'}</span>
                <span className="font-bold text-gray-900">{currency} {total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending || !scheduledAt || isLoading}
            className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {mutation.isPending
              ? (isAr ? 'جاري الحجز...' : 'Booking...')
              : (isAr ? 'تأكيد الحجز' : 'Confirm Booking')}
          </button>

          {mutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {(mutation.error as any)?.response?.data?.message ?? (isAr ? 'حدث خطأ' : 'Something went wrong')}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
