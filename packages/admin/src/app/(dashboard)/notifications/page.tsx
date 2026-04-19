'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  Bell,
  Send,
  Users,
  Building2,
  Globe,
  Info,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type NotifType = 'info' | 'warning' | 'promo';
type AudienceType = 'all' | 'hosts' | 'guests';

const AUDIENCE_OPTIONS: { value: AudienceType; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All Users', icon: Globe },
  { value: 'hosts', label: 'Hosts Only', icon: Building2 },
  { value: 'guests', label: 'Guests Only', icon: Users },
];

const TYPE_OPTIONS: { value: NotifType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-sky-400 bg-sky-900/30 border-sky-800/50' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-400 bg-amber-900/30 border-amber-800/50' },
  { value: 'promo', label: 'Promotion', icon: Megaphone, color: 'text-violet-400 bg-violet-900/30 border-violet-800/50' },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'send' | 'history'>('send');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_LIMIT = 25;

  // Send form state
  const [audience, setAudience] = useState<AudienceType>('all');
  const [type, setType] = useState<NotifType>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const historyQuery = useQuery({
    queryKey: ['admin-notifications-history', historyPage],
    queryFn: () => adminApi.getNotificationsHistory({ page: historyPage, limit: HISTORY_LIMIT }),
    enabled: tab === 'history',
    retry: false,
    placeholderData: (prev) => prev,
  });

  const sendMutation = useMutation({
    mutationFn: adminApi.sendNotificationBlast,
    onSuccess: () => {
      toast.success('Notification sent successfully');
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-history'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send notification');
    },
  });

  function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    sendMutation.mutate({ audience, type, title: title.trim(), message: message.trim() });
  }

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;
  const charCount = message.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Send platform announcements and view notification history</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { key: 'send', label: 'Send Notification', icon: Send },
          { key: 'history', label: 'History', icon: Clock },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Compose form */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Compose Notification</h2>

            {/* Audience */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                Target Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAudience(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all',
                      audience === opt.value
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-600 hover:text-gray-300',
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                Notification Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                      type === opt.value
                        ? opt.color
                        : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-600 hover:text-gray-300',
                    )}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Title
                </label>
                <span className={cn('text-xs', title.length > 80 ? 'text-amber-400' : 'text-gray-600')}>
                  {title.length}/100
                </span>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Message
                </label>
                <span className={cn('text-xs', charCount > 450 ? 'text-amber-400' : 'text-gray-600')}>
                  {charCount}/500
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message to users..."
                maxLength={500}
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sendMutation.isPending || !title.trim() || !message.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Preview</h2>
            <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', selectedType.color)}>
                  <selectedType.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sakan Admin</p>
                  <p className="text-xs text-gray-600">Just now</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{title || 'Your notification title'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {message || 'Your notification message will appear here...'}
              </p>
            </div>

            <div className="mt-5 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-700/50 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sending to:</p>
              <div className="flex items-center gap-2">
                {(() => { const a = AUDIENCE_OPTIONS.find((o) => o.value === audience)!; return <><a.icon className="h-4 w-4 text-indigo-400" /><span className="text-sm text-gray-900 dark:text-white">{a.label}</span></>; })()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <selectedType.icon className={cn('h-4 w-4', selectedType.color.split(' ')[0])} />
                <span className="text-sm text-gray-900 dark:text-white">{selectedType.label} notification</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-600">
              Note: Notifications require the backend <code className="text-gray-500">/admin/notifications/blast</code> endpoint to be implemented.
              The form is fully functional once that endpoint exists.
            </p>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Notification History</h2>
          {historyQuery.isLoading && (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}
            </div>
          )}
          {historyQuery.isError && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Notification history endpoint not yet available.</p>
              <p className="text-gray-600 text-xs">Implement <code>GET /admin/notifications</code> on the backend to enable this feature.</p>
            </div>
          )}
          {historyQuery.data && (historyQuery.data as any)?.items?.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Bell className="h-8 w-8 text-gray-700" />
              <p className="text-gray-500 text-sm">No notifications sent yet.</p>
            </div>
          )}
          {historyQuery.data && ((historyQuery.data as any)?.items?.length ?? 0) > 0 && (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {((historyQuery.data as any).items as any[]).map((n: any) => {
                const typeOpt = TYPE_OPTIONS.find((t) => t.value === n.type) ?? TYPE_OPTIONS[0];
                return (
                  <div key={n.id} className="py-4 flex items-start gap-3">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', typeOpt.color)}>
                      <typeOpt.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                        <span className="text-xs text-gray-600">{n.audience}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                      <p className="text-xs text-gray-600 mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Pagination */}
          {historyQuery.data && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-3 text-sm text-gray-500 dark:text-gray-400 mt-3">
              <span>Page {historyPage} of {(historyQuery.data as any)?.totalPages ?? 1}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage((p) => p - 1)}
                  className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  &lsaquo; Prev
                </button>
                <span className="text-gray-900 dark:text-white font-medium">Page {historyPage}</span>
                <button
                  disabled={historyPage >= ((historyQuery.data as any)?.totalPages ?? 1)}
                  onClick={() => setHistoryPage((p) => p + 1)}
                  className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Next &rsaquo;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
