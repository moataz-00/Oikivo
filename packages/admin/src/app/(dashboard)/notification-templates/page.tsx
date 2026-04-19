'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { BellRing, Save, Smartphone, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Template {
  slug: string;
  type: 'push' | 'sms';
  name: string;
  title: string;
  body: string;
  enabled: boolean;
}

export default function NotificationTemplatesPage() {
  const queryClient = useQueryClient();
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; body: string; enabled: boolean }>({ title: '', body: '', enabled: true });
  const [filterType, setFilterType] = useState<'all' | 'push' | 'sms'>('all');

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['admin-notification-templates'],
    queryFn: () => adminApi.getNotificationTemplates(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<Template> }) =>
      adminApi.updateNotificationTemplate(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      setEditSlug(null);
      toast.success('Template updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update template'),
  });

  const filtered = (templates ?? []).filter((t) => filterType === 'all' || t.type === filterType);

  const startEdit = (t: Template) => {
    setEditSlug(t.slug);
    setEditForm({ title: t.title, body: t.body, enabled: t.enabled });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Templates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage push notification and SMS templates for automated messages</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'push', 'sms'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filterType === t
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {t === 'all' ? 'All' : t === 'push' ? 'Push Notifications' : 'SMS'}
            {templates && (
              <span className="ml-1 opacity-60">
                ({t === 'all' ? templates.length : templates.filter((x) => x.type === t).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BellRing className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const isEditing = editSlug === t.slug;
            return (
              <div key={t.slug} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {t.type === 'push'
                      ? <Bell className="h-4 w-4 text-indigo-400" />
                      : <Smartphone className="h-4 w-4 text-emerald-400" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{t.slug}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium',
                    (isEditing ? editForm.enabled : t.enabled)
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-red-900/50 text-red-400'
                  )}>
                    {(isEditing ? editForm.enabled : t.enabled) ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    {t.type === 'push' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Title</label>
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Body</label>
                      <textarea
                        value={editForm.body}
                        onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use {'{{name}}'}, {'{{amount}}'}, {'{{date}}'} etc. as placeholders</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                        className="rounded border-gray-400"
                      />
                      <span className="text-xs text-gray-500">Enabled</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => updateMutation.mutate({ slug: t.slug, data: editForm })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {updateMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditSlug(null)}
                        className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {t.type === 'push' && (
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.title}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t.body}</p>
                    <button
                      onClick={() => startEdit(t)}
                      className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Edit template
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
