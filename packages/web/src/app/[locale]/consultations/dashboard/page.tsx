'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star, Clock, Video, Calendar, TrendingUp,
  MessageSquare, CheckCircle, XCircle, AlertCircle,
  Settings, BookOpen, Briefcase, User, ChevronRight,
  DollarSign, Activity, Users, Send, Flag, Target, Wallet,
} from 'lucide-react';
import { consultationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-gray-50 text-gray-500 border-gray-200',
  in_progress:'bg-purple-50 text-purple-700 border-purple-200',
};
const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending:    { en: 'Pending', ar: 'بانتظار القبول' },
  confirmed:  { en: 'Confirmed', ar: 'مؤكد' },
  completed:  { en: 'Completed', ar: 'مكتمل' },
  cancelled:  { en: 'Cancelled', ar: 'ملغي' },
  in_progress:{ en: 'In Progress', ar: 'جارٍ' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className={cn('mb-3 inline-flex rounded-xl p-2.5', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </motion.div>
  );
}

function BookingRow({
  booking,
  isAr,
  onRespond,
}: {
  booking: any;
  isAr: boolean;
  onRespond: (id: number, action: 'confirmed' | 'cancelled', meetingLink?: string) => void;
}) {
  const scheduledAt = new Date(booking.scheduledAt);
  const serviceName = isAr && booking.service?.titleAr
    ? booking.service.titleAr
    : booking.service?.title ?? '—';
  const clientName =
    booking.client?.firstName
      ? `${booking.client.firstName} ${booking.client.lastName ?? ''}`
      : booking.client?.email ?? '—';

  const [showConfirm, setShowConfirm] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
      <td className="py-3.5 pl-4 pr-3 text-sm">
        <div className="font-medium text-gray-900">{clientName}</div>
        <div className="text-xs text-gray-400">{serviceName}</div>
      </td>
      <td className="px-3 py-3.5 text-sm text-gray-500">
        <div>
          {scheduledAt.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </div>
        <div className="text-xs text-gray-400">
          {scheduledAt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
            hour: '2-digit', minute: '2-digit',
          })}
        </div>
      </td>
      <td className="px-3 py-3.5 text-sm">
        <span
          className={cn(
            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
            STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending,
          )}
        >
          {isAr
            ? STATUS_LABELS[booking.status]?.ar
            : STATUS_LABELS[booking.status]?.en}
        </span>
      </td>
      <td className="px-3 py-3.5 text-right text-sm font-medium text-gray-700">
        {booking.currency} {Number(booking.consultantPayout).toLocaleString()}
      </td>
      <td className="py-3.5 pl-3 pr-4 text-right text-sm">
        {booking.status === 'pending' && !showConfirm && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 transition"
            >
              {isAr ? 'قبول' : 'Accept'}
            </button>
            <button
              onClick={() => onRespond(booking.id, 'cancelled')}
              className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition"
            >
              {isAr ? 'رفض' : 'Decline'}
            </button>
          </div>
        )}
        {booking.status === 'pending' && showConfirm && (
          <div className="flex flex-col items-end gap-1.5">
            <input
              type="url"
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
              placeholder={isAr ? 'رابط الاجتماع (اختياري)' : 'Meeting link (optional)'}
              className="w-48 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-rose-400 focus:outline-none"
            />
            <div className="flex gap-1">
              <button
                onClick={() => { setShowConfirm(false); setMeetingLinkInput(''); }}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => onRespond(booking.id, 'confirmed', meetingLinkInput.trim() || undefined)}
                className="rounded-lg bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600 transition"
              >
                {isAr ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
        {booking.status === 'confirmed' && (
          <span className="text-xs text-blue-600 font-medium">
            {isAr ? 'بانتظار الجلسة' : 'Session upcoming'}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function ConsultantDashboardPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { isLoggedIn, isConsultant, hasHydrated, user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'payouts'>('overview');

  const statsQuery = useQuery({
    queryKey: ['consultant-stats'],
    queryFn: () => consultationsApi.getMyStats(),
    enabled: hasHydrated && isLoggedIn && isConsultant,
  });

  // C6: Profile completion
  const profileQuery = useQuery({
    queryKey: ['my-consultant-profile'],
    queryFn: () => consultationsApi.getMyProfile(),
    enabled: hasHydrated && isLoggedIn && isConsultant,
  });

  const bookingsQuery = useQuery({
    queryKey: ['consultant-bookings'],
    queryFn: () => consultationsApi.getConsultantBookings({ limit: 30 }),
    enabled: hasHydrated && isLoggedIn && isConsultant && activeTab === 'bookings',
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action, meetingLink }: { id: number; action: 'confirmed' | 'cancelled'; meetingLink?: string }) =>
      consultationsApi.respondBooking(id, action, meetingLink ? { meetingLink } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultant-stats'] });
      qc.invalidateQueries({ queryKey: ['consultant-bookings'] });
    },
  });

  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) =>
      consultationsApi.replyToReview(reviewId, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultant-stats'] });
    },
  });

  // C7: Review flagging
  const [flagState, setFlagState] = useState<{ reviewId: number; reason: string } | null>(null);
  const flagMutation = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: number; reason: string }) =>
      consultationsApi.flagReview(reviewId, reason),
    onSuccess: () => setFlagState(null),
  });

  // C12: Earnings & payout state
  const earningsQuery = useQuery({
    queryKey: ['my-earnings'],
    queryFn: () => consultationsApi.getMyEarnings(),
    enabled: hasHydrated && isLoggedIn && isConsultant && activeTab === 'payouts',
  });
  const payoutRequestsQuery = useQuery({
    queryKey: ['my-payout-requests'],
    queryFn: () => consultationsApi.getMyPayoutRequests(),
    enabled: hasHydrated && isLoggedIn && isConsultant && activeTab === 'payouts',
  });
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'instapay', accountDetails: '' });
  const [payoutSettingsForm, setPayoutSettingsForm] = useState({ method: 'instapay', accountDetails: '' });
  const requestPayoutMutation = useMutation({
    mutationFn: (data: { amount: number; method: string; accountDetails: string }) =>
      consultationsApi.requestPayout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-earnings'] });
      qc.invalidateQueries({ queryKey: ['my-payout-requests'] });
      setPayoutForm({ amount: '', method: 'instapay', accountDetails: '' });
    },
  });
  const savePayoutSettingsMutation = useMutation({
    mutationFn: (data: { method: string; accountDetails: string }) =>
      consultationsApi.updatePayoutSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-consultant-profile'] }),
  });

  // C6: Profile completion computation
  const profileData = profileQuery.data as any;
  const completionFields = profileData
    ? [
        { done: !!profileData.consultant?.displayName, label: isAr ? 'الاسم المعروض' : 'Display name' },
        { done: !!profileData.consultant?.bio, label: isAr ? 'نبذة شخصية' : 'Bio' },
        { done: (profileData.consultant?.specializations?.length ?? 0) > 0, label: isAr ? 'التخصصات' : 'Specializations' },
        { done: (profileData.consultant?.languages?.length ?? 0) > 0, label: isAr ? 'اللغات' : 'Languages' },
        { done: Number(profileData.consultant?.hourlyRate ?? 0) > 0, label: isAr ? 'السعر الساعي' : 'Hourly rate' },
        { done: (profileData.availability?.length ?? 0) > 0, label: isAr ? 'جدول التوفر' : 'Availability set' },
        { done: (profileData.consultant?.documents?.length ?? 0) > 0, label: isAr ? 'وثائق مرفوعة' : 'Documents uploaded' },
      ]
    : [];
  const profilePct = completionFields.length
    ? Math.round((completionFields.filter((f) => f.done).length / completionFields.length) * 100)
    : 0;

  // ── Auth guard ────────────────────────────────────────────
  if (hasHydrated && !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <User className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            {isAr ? 'تسجيل الدخول مطلوب' : 'Sign In Required'}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {isAr ? 'يجب تسجيل الدخول للوصول إلى لوحة التحكم' : 'Please sign in to view your dashboard'}
          </p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600 transition"
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </div>
      </div>
    );
  }

  if (hasHydrated && isLoggedIn && !isConsultant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Briefcase className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            {isAr ? 'لست مستشاراً بعد' : 'Not a Consultant Yet'}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {isAr
              ? 'تقدّم بطلب الانضمام كمستشار وانتظر موافقة الفريق'
              : 'Apply to join as a consultant and wait for team approval'}
          </p>
          <Link
            href={`/${locale}/consultations/apply`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600 transition"
          >
            {isAr ? 'تقدّم الآن' : 'Apply Now'}
          </Link>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data?.overview;
  const upcoming = statsQuery.data?.upcomingBookings ?? [];
  const recentReviews = statsQuery.data?.recentReviews ?? [];

  return (
    <div className={cn('min-h-screen bg-gray-50', isAr && 'direction-rtl')}>
      {/* C7: Flag review modal */}
      {flagState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFlagState(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-base font-bold text-gray-900">
              {isAr ? 'الإبلاغ عن التقييم' : 'Flag Review'}
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              {isAr
                ? 'أخبرنا سبب الإبلاغ عن هذا التقييم وسيراجعه فريقنا'
                : 'Tell us why you\'re flagging this review and our team will investigate'}
            </p>
            <textarea
              rows={3}
              value={flagState.reason}
              onChange={(e) => setFlagState((s) => s ? { ...s, reason: e.target.value } : null)}
              placeholder={isAr ? 'ادخل السبب...' : 'Describe the issue…'}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
            />
            {flagMutation.isError && (
              <p className="mt-1 text-xs text-red-500">
                {isAr ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again'}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setFlagState(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={!flagState.reason.trim() || flagMutation.isPending}
                onClick={() => flagMutation.mutate({ reviewId: flagState.reviewId, reason: flagState.reason })}
                className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50 transition"
              >
                {flagMutation.isPending ? '…' : (isAr ? 'إرسال البلاغ' : 'Submit Flag')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Header ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAr ? 'لوحة المستشار' : 'Consultant Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isAr
                  ? 'مرحباً بك، إليك نظرة عامة على نشاطك'
                  : `Welcome back${user ? `, ${(user as any).firstName ?? ''}` : ''}! Here's your activity overview.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/consultations/availability`}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition"
              >
                <Calendar className="h-4 w-4" />
                {isAr ? 'إدارة التوفر' : 'Manage Availability'}
              </Link>
              <Link
                href={`/${locale}/consultations/services`}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <Briefcase className="h-4 w-4" />
                {isAr ? 'إدارة الخدمات' : 'My Services'}
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-transparent">
            {(['overview', 'bookings', 'reviews', 'payouts'] as const).map((tab) => {
              const labels = {
                overview: { en: 'Overview', ar: 'نظرة عامة' },
                bookings: { en: 'Bookings', ar: 'الحجوزات' },
                reviews:  { en: 'Reviews', ar: 'التقييمات' },
                payouts:  { en: 'Earnings', ar: 'الأرباح' },
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition rounded-t-lg',
                    activeTab === tab
                      ? 'bg-rose-50 text-rose-600 border-b-2 border-rose-500'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {isAr ? labels[tab].ar : labels[tab].en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

            {/* C6: Profile completion bar */}
            {profileData && profilePct < 100 && (
              <motion.div variants={fadeUp} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-amber-800">
                      {isAr ? 'اكتمال الملف الشخصي' : 'Profile Completion'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">{profilePct}%</span>
                </div>
                <div className="w-full rounded-full bg-amber-200 h-2.5 mb-3">
                  <div
                    className="rounded-full bg-amber-500 h-2.5 transition-all duration-700"
                    style={{ width: `${profilePct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {completionFields.filter((f) => !f.done).map((f) => (
                    <span key={f.label} className="rounded-full bg-white border border-amber-300 px-2.5 py-0.5 text-xs text-amber-700">
                      ✗ {f.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Stats cards */}
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatCard icon={Activity}     color="bg-blue-50 text-blue-600"      label={isAr ? 'إجمالي الجلسات' : 'Total Sessions'}    value={stats?.totalSessions ?? 0} />
                <StatCard icon={AlertCircle}  color="bg-amber-50 text-amber-600"    label={isAr ? 'طلبات جديدة' : 'Pending Requests'}    value={stats?.pendingCount ?? 0} />
                <StatCard icon={CheckCircle}  color="bg-green-50 text-green-600"    label={isAr ? 'جلسات مؤكدة' : 'Confirmed'}           value={stats?.confirmedCount ?? 0} />
                <StatCard icon={DollarSign}   color="bg-emerald-50 text-emerald-600" label={isAr ? 'إجمالي الأرباح' : 'Total Earnings'}   value={`EGP ${(stats?.totalEarnings ?? 0).toLocaleString()}`} />
                <StatCard icon={Star}         color="bg-yellow-50 text-yellow-600"  label={isAr ? 'متوسط التقييم' : 'Avg Rating'}         value={stats?.avgRating ? stats.avgRating.toFixed(1) : '—'} />
                <StatCard icon={Users}        color="bg-purple-50 text-purple-600"  label={isAr ? 'عدد التقييمات' : 'Reviews'}            value={stats?.reviewCount ?? 0} />
                <StatCard icon={Target}       color="bg-rose-50 text-rose-600"      label={isAr ? 'معدل الإتمام' : 'Completion Rate'}     value={stats?.completionRate != null ? `${stats.completionRate}%` : '—'} />
                <StatCard icon={Clock}        color="bg-indigo-50 text-indigo-600"  label={isAr ? 'الساعة الأكثر طلباً' : 'Peak Hour'}    value={stats?.busiestHour != null ? `${stats.busiestHour}:00` : '—'} />
              </div>
            )}

            {/* C3: Monthly earnings bar chart */}
            {(stats?.earningsByMonth ?? []).length > 0 && (
              <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    {isAr ? 'الأرباح الشهرية (آخر 6 أشهر)' : 'Monthly Earnings (last 6 months)'}
                  </h2>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-end gap-2 h-32">
                  {(() => {
                    const months: { month: string; earnings: number }[] = stats?.earningsByMonth ?? [];
                    const maxVal = Math.max(...months.map((m) => m.earnings), 1);
                    return months.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-emerald-400 transition-all duration-500"
                          style={{ height: `${Math.max((m.earnings / maxVal) * 100, 4)}%` }}
                          title={`EGP ${m.earnings.toLocaleString()}`}
                        />
                        <span className="text-xs text-gray-400 truncate w-full text-center">
                          {m.month.slice(5)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </motion.div>
            )}

            {/* Upcoming bookings */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  {isAr ? 'الجلسات القادمة' : 'Upcoming Sessions'}
                </h2>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600"
                >
                  {isAr ? 'عرض الكل' : 'View all'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {upcoming.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  {isAr ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="py-3 pl-4 pr-3 text-left font-medium">{isAr ? 'العميل' : 'Client'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الموعد' : 'Date & Time'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="px-3 py-3 text-right font-medium">{isAr ? 'أرباحك' : 'Your Payout'}</th>
                        <th className="py-3 pl-3 pr-4 text-right font-medium">{isAr ? 'إجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map((b: any) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          isAr={isAr}
                          onRespond={(id, action, meetingLink) => respondMutation.mutate({ id, action, meetingLink })}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Recent reviews */}
            {recentReviews.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {isAr ? 'أحدث التقييمات' : 'Recent Reviews'}
                  </h2>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600"
                  >
                    {isAr ? 'عرض الكل' : 'View all'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {recentReviews.map((r: any) => (
                    <div key={r.id} className="flex gap-3 rounded-xl bg-gray-50 p-4">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                        {r.reviewer?.firstName?.[0] ?? 'G'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {r.reviewer?.firstName ?? 'Guest'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star
                                key={s}
                                className={cn('h-3 w-3', s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300')}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="mt-1 text-sm text-gray-500">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick actions */}
            <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: isAr ? 'خدماتي' : 'My Services',
                  desc: isAr ? 'أضف أو عدّل باقات الاستشارة' : 'Add or edit your consultation packages',
                  href: `/${locale}/consultations/services`,
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  icon: Calendar,
                  title: isAr ? 'جدولي الأسبوعي' : 'My Schedule',
                  desc: isAr ? 'حدد أيام وأوقات توفرك' : 'Set your available days and hours',
                  href: `/${locale}/consultations/availability`,
                  color: 'text-green-600 bg-green-50',
                },
                {
                  icon: User,
                  title: isAr ? 'ملفي الشخصي' : 'My Profile',
                  desc: isAr ? 'حدّث بيانات ووثائق ملفك' : 'Update your bio, specializations & docs',
                  href: `/${locale}/consultations/my-profile`,
                  color: 'text-purple-600 bg-purple-50',
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                >
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', action.color)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-rose-600 transition">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-400">{action.desc}</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-rose-400 transition" />
                </Link>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  {isAr ? 'جميع الحجوزات' : 'All Bookings'}
                </h2>
              </div>

              {bookingsQuery.isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  {isAr ? 'جاري التحميل...' : 'Loading…'}
                </div>
              ) : (bookingsQuery.data?.data?.length ?? 0) === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  {isAr ? 'لا توجد حجوزات حتى الآن' : 'No bookings yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="py-3 pl-4 pr-3 text-left font-medium">{isAr ? 'العميل' : 'Client'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الموعد' : 'Date & Time'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="px-3 py-3 text-right font-medium">{isAr ? 'أرباحك' : 'Your Payout'}</th>
                        <th className="py-3 pl-3 pr-4 text-right font-medium">{isAr ? 'إجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bookingsQuery.data?.data ?? []).map((b: any) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          isAr={isAr}
                          onRespond={(id, action, meetingLink) => respondMutation.mutate({ id, action, meetingLink })}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── Payouts Tab ── */}
        {activeTab === 'payouts' && (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

            {/* Balance summary cards */}
            {earningsQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">{isAr ? 'محتجز' : 'On Hold'}</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-800">
                    {earningsQuery.data?.currency ?? 'EGP'} {Number(earningsQuery.data?.holdBalance ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">{isAr ? 'يُحرر خلال 48 ساعة من اكتمال الجلسة' : 'Released 48h after session completion'}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{isAr ? 'متاح للسحب' : 'Available'}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">
                    {earningsQuery.data?.currency ?? 'EGP'} {Number(earningsQuery.data?.availableBalance ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">{isAr ? 'جاهز للسحب الآن' : 'Ready to withdraw'}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">{isAr ? 'إجمالي ما استلمته' : 'Lifetime Paid'}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">
                    {earningsQuery.data?.currency ?? 'EGP'} {Number(earningsQuery.data?.lifetimePaid ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{isAr ? 'مجموع المدفوعات المُتمّة' : 'Total completed payouts'}</p>
                </div>
              </motion.div>
            )}

            {/* Request payout form */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{isAr ? 'طلب سحب الأرباح' : 'Request Payout'}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'المبلغ (EGP)' : 'Amount (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'طريقة الدفع' : 'Method'}
                  </label>
                  <select
                    value={payoutForm.method}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, method: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                  >
                    <option value="instapay">InstaPay</option>
                    <option value="bank_transfer">{isAr ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isAr ? 'رقم الحساب / الهاتف' : 'Account / Phone'}
                  </label>
                  <input
                    type="text"
                    value={payoutForm.accountDetails}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, accountDetails: e.target.value }))}
                    placeholder={isAr ? 'أدخل تفاصيل الحساب' : 'Enter account details'}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                  />
                </div>
              </div>
              {requestPayoutMutation.isError && (
                <p className="mt-2 text-xs text-red-500">{isAr ? 'حدث خطأ. تحقق من الرصيد المتاح.' : 'Error — check your available balance.'}</p>
              )}
              {requestPayoutMutation.isSuccess && (
                <p className="mt-2 text-xs text-green-600">{isAr ? 'تم إرسال طلب السحب بنجاح!' : 'Payout request submitted!'}</p>
              )}
              <button
                disabled={!payoutForm.amount || !payoutForm.accountDetails || requestPayoutMutation.isPending}
                onClick={() => requestPayoutMutation.mutate({
                  amount: Number(payoutForm.amount),
                  method: payoutForm.method,
                  accountDetails: payoutForm.accountDetails,
                })}
                className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50 transition"
              >
                <Wallet className="h-4 w-4" />
                {requestPayoutMutation.isPending
                  ? (isAr ? '...' : '…')
                  : (isAr ? 'تقديم طلب السحب' : 'Submit Payout Request')}
              </button>
            </motion.div>

            {/* Payout settings */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-1">{isAr ? 'إعدادات الدفع المفضلة' : 'Preferred Payout Settings'}</h3>
              <p className="text-xs text-gray-400 mb-4">{isAr ? 'احفظ طريقة الدفع الافتراضية لاستخدامها في طلبات السحب' : 'Save your default method so it pre-fills on future requests'}</p>
              <div className="flex flex-wrap gap-3">
                <select
                  value={payoutSettingsForm.method}
                  onChange={(e) => setPayoutSettingsForm((f) => ({ ...f, method: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                >
                  <option value="instapay">InstaPay</option>
                  <option value="bank_transfer">{isAr ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                </select>
                <input
                  type="text"
                  value={payoutSettingsForm.accountDetails}
                  onChange={(e) => setPayoutSettingsForm((f) => ({ ...f, accountDetails: e.target.value }))}
                  placeholder={isAr ? 'رقم الحساب / الهاتف' : 'Account / Phone'}
                  className="flex-1 min-w-36 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none"
                />
                <button
                  disabled={!payoutSettingsForm.accountDetails || savePayoutSettingsMutation.isPending}
                  onClick={() => savePayoutSettingsMutation.mutate(payoutSettingsForm)}
                  className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  {savePayoutSettingsMutation.isPending
                    ? '…'
                    : savePayoutSettingsMutation.isSuccess
                      ? (isAr ? 'تم الحفظ ✓' : 'Saved ✓')
                      : (isAr ? 'حفظ' : 'Save')}
                </button>
              </div>
            </motion.div>

            {/* Payout history */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="font-semibold text-gray-900">{isAr ? 'سجل طلبات السحب' : 'Payout History'}</h3>
              </div>
              {payoutRequestsQuery.isLoading ? (
                <div className="py-10 text-center text-sm text-gray-400">{isAr ? 'جاري التحميل...' : 'Loading…'}</div>
              ) : (payoutRequestsQuery.data?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">{isAr ? 'لا توجد طلبات سحب بعد' : 'No payout requests yet'}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="py-3 pl-4 pr-3 text-left font-medium">#</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'المبلغ' : 'Amount'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الطريقة' : 'Method'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="px-3 py-3 text-left font-medium">{isAr ? 'الملاحظة' : 'Note'}</th>
                        <th className="py-3 pl-3 pr-4 text-left font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payoutRequestsQuery.data ?? []).map((pr: any) => {
                        const psBadge: Record<string, string> = {
                          pending:    'bg-amber-50 text-amber-700 border-amber-200',
                          processing: 'bg-blue-50 text-blue-700 border-blue-200',
                          completed:  'bg-green-50 text-green-700 border-green-200',
                          failed:     'bg-red-50 text-red-700 border-red-200',
                        };
                        const psLabel: Record<string, { en: string; ar: string }> = {
                          pending:    { en: 'Pending', ar: 'بانتظار المعالجة' },
                          processing: { en: 'Processing', ar: 'جاري التحويل' },
                          completed:  { en: 'Completed', ar: 'تم التحويل' },
                          failed:     { en: 'Failed', ar: 'فشل' },
                        };
                        return (
                          <tr key={pr.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                            <td className="py-3 pl-4 pr-3 text-xs text-gray-400">#{pr.id}</td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900">
                              {pr.currency} {Number(pr.amount).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-500">
                              {pr.method === 'instapay' ? 'InstaPay' : (isAr ? 'بنكي' : 'Bank')}
                            </td>
                            <td className="px-3 py-3">
                              <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', psBadge[pr.status] ?? psBadge.pending)}>
                                {isAr ? psLabel[pr.status]?.ar : psLabel[pr.status]?.en}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-400 max-w-xs truncate">{pr.note ?? '—'}</td>
                            <td className="py-3 pl-3 pr-4 text-xs text-gray-400">
                              {new Date(pr.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === 'reviews' && (
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="space-y-4">
              {recentReviews.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center text-sm text-gray-400">
                  {isAr ? 'لا توجد تقييمات حتى الآن' : 'No reviews yet'}
                </div>
              ) : (
                recentReviews.map((r: any) => (
                  <motion.div
                    key={r.id}
                    variants={fadeUp}
                    className="rounded-2xl border border-gray-100 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                          {r.reviewer?.firstName?.[0] ?? 'G'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {r.reviewer?.firstName ?? 'Guest'} {r.reviewer?.lastName ?? ''}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'h-4 w-4',
                                s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
                              )}
                            />
                          ))}
                        </div>
                        <button
                          title={isAr ? 'الإبلاغ عن التقييم' : 'Flag review'}
                          onClick={() => setFlagState({ reviewId: r.id, reason: '' })}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-400 hover:border-rose-200 hover:text-rose-500 transition"
                        >
                          <Flag className="h-3 w-3" />
                          {isAr ? 'إبلاغ' : 'Flag'}
                        </button>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-sm text-gray-600">{r.comment}</p>
                    )}
                    {r.consultantReply ? (
                      <div className="mt-3 rounded-xl bg-gray-50 p-3 border-l-4 border-rose-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {isAr ? 'ردّك:' : 'Your reply:'}
                        </p>
                        <p className="text-sm text-gray-700">{r.consultantReply}</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <textarea
                          rows={2}
                          value={replyDrafts[r.id] ?? ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                          placeholder={isAr ? 'اكتب ردّك على هذا التقييم...' : 'Write a reply to this review…'}
                          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 transition"
                        />
                        <button
                          disabled={!replyDrafts[r.id]?.trim() || replyMutation.isPending}
                          onClick={() => {
                            const reply = replyDrafts[r.id]?.trim();
                            if (!reply) return;
                            replyMutation.mutate(
                              { reviewId: r.id, reply },
                              { onSuccess: () => setReplyDrafts((prev) => { const n = { ...prev }; delete n[r.id]; return n; }) },
                            );
                          }}
                          className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 hover:bg-rose-600 transition"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isAr ? 'إرسال الرد' : 'Post Reply'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
