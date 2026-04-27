'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Calendar,
  MessageSquare,
  XCircle,
  CheckCircle,
  CreditCard,
  Banknote,
  Home,
  RotateCcw,
  ChevronLeft,
  Check,
  Users,
  Sparkles,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  type: string;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  isRead: boolean;
  createdAt: string;
  dataJson?: Record<string, unknown> | null;
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  booking_request: { icon: <Calendar className="h-5 w-5" />, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  booking_confirmed: { icon: <CheckCircle className="h-5 w-5" />, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  booking_declined: { icon: <XCircle className="h-5 w-5" />, bg: 'bg-rose-50', text: 'text-rose-600' },
  booking_cancelled: { icon: <XCircle className="h-5 w-5" />, bg: 'bg-rose-50', text: 'text-rose-600' },
  payment_confirmed: { icon: <CreditCard className="h-5 w-5" />, bg: 'bg-violet-50', text: 'text-violet-600' },
  payout: { icon: <Banknote className="h-5 w-5" />, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  refund: { icon: <RotateCcw className="h-5 w-5" />, bg: 'bg-sky-50', text: 'text-sky-600' },
  new_message: { icon: <MessageSquare className="h-5 w-5" />, bg: 'bg-amber-50', text: 'text-amber-600' },
  host_activated: { icon: <Home className="h-5 w-5" />, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  cohost_invite: { icon: <Users className="h-5 w-5" />, bg: 'bg-violet-50', text: 'text-violet-600' },
  cleaning_scheduled: { icon: <Sparkles className="h-5 w-5" />, bg: 'bg-teal-50', text: 'text-teal-600' },
};

const DEFAULT_ICON = { icon: <Bell className="h-5 w-5" />, bg: 'bg-neutral-50', text: 'text-neutral-500' };

function getIcon(type: string) {
  return TYPE_ICON[type] ?? DEFAULT_ICON;
}

function timeAgo(dateStr: string, t: (key: string, values?: Record<string, number>) => string, locale: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return t('justNow');
  if (diff < 3600) return t('minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('hoursAgo', { count: Math.floor(diff / 3600) });
  if (diff < 604800) return t('daysAgo', { count: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(notifications: Notification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, Notification[]> = {};
  for (const n of notifications) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    let key: string;
    if (d.getTime() === today.getTime()) key = 'today';
    else if (d.getTime() === yesterday.getTime()) key = 'yesterday';
    else key = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

function getNotifRoute(n: Notification, locale: string): string | null {
  const data = (n.dataJson ?? {}) as Record<string, unknown>;
  switch (n.type) {
    case 'booking_request':
      return `/${locale}/hosting`;
    case 'booking_confirmed':
    case 'booking_declined':
    case 'booking_cancelled':
    case 'payment_confirmed':
    case 'refund':
      return `/${locale}/trips`;
    case 'payout':
      return `/${locale}/hosting`;
    case 'new_message':
      return `/${locale}/hosting/inbox`;
    case 'host_activated':
      return `/${locale}/hosting`;
    case 'cohost_invite':
    case 'cleaning_scheduled':
      return `/${locale}/hosting`;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const locale = useLocale();
  const t = useTranslations('notifications');
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Redirect unauthenticated users — must be in useEffect to avoid SSR issues
  // and to ensure all hooks above are always called unconditionally
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoggedIn, locale, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.getNotifications(page),
    staleTime: 30_000,
    enabled: isLoggedIn,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  // Render guard (after all hooks) — prevents rendering auth-only content client-side
  if (!isLoggedIn) return null;

  const notifications: Notification[] = (data as any)?.items ?? [];
  const totalPages: number = (data as any)?.totalPages ?? 1;
  const hasUnread = notifications.some((n) => !n.isRead);
  const grouped = groupByDate(notifications);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full p-2 text-neutral-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
              <p className="text-sm text-neutral-500 mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
          {hasUnread && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              {t('markAllRead')}
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 ring-4 ring-neutral-50">
              <BellOff className="h-9 w-9 text-neutral-400" strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-neutral-800">{t('noNotifications')}</h2>
            <p className="max-w-xs text-sm text-neutral-500 leading-relaxed">
              {t('noNotificationsDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {dateLabel === 'today' ? t('today') : dateLabel === 'yesterday' ? t('yesterday') : dateLabel}
                </p>
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
                  <AnimatePresence initial={false}>
                    {items.map((n) => {
                      const { icon, bg, text } = getIcon(n.type);
                      return (
                        <motion.div
                          key={n.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => {
                            if (!n.isRead) markReadMutation.mutate(n.id);
                            const route = getNotifRoute(n, locale);
                            if (route) router.push(route);
                          }}
                          className={cn(
                            'flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors',
                            n.isRead ? 'bg-white hover:bg-neutral-50' : 'bg-indigo-50/40 hover:bg-indigo-50/60',
                          )}
                        >
                          {/* Icon */}
                          <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', bg, text)}>
                            {icon}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-sm leading-snug', n.isRead ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900')}>
                                {locale === 'ar' && n.titleAr ? n.titleAr : n.title}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-neutral-400 whitespace-nowrap">{timeAgo(n.createdAt, t, locale)}</span>
                                {!n.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                )}
                              </div>
                            </div>
                            <p className="mt-0.5 text-sm text-neutral-500 line-clamp-2 leading-relaxed">{locale === 'ar' && n.bodyAr ? n.bodyAr : n.body}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('previous')}
                </button>
                <span className="text-sm text-neutral-500">
                  {t('pageOf', { page, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
