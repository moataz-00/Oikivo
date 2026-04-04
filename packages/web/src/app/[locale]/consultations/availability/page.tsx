'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, Save, CheckCircle, Clock, Palmtree, Trash2, Plus } from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const DAYS = [
  { value: 0, en: 'Sunday',    ar: 'الأحد' },
  { value: 1, en: 'Monday',    ar: 'الاثنين' },
  { value: 2, en: 'Tuesday',   ar: 'الثلاثاء' },
  { value: 3, en: 'Wednesday', ar: 'الأربعاء' },
  { value: 4, en: 'Thursday',  ar: 'الخميس' },
  { value: 5, en: 'Friday',    ar: 'الجمعة' },
  { value: 6, en: 'Saturday',  ar: 'السبت' },
];

type DayConfig = { enabled: boolean; startTime: string; endTime: string };

const DEFAULT_CONFIG: DayConfig = { enabled: false, startTime: '09:00', endTime: '17:00' };

export default function AvailabilityPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { isLoggedIn, isConsultant, hasHydrated } = useAuth();
  const qc = useQueryClient();

  const [schedule, setSchedule] = useState<Record<number, DayConfig>>(
    Object.fromEntries(DAYS.map((d) => [d.value, { ...DEFAULT_CONFIG }]))
  );
  const [saved, setSaved] = useState(false);
  const [vacForm, setVacForm] = useState({ startDate: '', endDate: '', reason: '' });

  const profileQuery = useQuery({
    queryKey: ['my-consultant-profile'],
    queryFn: () => consultationsApi.getMyProfile(),
    enabled: hasHydrated && isLoggedIn && isConsultant,
  });

  // Populate schedule from existing availability data
  useEffect(() => {
    const availability: { dayOfWeek: number; startTime: string; endTime: string }[] =
      profileQuery.data?.availability ?? [];
    if (availability.length === 0) return;

    setSchedule((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d.value] = { ...DEFAULT_CONFIG };
      });
      availability.forEach((slot) => {
        next[slot.dayOfWeek] = {
          enabled: true,
          startTime: slot.startTime ?? '09:00',
          endTime: slot.endTime ?? '17:00',
        };
      });
      return next;
    });
  }, [profileQuery.data]);

  const vacationsQuery = useQuery({
    queryKey: ['my-vacations'],
    queryFn: () => consultationsApi.getVacations(),
    enabled: hasHydrated && isLoggedIn && isConsultant,
  });

  const blockVacMutation = useMutation({
    mutationFn: (data: { startDate: string; endDate: string; reason?: string }) =>
      consultationsApi.blockVacation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-vacations'] });
      setVacForm({ startDate: '', endDate: '', reason: '' });
    },
  });

  const deleteVacMutation = useMutation({
    mutationFn: (id: number) => consultationsApi.deleteVacation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-vacations'] }),
  });

  const saveMutation = useMutation({
    mutationFn: (slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
      consultationsApi.setAvailability(slots),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consultant-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    const slots = DAYS.filter((d) => schedule[d.value].enabled).map((d) => ({
      dayOfWeek: d.value,
      startTime: schedule[d.value].startTime,
      endTime: schedule[d.value].endTime,
    }));
    saveMutation.mutate(slots);
  };

  const toggleDay = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateTime = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  if (hasHydrated && (!isLoggedIn || !isConsultant)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            {isAr ? 'غير مصرح' : 'Unauthorized'}
          </h2>
          <Link
            href={`/${locale}/consultations/dashboard`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-600 transition"
          >
            {isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', isAr && 'direction-rtl')}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/consultations/dashboard`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {isAr ? 'العودة' : 'Back'}
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-500" />
              <h1 className="text-xl font-bold text-gray-900">
                {isAr ? 'إدارة التوفر الأسبوعي' : 'Weekly Availability'}
              </h1>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 ml-16">
            {isAr
              ? 'حدد الأيام والأوقات التي تكون فيها متاحاً لاستقبال الحجوزات'
              : 'Set the days and times when you are available to accept bookings'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {profileQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {DAYS.map((day) => {
              const cfg = schedule[day.value];
              return (
                <div
                  key={day.value}
                  className={cn(
                    'rounded-2xl border bg-white p-5 transition',
                    cfg.enabled ? 'border-rose-200 shadow-sm' : 'border-gray-100',
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                          cfg.enabled ? 'bg-rose-500' : 'bg-gray-200',
                        )}
                        aria-pressed={cfg.enabled}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200',
                            cfg.enabled ? 'translate-x-5' : 'translate-x-0',
                          )}
                        />
                      </button>
                      <span className={cn('text-sm font-semibold', cfg.enabled ? 'text-gray-900' : 'text-gray-400')}>
                        {isAr ? day.ar : day.en}
                      </span>
                    </div>

                    {cfg.enabled && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={cfg.startTime}
                            onChange={(e) => updateTime(day.value, 'startTime', e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                          />
                          <span className="text-xs text-gray-400">{isAr ? 'إلى' : 'to'}</span>
                          <input
                            type="time"
                            value={cfg.endTime}
                            onChange={(e) => updateTime(day.value, 'endTime', e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200 transition"
                          />
                        </div>
                      </div>
                    )}

                    {!cfg.enabled && (
                      <span className="text-xs text-gray-400">{isAr ? 'غير متاح' : 'Unavailable'}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className="text-sm text-gray-500">
                {isAr ? 'الأيام المتاحة:' : 'Available days:'}{' '}
                <span className="font-medium text-gray-900">
                  {DAYS.filter((d) => schedule[d.value].enabled)
                    .map((d) => (isAr ? d.ar : d.en))
                    .join(', ') || (isAr ? 'لا شيء' : 'None')}
                </span>
              </p>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {isAr ? 'تم الحفظ!' : 'Saved!'}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-60 transition"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending
                  ? (isAr ? 'جاري الحفظ...' : 'Saving…')
                  : (isAr ? 'حفظ الجدول' : 'Save Schedule')}
              </button>
            </div>
          </motion.div>

          {/* C4: Vacation / Out-of-Office Blocking */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-1 text-base font-bold text-gray-900 flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-emerald-500" />
              {isAr ? 'أوقات الإجازة / خارج المكتب' : 'Vacation / Out-of-Office Blocks'}
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              {isAr
                ? 'أضف فترات الإجازة لتظهر كغير متاح فيها تلقائياً'
                : 'Block date ranges during which you will be unavailable for bookings'}
            </p>

            {/* Add vacation form */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end mb-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {isAr ? 'تاريخ البداية' : 'Start date'}
                </label>
                <input
                  type="date"
                  value={vacForm.startDate}
                  onChange={(e) => setVacForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {isAr ? 'تاريخ الانتهاء' : 'End date'}
                </label>
                <input
                  type="date"
                  value={vacForm.endDate}
                  min={vacForm.startDate}
                  onChange={(e) => setVacForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {isAr ? 'السبب (اختياري)' : 'Reason (optional)'}
                </label>
                <input
                  type="text"
                  value={vacForm.reason}
                  onChange={(e) => setVacForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder={isAr ? 'إجازة، مؤتمر...' : 'Vacation, conference…'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                />
              </div>
              <button
                disabled={!vacForm.startDate || !vacForm.endDate || blockVacMutation.isPending}
                onClick={() =>
                  blockVacMutation.mutate({
                    startDate: vacForm.startDate,
                    endDate: vacForm.endDate,
                    ...(vacForm.reason.trim() ? { reason: vacForm.reason.trim() } : {}),
                  })
                }
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>

            {/* Existing vacation blocks */}
            {vacationsQuery.isLoading ? (
              <p className="text-sm text-gray-400">{isAr ? 'جاري التحميل...' : 'Loading…'}</p>
            ) : !vacationsQuery.data?.length ? (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-400">
                {isAr ? 'لا توجد فترات إجازة محددة' : 'No vacation blocks set'}
              </p>
            ) : (
              <ul className="space-y-2">
                {vacationsQuery.data.map((v: { id: number; startDate: string; endDate: string; reason?: string }) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {v.startDate} → {v.endDate}
                      </p>
                      {v.reason && (
                        <p className="text-xs text-gray-500 mt-0.5">{v.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteVacMutation.mutate(v.id)}
                      disabled={deleteVacMutation.isPending}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isAr ? 'حذف' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
