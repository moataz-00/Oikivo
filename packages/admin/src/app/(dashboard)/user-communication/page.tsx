'use client';

import { useState, useRef, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import DOMPurify from 'dompurify';
import {
  Mail,
  Send,
  Users,
  AlertTriangle,
  Eye,
  X,
  Check,
  ChevronDown,
  Bold,
  Italic,
  Heading2,
  Link2,
  List,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Audience = 'all' | 'hosts' | 'guests';

const AUDIENCE_OPTIONS: { value: Audience; label: string; desc: string; color: string }[] = [
  { value: 'all',    label: 'All Users',   desc: 'Every registered user on the platform', color: 'text-indigo-400' },
  { value: 'hosts',  label: 'Hosts Only',  desc: 'Users who have at least one listing',   color: 'text-amber-400'  },
  { value: 'guests', label: 'Guests Only', desc: 'Users who have made at least one booking', color: 'text-sky-400' },
];

export default function UserCommunicationPage() {
  const { user } = useAuthStore();
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selected = AUDIENCE_OPTIONS.find((o) => o.value === audience)!;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;
  // UC-1: sanitize HTML before rendering in preview to prevent XSS
  const sanitizedBody = useMemo(
    () => (typeof window !== 'undefined' ? DOMPurify.sanitize(body, { USE_PROFILES: { html: true } }) : ''),
    [body],
  );

  const canSend = subject.trim().length >= 3 && body.trim().length >= 10;

  function insertHtml(before: string, after = '', placeholder = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + before.length + selected.length + after.length;
      ta.setSelectionRange(cursor, cursor);
    });
  }

  const TOOLBAR = [
    { icon: Bold,     title: 'Bold',          action: () => insertHtml('<strong>', '</strong>', 'bold text') },
    { icon: Italic,   title: 'Italic',        action: () => insertHtml('<em>', '</em>', 'italic text') },
    { icon: Heading2, title: 'Heading',       action: () => insertHtml('<h2>', '</h2>', 'Heading') },
    { icon: Link2,    title: 'Link',          action: () => insertHtml('<a href="https://">', '</a>', 'link text') },
    { icon: List,     title: 'Bullet list',   action: () => insertHtml('<ul>\n  <li>', '</li>\n</ul>', 'item') },
  ];

  const blast = useMutation({
    mutationFn: () => adminApi.sendEmailBlast({ subject, body: sanitizedBody, audience }),
    onSuccess: () => {
      toast.success(`Email blast sent to ${selected.label.toLowerCase()}`);
      setShowConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send email blast');
      setShowConfirm(false);
    },
  });

  const testSend = useMutation({
    mutationFn: () => {
      const email = user?.email?.trim();
      if (!email) throw new Error('No email on your account');
      return adminApi.sendTestEmail({ subject, body: sanitizedBody, recipientEmail: email });
    },
    onSuccess: () => toast.success(`Test email sent to ${user?.email}`),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to send test email'),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Communication</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Compose and send an email to a specific audience on the platform
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-700/40 bg-amber-900/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300">
          Emails are delivered directly to user inboxes. Sending a blast is <strong>irreversible</strong>.
          Preview your message before sending.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Compose form ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Compose</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Audience selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Audience
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAudienceOpen((o) => !o)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className={cn('font-medium', selected.color)}>{selected.label}</span>
                    <span className="text-gray-500 text-xs">— {selected.desc}</span>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform', audienceOpen && 'rotate-180')} />
                </button>

                {audienceOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-xl overflow-hidden">
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setAudience(opt.value); setAudienceOpen(false); }}
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-start gap-3',
                          audience === opt.value && 'bg-gray-700/50',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', opt.color)}>{opt.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                        </div>
                        {audience === opt.value && (
                          <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="e.g. Important update from the Sakan team"
                className={cn(
                  'w-full rounded-lg border bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2',
                  subject.trim().length > 0 && subject.trim().length < 3
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500',
                )}
              />
              {subject.trim().length > 0 && subject.trim().length < 3 && (
                <p className="mt-1 text-xs text-red-400">Subject must be at least 3 characters</p>
              )}
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Message body <span className="text-red-400">*</span>
              </label>
              {/* Formatting toolbar */}
              <div className="flex flex-wrap gap-1 mb-1.5 rounded-t-lg border border-b-0 border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 px-1.5 py-1">
                {TOOLBAR.map(({ icon: Icon, title, action }) => (
                  <button
                    key={title}
                    type="button"
                    title={title}
                    onClick={action}
                    className="rounded p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={50000}
                placeholder="Write your message here. HTML is supported for rich formatting (e.g. <b>bold</b>, <a href='...'>links</a>)."
                className={cn(
                  'w-full rounded-b-lg border bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 resize-none font-mono',
                  body.trim().length > 0 && body.trim().length < 10
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500',
                )}
              />
              <div className="mt-1.5 flex items-center justify-between">
                {body.trim().length > 0 && body.trim().length < 10 ? (
                  <p className="text-xs text-red-400">Message must be at least 10 characters</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-600 ml-auto">
                  {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} chars
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  disabled={!canSend}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => testSend.mutate()}
                  disabled={!canSend || testSend.isPending || !user?.email?.trim()}
                  title={user?.email ? `Send test to ${user.email}` : 'No email on account'}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FlaskConical className="h-4 w-4" />
                  {testSend.isPending ? 'Sending…' : 'Test to myself'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={!canSend || blast.isPending}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Send Blast
              </button>
            </div>
          </div>
        </div>

        {/* ─── Live preview pane ───────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Live Preview</h2>
            <span className="ml-auto text-xs text-gray-600">Approximate rendering</span>
          </div>

          <div className="p-5">
            {!subject && !body ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
                <Mail className="h-10 w-10 opacity-30" />
                <p className="text-sm">Start typing to see a preview</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {/* Email preview header */}
                <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-4 text-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">🧭 Sakan</span>
                </div>
                <div className="px-6 py-5 bg-white">
                  {subject && (
                    <h3 className="text-base font-bold text-gray-900 mb-3">{subject}</h3>
                  )}
                  {body && (
                    <div
                      className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                    />
                  )}
                </div>
                <div className="bg-gray-50 px-5 py-3 text-center border-t border-gray-200">
                  <p className="text-xs text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Sakan, Inc.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Preview modal ─────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {/* Metadata */}
              <div className="mb-4 space-y-1 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800 pb-4">
                <p>
                  <span className="text-gray-500 dark:text-gray-400 font-medium w-16 inline-block">To:</span>
                  <span className={selected.color}>{selected.label}</span>
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400 font-medium w-16 inline-block">Subject:</span>
                  {subject}
                </p>
              </div>
              {/* Rendered email */}
              <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-5 text-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">🧭 Sakan</span>
                </div>
                <div className="px-8 py-6">
                  <h2 className="text-xl font-black text-gray-900 mb-4">{subject}</h2>
                  <div
                    className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                  />
                </div>
                <div className="bg-gray-50 px-5 py-4 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Sakan, Inc. All rights reserved.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    If you believe this was sent in error, please contact support.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => { setShowPreview(false); setShowConfirm(true); }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Send className="h-4 w-4" />
                Looks good — Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm modal ─────────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Email Blast</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Audience</span>
                <span className={cn('font-medium', selected.color)}>{selected.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subject</span>
                <span className="text-gray-900 dark:text-white text-right max-w-[60%] truncate">{subject}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              You are about to send this email to <strong className={selected.color}>{selected.label}</strong>.
              Are you sure you want to proceed?
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={blast.isPending}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => blast.mutate()}
                disabled={blast.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {blast.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm & Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
