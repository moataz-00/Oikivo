'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Clock, Video, MapPin, Phone, MessageSquare,
  Calendar, Award, ChevronLeft, Globe, Briefcase,
  X, CheckCircle, AlertCircle, LogIn, Lock,
  Languages, TrendingUp, ShieldCheck, User, CreditCard,
} from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

const DELIVERY_ICONS: Record<string, any> = {
  video_call: Video,
  in_person: MapPin,
  phone: Phone,
  chat: MessageSquare,
};
const DELIVERY_LABELS: Record<string, { en: string; ar: string }> = {
  video_call: { en: 'Video Call', ar: 'مكالمة فيديو' },
  in_person: { en: 'In Person', ar: 'حضوري' },
  phone: { en: 'Phone Call', ar: 'مكالمة هاتفية' },
  chat: { en: 'Chat', ar: 'دردشة' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const SPEC_LABELS: Record<string, { en: string; ar: string }> = {
  listing_optimization: { en: 'Listing Optimization', ar: 'تحسين الإعلان' },
  pricing_strategy: { en: 'Pricing Strategy', ar: 'استراتيجية التسعير' },
  interior_design: { en: 'Interior Design', ar: 'التصميم الداخلي' },
  guest_experience: { en: 'Guest Experience', ar: 'تجربة الضيوف' },
  photography: { en: 'Photography', ar: 'التصوير' },
  superhost_coaching: { en: 'Superhost Coaching', ar: 'تدريب المضيف المتميز' },
  property_management: { en: 'Property Management', ar: 'إدارة العقارات' },
  revenue_management: { en: 'Revenue Management', ar: 'إدارة الإيرادات' },
};

// ─── Booking Modal ───────────────────────────────────────────────────────────
function BookingModal({
  consultant,
  isAr,
  onClose,
  onSuccess,
}: {
  consultant: any;
  isAr: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [deliveryMode, setDeliveryMode] = useState('video_call');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'card'>('instapay');

  const INSTAPAY_PHONE = process.env.NEXT_PUBLIC_INSTAPAY_PHONE ?? '01X-XXXX-XXXX';
  const INSTAPAY_NAME = process.env.NEXT_PUBLIC_INSTAPAY_NAME ?? 'Oikivo';

  // C5: Load consultant's service offerings
  const servicesQuery = useQuery<any[]>({
    queryKey: ['consultant-services', consultant.id],
    queryFn: () => consultationsApi.getConsultantServices(consultant.id),
  });
  const services: any[] = servicesQuery.data ?? [];
  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;
  const effectiveDuration = selectedService ? selectedService.durationMinutes : durationMinutes;

  const hourlyRate = Number(consultant.hourlyRate);
  const basePrice = selectedService
    ? Number(selectedService.price)
    : Math.round(hourlyRate * (effectiveDuration / 60) * 100) / 100;
  const clientFee = Math.round(basePrice * 0.1 * 100) / 100;
  const total = Math.round((basePrice + clientFee) * 100) / 100;
  const currency = consultant.currency ?? 'EGP';

  const slotsQuery = useQuery<string[]>({
    queryKey: ['consultant-slots', consultant.id, selectedDate, effectiveDuration],
    queryFn: () =>
      consultationsApi.getConsultantSlots(consultant.id, selectedDate, effectiveDuration),
    enabled: !!selectedDate,
  });

  useEffect(() => { setSelectedSlot(''); }, [selectedDate, effectiveDuration, selectedServiceId]);

  const mutation = useMutation({
    mutationFn: () =>
      consultationsApi.bookSession({
        consultantId: consultant.id,
        durationMinutes: effectiveDuration,
        deliveryMode,
        scheduledAt: selectedSlot,
        clientNote: clientNote || undefined,
        paymentMethod,
        serviceId: selectedServiceId ?? undefined,
      }),
    onSuccess,
  });

  function formatSlot(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isAr ? 'احجز جلسة' : 'Book a Session'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* C5: Service selector */}
          {services.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-800">
                {isAr ? 'اختر خدمة' : 'Select a Service'}
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceId(null)}
                  className={cn(
                    'w-full rounded-xl border-2 p-3 text-left transition',
                    selectedServiceId === null
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-200',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      {isAr ? 'بالساعة (مرن)' : 'Hourly Rate (flexible)'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {currency} {Number(consultant.hourlyRate).toLocaleString()}/hr
                    </span>
                  </div>
                </button>
                {services.map((svc: any) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={cn(
                      'w-full rounded-xl border-2 p-3 text-left transition',
                      selectedServiceId === svc.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-200',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        {isAr && svc.titleAr ? svc.titleAr : svc.title}
                      </span>
                      <span className="text-sm font-bold text-indigo-700">
                        {currency} {Number(svc.price).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {svc.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                      {svc.description && (
                        <> · {isAr && svc.descriptionAr ? svc.descriptionAr : svc.description}</>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration picker — hidden when a fixed-price service is selected */}
          {!selectedService && (
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">
              {isAr ? 'اختر مدة الجلسة' : 'Choose session duration'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMinutes(d)}
                  className={cn(
                    'rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition',
                    durationMinutes === d
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-indigo-200 bg-white text-gray-600 hover:border-indigo-400',
                  )}
                >
                  {d} {isAr ? 'دقيقة' : 'min'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(DELIVERY_LABELS).map(([val, labels]) => {
                const Icon = DELIVERY_ICONS[val] ?? Video;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDeliveryMode(val)}
                    className={cn(
                      'flex items-center gap-1 rounded-lg border-2 px-2.5 py-1 text-xs font-medium transition',
                      deliveryMode === val
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-indigo-200 bg-white text-gray-600 hover:border-indigo-400',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {isAr ? labels.ar : labels.en}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-indigo-600 font-medium">
              {currency} {basePrice.toLocaleString()} {isAr ? 'للجلسة' : 'for this session'}
            </p>
          </div>
          )}

          {/* Service summary when a specific service is selected */}
          {selectedService && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
              <p className="text-xs font-medium text-indigo-600 mb-1">
                {isAr ? 'الخدمة المحددة' : 'Selected Service'}
              </p>
              <p className="text-sm font-bold text-gray-900">
                {isAr && selectedService.titleAr ? selectedService.titleAr : selectedService.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedService.durationMinutes} {isAr ? 'دقيقة' : 'min'} · {currency} {Number(selectedService.price).toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(DELIVERY_LABELS).map(([val, labels]) => {
                  const Icon = DELIVERY_ICONS[val] ?? Video;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDeliveryMode(val)}
                      className={cn(
                        'flex items-center gap-1 rounded-lg border-2 px-2.5 py-1 text-xs font-medium transition',
                        deliveryMode === val
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-indigo-200 bg-white text-gray-600 hover:border-indigo-400',
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {isAr ? labels.ar : labels.en}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1 — Pick a date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4 text-indigo-600" />
              {isAr ? 'اختر تاريخاً' : 'Pick a date'}
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Step 2 — Pick a slot */}
          {selectedDate && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Clock className="mr-1 inline h-4 w-4 text-indigo-600" />
                {isAr ? 'اختر وقتاً' : 'Pick a time slot'}
              </label>

              {slotsQuery.isLoading && (
                <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                  {isAr ? 'جاري تحميل المواعيد...' : 'Loading available slots…'}
                </div>
              )}

              {slotsQuery.isSuccess && slotsQuery.data.length === 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
                  {isAr
                    ? 'لا توجد مواعيد متاحة في هذا اليوم'
                    : 'No available slots on this day'}
                </div>
              )}

              {slotsQuery.isSuccess && slotsQuery.data.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {slotsQuery.data.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                        selectedSlot === slot
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50',
                      )}
                    >
                      {formatSlot(slot)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
            </label>
            <textarea
              rows={3}
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              placeholder={
                isAr
                  ? 'اشرح ما تريد مناقشته أو أي تفاصيل مهمة...'
                  : 'Describe what you want to discuss or any important details...'
              }
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <CreditCard className="mr-1 inline h-4 w-4 text-indigo-600" />
              {isAr ? 'طريقة الدفع' : 'Payment Method'}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('instapay')}
                className={cn(
                  'flex-1 rounded-xl border-2 px-3 py-3 text-sm font-medium transition text-center',
                  paymentMethod === 'instapay'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200',
                )}
              >
                📱 InstaPay
                {paymentMethod === 'instapay' && (
                  <CheckCircle className="ml-1 inline h-3.5 w-3.5 text-indigo-600" />
                )}
              </button>
              <button
                type="button"
                disabled
                className="flex-1 rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-400 cursor-not-allowed text-center"
              >
                💳 {isAr ? 'بطاقة (قريباً)' : 'Card (soon)'}
              </button>
            </div>
          </div>

          {/* InstaPay instructions */}
          {paymentMethod === 'instapay' && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-bold text-amber-800">
                📱 {isAr ? 'تعليمات InstaPay' : 'InstaPay Instructions'}
              </p>
              <div className="space-y-1 text-sm text-amber-700">
                <p>
                  <span className="font-medium">{isAr ? 'الهاتف: ' : 'Phone: '}</span>
                  <span className="font-mono font-bold">{INSTAPAY_PHONE}</span>
                </p>
                <p>
                  <span className="font-medium">{isAr ? 'الاسم: ' : 'Name: '}</span>
                  {INSTAPAY_NAME}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  {isAr
                    ? 'أرسل المبلغ الإجمالي وأضف رقم الحجز في ملاحظة التحويل. سيتواصل معك المستشار بعد تأكيد الدفع.'
                    : 'Transfer the total amount and include your booking reference in the transfer note. The consultant will reach out after confirming payment.'}
                </p>
              </div>
            </div>
          )}

          {/* Fee breakdown */}
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-500">
              <span>{isAr ? 'سعر الجلسة' : 'Session price'}</span>
              <span>{currency} {basePrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-500">
              <span>{isAr ? 'رسوم المنصة (10%)' : 'Platform fee (10%)'}</span>
              <span>{currency} {clientFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-gray-900">
              <span>{isAr ? 'الإجمالي' : 'Total'}</span>
              <span className="text-indigo-700">{currency} {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {(mutation.error as any)?.response?.data?.message ?? (isAr ? 'حدث خطأ' : 'Something went wrong')}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            disabled={!selectedSlot || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending
              ? (isAr ? 'جاري الحجز...' : 'Booking...')
              : isAr
              ? `احجز الآن · ${currency} ${total.toLocaleString()}`
              : `Book Now · ${currency} ${total.toLocaleString()}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Login Prompt Modal ──────────────────────────────────────────────────────
function LoginPromptModal({
  isAr,
  locale,
  onClose,
}: {
  isAr: boolean;
  locale: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <Lock className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          {isAr ? 'تسجيل الدخول مطلوب' : 'Sign In Required'}
        </h3>
        <p className="mb-6 text-sm text-gray-500">
          {isAr
            ? 'يجب أن تكون مسجلاً للحجز مع المستشار'
            : 'You need an account to book a consultation session'}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/${locale}/login`}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            <LogIn className="h-4 w-4" />
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
          <Link
            href={`/${locale}/register`}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {isAr ? 'إنشاء حساب' : 'Create Account'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sidebar Booking Widget ──────────────────────────────────────────────────
function SidebarBookingWidget({
  consultant,
  availability,
  isAr,
  user,
  locale,
  onSuccess,
}: {
  consultant: any;
  availability: any[];
  isAr: boolean;
  user: any;
  locale: string;
  onSuccess: () => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  const [selDuration, setSelDuration] = useState(60);
  const [selMode, setSelMode] = useState('video_call');
  const [selDate, setSelDate] = useState('');
  const [selSlot, setSelSlot] = useState('');
  const [note, setNote] = useState('');

  const availDays = new Set<number>((availability ?? []).map((a: any) => Number(a.dayOfWeek)));
  const DAYS_SHORT    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  useEffect(() => { setSelSlot(''); }, [selDate]);
  useEffect(() => { setSelDate(''); setSelSlot(''); }, [selDuration, selMode]);

  const slotsQuery = useQuery<string[]>({
    queryKey: ['sidebar-slots', consultant.id, selDate, selDuration],
    queryFn: () =>
      consultationsApi.getConsultantSlots(consultant.id, selDate, selDuration),
    enabled: !!selDate,
  });

  const hourlyRate = Number(consultant.hourlyRate);
  const basePrice = Math.round(hourlyRate * (selDuration / 60) * 100) / 100;
  const fee   = Math.round(basePrice * 0.1 * 100) / 100;
  const total = Math.round((basePrice + fee) * 100) / 100;
  const currency = consultant.currency ?? 'EGP';

  const mutation = useMutation({
    mutationFn: () =>
      consultationsApi.bookSession({
        consultantId: consultant.id,
        durationMinutes: selDuration,
        deliveryMode: selMode,
        scheduledAt: selSlot,
        clientNote: note || undefined,
        paymentMethod: 'instapay',
      }),
    onSuccess: () => {
      setSelDate('');
      setSelSlot('');
      setNote('');
      onSuccess();
    },
  });

  function formatSlot(iso: string) {
    return new Date(iso).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden border border-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-700 px-5 py-4">
        <p className="font-bold text-white text-[15px]">{isAr ? 'احجز جلسة' : 'Book a Session'}</p>
        <p className="text-indigo-200 text-xs mt-0.5">
          {isAr ? 'من' : 'From'} {currency} {Number(consultant.hourlyRate).toLocaleString()}/{isAr ? 'ساعة' : 'hr'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Duration picker ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {isAr ? 'مدة الجلسة' : 'Session Duration'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[30, 45, 60, 90, 120].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelDuration(d)}
                className={cn(
                  'rounded-lg border-2 px-2.5 py-1 text-xs font-medium transition',
                  selDuration === d
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300',
                )}
              >
                {d} {isAr ? 'دق' : 'min'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Delivery mode picker ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {isAr ? 'طريقة التواصل' : 'Delivery Mode'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DELIVERY_LABELS).map(([val, labels]) => {
              const Icon = DELIVERY_ICONS[val] ?? Video;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelMode(val)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border-2 px-2.5 py-1 text-xs font-medium transition',
                    selMode === val
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {isAr ? labels.ar : labels.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Available days pills ── */}
        {availDays.size > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'أيام العمل' : 'Working Days'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <span
                  key={d}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium border',
                    availDays.has(d)
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-gray-50 text-gray-300 border-gray-100',
                  )}
                >
                  {isAr ? DAYS_SHORT_AR[d] : DAYS_SHORT[d]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Date picker ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {isAr ? 'اختر تاريخاً' : 'Pick a Date'}
          </p>
          <input
            type="date"
            min={todayStr}
            max={maxDateStr}
            value={selDate}
            onChange={(e) => setSelDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* ── Time slots ── */}
        {selDate && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'الأوقات المتاحة' : 'Available Times'}
            </p>
            {slotsQuery.isLoading && (
              <div className="py-3 text-center text-xs text-gray-400">
                {isAr ? 'جاري التحميل...' : 'Loading…'}
              </div>
            )}
            {slotsQuery.isSuccess && slotsQuery.data.length === 0 && (
              <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center text-xs text-amber-600">
                {isAr ? 'لا توجد أوقات متاحة في هذا اليوم' : 'No times available on this day'}
              </div>
            )}
            {slotsQuery.isSuccess && slotsQuery.data.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {slotsQuery.data.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelSlot(slot)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                      selSlot === slot
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50',
                    )}
                  >
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Note ── */}
        {selSlot && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
            </p>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isAr ? 'ما الذي ستناقشه؟' : 'What will you discuss?'}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        {/* ── Fee breakdown ── */}
        {selSlot && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 text-sm">
            <div className="flex justify-between px-3 py-2 text-gray-500">
              <span>{isAr ? 'سعر الجلسة' : 'Session price'}</span>
              <span>{currency} {basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 py-2 text-gray-500">
              <span>{isAr ? 'رسوم المنصة (10%)' : 'Platform fee (10%)'}</span>
              <span>{currency} {fee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 py-2 font-bold text-gray-900">
              <span>{isAr ? 'الإجمالي' : 'Total'}</span>
              <span className="text-indigo-700">{currency} {total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {mutation.isError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {(mutation.error as any)?.response?.data?.message ?? (isAr ? 'حدث خطأ' : 'An error occurred')}
          </div>
        )}

        {/* ── CTA ── */}
        {!user ? (
          <Link
            href={`/${locale}/login`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            {isAr ? 'سجّل دخولك للحجز' : 'Sign In to Book'}
          </Link>
        ) : (
          <button
            disabled={!selSlot || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending
              ? (isAr ? 'جاري الحجز...' : 'Booking...')
              : selSlot
              ? `${isAr ? 'احجز الآن ·' : 'Book Now ·'} ${currency} ${total.toLocaleString()}`
              : (isAr ? 'اختر وقتاً للحجز' : 'Select a time to book')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ConsultantProfilePage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const params = useParams();
  const consultantId = Number(params.id);

  const { user, _hasHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) hydrate();
  }, [_hasHydrated, hydrate]);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['consultant', consultantId],
    queryFn: () => consultationsApi.getConsultant(consultantId),
    enabled: !!consultantId,
  });

  const handleBookClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      setShowBookingModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-56 rounded-2xl bg-gray-200" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { consultant: c, reviews, availability } = data ?? {};
  if (!c) return null;

  // Resolve profile photo
  const profilePhotoDoc = (c.documents ?? []).find((d: any) => d.documentType === 'profile_photo');
  const profilePhotoUrl = profilePhotoDoc
    ? `${BACKEND_URL}${profilePhotoDoc.fileUrl}`
    : c.user?.avatarUrl
    ? c.user.avatarUrl.startsWith('http') ? c.user.avatarUrl : `${BACKEND_URL}${c.user.avatarUrl}`
    : null;
  const initials = (c.displayName?.[0] ?? c.user?.firstName?.[0] ?? '?').toUpperCase();

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Back */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Link
            href={`/${locale}/consultations`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            {isAr ? 'العودة للمستشارين' : 'Back to Consultants'}
          </Link>
        </div>

        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-4 max-w-5xl px-4"
        >
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            {/* Cover gradient */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-orange-400" />

            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="flex flex-col gap-5 md:flex-row md:items-end -mt-14 mb-5">
                <div className="shrink-0">
                  {profilePhotoUrl ? (
                    <Image
                      src={profilePhotoUrl}
                      alt={c.displayName}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-violet-500 text-3xl font-bold text-white shadow-md">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1 md:pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{c.displayName}</h1>
                    {c.isFeatured && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-200">
                        <Award className="h-3 w-3" />
                        {isAr ? 'مميز' : 'Featured'}
                      </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                      <ShieldCheck className="h-3 w-3" />
                      {isAr ? 'معتمد' : 'Verified'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {c.user?.firstName} {c.user?.lastName}
                  </p>
                </div>

                {/* Rate */}
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {c.currency} {Number(c.hourlyRate).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">{isAr ? 'في الساعة' : 'per hour'}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="mb-6 flex flex-wrap gap-6 border-y border-gray-100 py-4">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900">{Number(c.avgRating).toFixed(1)}</span>
                  <span className="text-gray-400">({c.reviewCount} {isAr ? 'تقييم' : 'reviews'})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">{c.totalSessions}</span>
                  <span className="text-gray-400">{isAr ? 'جلسة' : 'sessions'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">{c.yearsExperience}</span>
                  <span className="text-gray-400">{isAr ? 'سنوات خبرة' : 'yrs experience'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{(c.languages ?? []).join(', ')}</span>
                </div>
              </div>

              {/* Bio */}
              {c.bio && (
                <p className="mb-6 text-gray-600 leading-relaxed">{c.bio}</p>
              )}

              {/* Specializations */}
              {(c.specializations ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(c.specializations as string[]).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-100"
                    >
                      {isAr
                        ? (SPEC_LABELS[s]?.ar ?? s.replace(/_/g, ' '))
                        : (SPEC_LABELS[s]?.en ?? s.replace(/_/g, ' '))}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Body ── */}
        <div className="mx-auto mt-8 max-w-5xl px-4 pb-16">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Left col: Services + Reviews */}
            <div className="lg:col-span-2 space-y-6">

              {/* Booking success banner */}
              {bookingSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-green-700"
                >
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    {isAr
                      ? 'تم إرسال طلب الحجز! سيقوم المستشار بتأكيده قريباً.'
                      : 'Booking request sent! The consultant will confirm it soon.'}
                  </p>
                </motion.div>
              )}

              {/* Book a Session CTA */}
              <div>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  {isAr ? 'احجز استشارة' : 'Book a Consultation'}
                </h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {c.currency} {Number(c.hourlyRate).toLocaleString()}
                        <span className="text-base font-normal text-gray-400"> / {isAr ? 'ساعة' : 'hr'}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {isAr
                          ? 'اختر مدة الجلسة وطريقة التواصل المناسبة لك'
                          : 'Choose your session duration and preferred delivery mode'}
                      </p>
                    </div>
                    <button
                      onClick={handleBookClick}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-95 shrink-0"
                    >
                      {!user && <Lock className="h-3.5 w-3.5" />}
                      {isAr ? 'احجز الآن' : 'Book Now'}
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Reviews */}
              <div>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  {isAr ? 'التقييمات' : 'Reviews'}
                  {(reviews ?? []).length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({(reviews ?? []).length})
                    </span>
                  )}
                </h2>
                {(reviews ?? []).length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center text-gray-400 border border-dashed border-gray-200">
                    <Star className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>{isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(reviews as any[]).map((r) => (
                      <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                            {r.reviewer?.firstName?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {r.reviewer?.firstName} {r.reviewer?.lastName}
                            </p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    i < r.overallRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-200',
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="ml-auto text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                        {r.consultantReply && (
                          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm">
                            <p className="font-semibold text-gray-700 mb-1">
                              {isAr ? 'رد المستشار:' : 'Consultant reply:'}
                            </p>
                            <p className="text-gray-600">{r.consultantReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <div className="sticky top-24 space-y-4">

                {/* Inline booking widget */}
                <SidebarBookingWidget
                  consultant={c}
                  availability={availability ?? []}
                  isAr={isAr}
                  user={user}
                  locale={locale}
                  onSuccess={() => {
                    setBookingSuccess(true);
                    setTimeout(() => setBookingSuccess(false), 6000);
                  }}
                />

                {/* Quick stats */}
                <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
                  <h3 className="font-semibold text-gray-900">{isAr ? 'معلومات سريعة' : 'Quick Info'}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{isAr ? 'الجلسات المكتملة' : 'Sessions'}</span>
                      <span className="font-semibold text-gray-900">{c.totalSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{isAr ? 'التقييم' : 'Rating'}</span>
                      <span className="flex items-center gap-1 font-semibold text-gray-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {Number(c.avgRating).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{isAr ? 'الخبرة' : 'Experience'}</span>
                      <span className="font-semibold text-gray-900">
                        {c.yearsExperience} {isAr ? 'سنة' : 'yrs'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{isAr ? 'اللغات' : 'Languages'}</span>
                      <span className="font-semibold text-gray-900 text-right">
                        {(c.languages ?? []).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLoginPrompt && (
          <LoginPromptModal
            isAr={isAr}
            locale={locale}
            onClose={() => setShowLoginPrompt(false)}
          />
        )}
        {showBookingModal && (
          <BookingModal
            consultant={c}
            isAr={isAr}
            onClose={() => setShowBookingModal(false)}
            onSuccess={() => {
              setShowBookingModal(false);
              setBookingSuccess(true);
              setTimeout(() => setBookingSuccess(false), 6000);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
