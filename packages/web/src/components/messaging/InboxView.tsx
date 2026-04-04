'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, parseISO, isThisWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MessageSquare, Search, ArrowLeft, ImageIcon, X,
  Check, CheckCheck, ZoomIn, Loader2, Wifi, Phone, Video,
  ChevronRight, Plus, Trash2,
} from 'lucide-react';
import { messagesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Avatar } from '@/components/ui/Avatar';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { cn, getImageUrl } from '@/lib/utils';
import type { Message, Conversation } from '@/types';

// ─── Quick replies ────────────────────────────────────────────────────────────
const HOST_QUICK_REPLIES = [
  'Hi! Thanks for reaching out 👋',
  "Yes, it's available for those dates ✅",
  "Sorry, not available for those dates ❌",
  'Check-in: 3 PM · Check-out: 11 AM 🕒',
  "I'll confirm your booking shortly ⏳",
  'Feel free to ask anything!',
  'Could you share your expected arrival time? 📍',
  'Welcome! Hope you enjoy your stay 🏠',
];

const GUEST_QUICK_REPLIES = [
  "Hi, I'm interested in this property 👋",
  'Is it available for my dates? 📅',
  "What's the check-in process? 🔑",
  'Is parking available? 🚗',
  'Are pets allowed? 🐾',
  'Can I get an early check-in? ⏰',
  'Thanks for the quick reply! 😊',
  'Looking forward to staying here 🏡',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function msgTime(str: string): string {
  try {
    const d = parseISO(str);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    if (isThisWeek(d)) return format(d, 'EEE');
    return format(d, 'MMM d');
  } catch {
    return '';
  }
}

function dividerLabel(str: string): string {
  try {
    const d = parseISO(str);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    if (isThisWeek(d)) return format(d, 'EEEE');
    return format(d, 'MMMM d, yyyy');
  } catch {
    return str.split('T')[0];
  }
}

function groupByDate(msgs: Message[]) {
  const groups: Record<string, Message[]> = {};
  msgs.forEach((m) => {
    const key = m.createdAt.split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups).map(([key, items]) => ({
    label: dividerLabel(`${key}T12:00:00.000Z`),
    items,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
interface InboxViewProps {
  requireHost?: boolean;
}

export function InboxView({ requireHost = false }: InboxViewProps) {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, isHost, hasHydrated, user } = useAuth();
  const queryClient = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('host_quick_reply_templates');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeConvIdRef = useRef<number | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isLoggedIn) router.push(`/${locale}/login`);
    else if (requireHost && !isHost) router.push(`/${locale}`);
  }, [hasHydrated, isLoggedIn, isHost, requireHost, locale, router]);

  // ── Escape key closes lightbox ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
    enabled: hasHydrated && isLoggedIn,
    refetchInterval: 60_000, // fallback poll — socket handles real-time updates
  });

  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => messagesApi.getMessages(activeConvId!),
    enabled: !!activeConvId,
    refetchInterval: 30_000, // fallback poll — socket handles real-time updates
  });

  // ── WebSocket ────────────────────────────────────────────────────────────────
  const { socket } = useSocket();

  // Keep a ref to activeConvId so socket event handler always sees current value
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      // Append to the open conversation's cache
      if (msg.conversationId === activeConvIdRef.current) {
        queryClient.setQueryData<Message[]>(
          ['messages', msg.conversationId],
          (old) => (old ? [...old, msg] : [msg]),
        );
      }
      // Refresh conversation list (updates last message preview + unread badge)
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleConvUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('conversation-update', handleConvUpdate);
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('conversation-update', handleConvUpdate);
    };
  }, [socket, queryClient]);

  // ── Mark read when opening ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    messagesApi.markRead(activeConvId).catch(() => {});
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }), 1_000);
  }, [activeConvId, queryClient]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (body: string) => messagesApi.sendMessage(activeConvId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => messagesApi.uploadMessageImage(activeConvId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedImage(null);
      setImagePreview(null);
    },
  });

  const isPending = sendMutation.isPending || uploadMutation.isPending;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeConvId || isPending) return;
      if (selectedImage) uploadMutation.mutate(selectedImage);
      if (message.trim()) sendMutation.mutate(message.trim());
    },
    [activeConvId, isPending, selectedImage, message, uploadMutation, sendMutation],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openConv = (convId: number) => {
    // Leave previous room
    if (activeConvIdRef.current && socket) {
      socket.emit('leave', { conversationId: activeConvIdRef.current });
    }
    setActiveConvId(convId);
    setShowThread(true);
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    // Join new room
    if (socket) {
      socket.emit('join', { conversationId: convId });
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  if (!hasHydrated || !isLoggedIn || (requireHost && !isHost)) return <FullPageSpinner />;

  const quickReplies = requireHost ? HOST_QUICK_REPLIES : GUEST_QUICK_REPLIES;

  const saveCustomTemplate = () => {
    const text = newTemplate.trim();
    if (!text || customTemplates.includes(text)) return;
    const updated = [...customTemplates, text];
    setCustomTemplates(updated);
    localStorage.setItem('host_quick_reply_templates', JSON.stringify(updated));
    setNewTemplate('');
    setShowAddTemplate(false);
  };

  const removeCustomTemplate = (tpl: string) => {
    const updated = customTemplates.filter((t) => t !== tpl);
    setCustomTemplates(updated);
    localStorage.setItem('host_quick_reply_templates', JSON.stringify(updated));
  };
  const unreadTotal = (conversations ?? []).reduce((s, c) => s + c.unreadCount, 0);
  const activeConv = conversations?.find((c) => c.id === activeConvId);
  const otherPerson = activeConv?.participants.find((p) => p.id !== user?.id);

  const filteredConvs = (conversations ?? []).filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = conv.participants.find((p) => p.id !== user?.id);
    const name = `${other?.firstName ?? ''} ${other?.lastName ?? ''}`.toLowerCase();
    const prop = conv.property?.title?.toLowerCase() ?? '';
    const exp = conv.experience?.title?.toLowerCase() ?? '';
    const last = conv.lastMessage?.content?.toLowerCase() ?? '';
    return name.includes(q) || prop.includes(q) || exp.includes(q) || last.includes(q);
  });

  const msgGroups = groupByDate(messages ?? []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] bg-neutral-100 overflow-hidden">

      {/* ════════════════════════════════════════════
          LEFT PANEL — Conversation Sidebar
      ════════════════════════════════════════════ */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-neutral-200 shrink-0 transition-all duration-200',
          'w-full sm:w-[320px] lg:w-[360px]',
          showThread ? 'hidden sm:flex' : 'flex',
        )}
      >
        {/* Sidebar Header */}
        <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                {requireHost ? 'Host Inbox' : 'Messages'}
              </h1>
              {unreadTotal > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold px-1.5"
                >
                  {unreadTotal}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              <Wifi className="h-3 w-3" />
              Live
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
          {convsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              <p className="text-xs text-neutral-400 animate-pulse">Loading conversations…</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-neutral-300" />
              </div>
              <p className="text-sm font-semibold text-neutral-600">
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                {searchQuery
                  ? `No conversations match "${searchQuery}"`
                  : "When guests message you, they'll appear here"}
              </p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const other = conv.participants.find((p) => p.id !== user?.id);
              const isActive = conv.id === activeConvId;
              const hasUnread = conv.unreadCount > 0;
              const context = conv.property
                ? { icon: '🏠', label: conv.property.title }
                : conv.experience
                ? { icon: '🎭', label: conv.experience.title }
                : null;

              return (
                <motion.button
                  key={conv.id}
                  onClick={() => openConv(conv.id)}
                  whileTap={{ scale: 0.985 }}
                  className={cn(
                    'w-full flex items-start gap-3.5 px-4 py-4 text-left transition-all duration-150 relative group',
                    isActive
                      ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500 pl-[13px]'
                      : 'border-l-[3px] border-l-transparent hover:bg-neutral-50',
                  )}
                >
                  {/* Avatar with unread indicator */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={other?.avatar}
                      firstName={other?.firstName}
                      lastName={other?.lastName}
                      size="md"
                    />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={cn(
                        'text-sm truncate leading-tight',
                        hasUnread ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-700',
                      )}>
                        {other?.firstName} {other?.lastName}
                      </p>
                      {conv.lastMessage && (
                        <span className={cn(
                          'text-[11px] shrink-0',
                          hasUnread ? 'text-indigo-500 font-semibold' : 'text-neutral-400',
                        )}>
                          {msgTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {context && (
                      <p className="text-[11px] text-neutral-500 truncate mb-1 font-medium">
                        {context.icon} {context.label}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn(
                        'text-xs truncate flex-1',
                        hasUnread ? 'text-neutral-700 font-medium' : 'text-neutral-400',
                      )}>
                        {conv.lastMessage
                          ? conv.lastMessage.messageType === 'image'
                            ? '📷 Photo'
                            : conv.lastMessage.content
                          : 'Start a conversation'}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold px-1.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron for mobile */}
                  <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-400 shrink-0 mt-1 sm:hidden transition-colors" />
                </motion.button>
              );
            })
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════
          RIGHT PANEL — Message Thread
      ════════════════════════════════════════════ */}
      {activeConv ? (
        <div className={cn(
          'flex flex-col flex-1 min-w-0 bg-white',
          showThread ? 'flex' : 'hidden sm:flex',
        )}>

          {/* Thread Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 bg-white shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setShowThread(false)}
              className="sm:hidden flex items-center justify-center h-9 w-9 rounded-xl hover:bg-neutral-100 transition-colors text-neutral-600"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>

            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              <Avatar
                src={otherPerson?.avatar}
                firstName={otherPerson?.firstName}
                lastName={otherPerson?.lastName}
                size="md"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-neutral-900 text-sm leading-tight">
                {otherPerson?.firstName} {otherPerson?.lastName}
              </p>
              {activeConv.property && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 max-w-[260px] truncate">
                  🏠 <span className="truncate">{activeConv.property.title}</span>
                </span>
              )}
              {!activeConv.property && activeConv.experience && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5 max-w-[260px] truncate">
                  🎭 <span className="truncate">{activeConv.experience.title}</span>
                </span>
              )}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1 shrink-0">
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors" title="Call (coming soon)">
                <Phone className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors" title="Video (coming soon)">
                <Video className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-5 space-y-1"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
              backgroundSize: '24px 24px',
              backgroundColor: '#f8f9fc',
            }}
          >
            {msgsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                <p className="text-xs text-neutral-400">Loading messages…</p>
              </div>
            ) : !messages?.length ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="relative mb-5">
                  <div className="h-20 w-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                    <MessageSquare className="h-9 w-9 text-indigo-300" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-md">
                    <Send className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-base font-bold text-neutral-700">Say hello!</p>
                <p className="text-sm text-neutral-400 mt-1.5 max-w-[260px] leading-relaxed">
                  Start the conversation — use a quick reply below or type your own message
                </p>
              </div>
            ) : (
              <>
                {msgGroups.map((group) => (
                  <div key={group.label}>
                    {/* Date Divider */}
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex-1 h-px bg-neutral-200/70" />
                      <span className="text-[11px] text-neutral-500 font-medium px-3 py-1 rounded-full bg-white border border-neutral-200 shadow-sm">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-neutral-200/70" />
                    </div>

                    {/* Messages */}
                    <div className="space-y-1">
                      {group.items.map((msg, idx) => {
                        const isOwn = msg.sender.id === user?.id;
                        const prevMsg = group.items[idx - 1];
                        const nextMsg = group.items[idx + 1];
                        const isFirstInSeq = !prevMsg || prevMsg.sender.id !== msg.sender.id;
                        const isLastInSeq = !nextMsg || nextMsg.sender.id !== msg.sender.id;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={cn(
                              'flex items-end gap-2',
                              isOwn ? 'justify-end' : 'justify-start',
                              isFirstInSeq ? 'mt-3' : 'mt-0.5',
                            )}
                          >
                            {/* Other user avatar */}
                            {!isOwn && (
                              <div className="w-7 h-7 shrink-0 mb-0.5">
                                {isLastInSeq ? (
                                  <Avatar
                                    src={msg.sender.avatar}
                                    firstName={msg.sender.firstName}
                                    size="xs"
                                  />
                                ) : (
                                  <div className="w-7 h-7" />
                                )}
                              </div>
                            )}

                            {/* Bubble */}
                            <div className={cn(
                              'flex flex-col max-w-[72%] min-w-0',
                              isOwn ? 'items-end' : 'items-start',
                            )}>
                              {/* Image message */}
                              {msg.messageType === 'image' && msg.imageUrl ? (
                                <button
                                  onClick={() => setLightboxUrl(msg.imageUrl ?? null)}
                                  className={cn(
                                    'relative group overflow-hidden cursor-zoom-in shadow-md',
                                    isOwn
                                      ? 'rounded-2xl rounded-br-sm'
                                      : 'rounded-2xl rounded-bl-sm',
                                  )}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getImageUrl(msg.imageUrl)}
                                    alt="Sent image"
                                    className="block max-w-[280px] max-h-[220px] object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ZoomIn className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                  </div>
                                </button>
                              ) : (
                                /* Text bubble */
                                <div
                                  className={cn(
                                    'px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm',
                                    isOwn
                                      ? [
                                          'bg-indigo-600 text-white',
                                          isFirstInSeq && isLastInSeq
                                            ? 'rounded-2xl rounded-br-sm'
                                            : isFirstInSeq
                                            ? 'rounded-t-2xl rounded-bl-2xl rounded-br-sm'
                                            : isLastInSeq
                                            ? 'rounded-b-2xl rounded-tl-2xl rounded-br-sm'
                                            : 'rounded-l-2xl rounded-r-sm',
                                        ].join(' ')
                                      : [
                                          'bg-white text-neutral-900 border border-neutral-200',
                                          isFirstInSeq && isLastInSeq
                                            ? 'rounded-2xl rounded-bl-sm'
                                            : isFirstInSeq
                                            ? 'rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                                            : isLastInSeq
                                            ? 'rounded-b-2xl rounded-tr-2xl rounded-bl-sm'
                                            : 'rounded-r-2xl rounded-l-sm',
                                        ].join(' '),
                                  )}
                                >
                                  {msg.content}
                                </div>
                              )}

                              {/* Timestamp + read receipt (only on last in sequence) */}
                              {isLastInSeq && (
                                <span className={cn(
                                  'flex items-center gap-1 text-[10px] mt-1',
                                  isOwn ? 'text-neutral-400' : 'text-neutral-400',
                                )}>
                                  {format(parseISO(msg.createdAt), 'HH:mm')}
                                  {isOwn && (
                                    msg.isRead
                                      ? <CheckCheck className="h-3 w-3 text-indigo-400" />
                                      : <Check className="h-3 w-3 text-neutral-300" />
                                  )}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Replies Strip */}
          <div className="bg-white border-t border-neutral-100 px-4 py-2.5 overflow-x-auto shrink-0 scrollbar-hide">
            <div className="flex items-center gap-2 w-max">
              <span className="text-[11px] font-semibold text-neutral-400 shrink-0 uppercase tracking-wide">Quick</span>
              <div className="w-px h-4 bg-neutral-200 shrink-0" />
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => {
                    setMessage(qr);
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="shrink-0 text-xs border border-neutral-200 text-neutral-600 bg-neutral-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 rounded-full px-3.5 py-1.5 transition-all duration-150 whitespace-nowrap font-medium"
                >
                  {qr}
                </button>
              ))}
              {customTemplates.map((tpl) => (
                <span key={tpl} className="shrink-0 flex items-center gap-1 group">
                  <button
                    onClick={() => {
                      setMessage(tpl);
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    className="text-xs border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full px-3.5 py-1.5 transition-all duration-150 whitespace-nowrap font-medium"
                  >
                    ★ {tpl}
                  </button>
                  <button
                    onClick={() => removeCustomTemplate(tpl)}
                    className="opacity-0 group-hover:opacity-100 -ml-1 h-4 w-4 rounded-full bg-neutral-200 text-neutral-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                    title="Remove template"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <div className="w-px h-4 bg-neutral-200 shrink-0" />
              {!showAddTemplate ? (
                <button
                  onClick={() => setShowAddTemplate(true)}
                  className="shrink-0 flex items-center gap-1 text-xs border border-dashed border-neutral-300 text-neutral-400 hover:text-indigo-600 hover:border-indigo-300 rounded-full px-3 py-1.5 transition-all"
                  title="Save custom template"
                >
                  <Plus className="h-3 w-3" /> Save template
                </button>
              ) : (
                <span className="shrink-0 flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCustomTemplate(); if (e.key === 'Escape') setShowAddTemplate(false); }}
                    placeholder="Type template…"
                    className="text-xs rounded-full border border-indigo-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-40"
                    maxLength={200}
                  />
                  <button
                    onClick={saveCustomTemplate}
                    disabled={!newTemplate.trim()}
                    className="text-xs bg-indigo-600 text-white rounded-full px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowAddTemplate(false); setNewTemplate(''); }}
                    className="text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Image Preview */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white border-t border-neutral-100 px-4 py-3 flex items-center gap-3 overflow-hidden shrink-0"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-xl border border-neutral-200 shadow-sm"
                  />
                  <button
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-700">Image ready to send</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Click send or press Enter</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="bg-white border-t border-neutral-200 px-4 py-3 flex items-end gap-2.5 shrink-0"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Attach image */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              title="Attach image"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-40"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              placeholder="Write a message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white max-h-32 overflow-y-auto leading-relaxed transition-all placeholder:text-neutral-400"
              style={{ minHeight: 42 }}
            />

            {/* Send */}
            <button
              type="submit"
              disabled={(!message.trim() && !selectedImage) || isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </form>
        </div>
      ) : (
        /* ── No conversation selected (desktop placeholder) ── */
        <div className="hidden sm:flex flex-1 flex-col items-center justify-center"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
            backgroundSize: '24px 24px',
            backgroundColor: '#f8f9fc',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-8"
          >
            {/* Icon cluster */}
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-3xl bg-white border border-neutral-200 shadow-md flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-indigo-400" />
              </div>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="absolute -top-2 -right-2 h-9 w-9 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"
              >
                <Send className="h-4 w-4 text-white" />
              </motion.div>
            </div>

            <p className="text-lg font-bold text-neutral-800 mb-2">Your Messages</p>
            <p className="text-sm text-neutral-500 max-w-[240px] leading-relaxed">
              {filteredConvs.length > 0
                ? 'Select a conversation from the sidebar to start chatting'
                : 'No conversations yet — messages from guests and hosts will appear here'}
            </p>

            {filteredConvs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-5 flex items-center gap-1.5 text-xs text-indigo-500 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Pick a conversation
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative max-w-[90vw] max-h-[90vh] cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(lightboxUrl)}
                alt="Full size"
                className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-xl hover:bg-neutral-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
