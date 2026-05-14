'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import {
  MessageSquare, Search, ArrowLeft, Home, Calendar,
  ChevronLeft, ChevronRight, Trash2, Image as ImageIcon,
  X, Check,
} from 'lucide-react';
import Link from 'next/link';

// ─── Helpers ───────────────────────────────────────────────────────────────

function AvatarImg({ url, name, size = 9, colorClass = 'bg-gray-700' }: {
  url?: string | null; name?: string | null; size?: number; colorClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const sizeClass = `h-${size} w-${size}`;
  if (url && !failed) {
    const src = url.startsWith('http') ? url : getUploadUrl(url);
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={`${sizeClass} rounded-full object-cover border-2 border-gray-800`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full ${colorClass} border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

function formatTime(date: string | Date | null | undefined) {
  if (!date) return '';
  const d = new Date(date as string);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString();
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function MessagesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [convPage, setConvPage] = useState(1);
  const [msgPage, setMsgPage] = useState(1);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteConvConfirm, setDeleteConvConfirm] = useState<number | null>(null);
  const [deleteMsgConfirm, setDeleteMsgConfirm] = useState<number | null>(null);

  const CONV_LIMIT = 25;
  const MSG_LIMIT = 50;

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['admin-conversations', search, convPage],
    queryFn: () => adminApi.getConversations({ search: search || undefined, page: convPage, limit: CONV_LIMIT }),
  });

  const { data: detailData, isLoading: msgsLoading, isError: msgsError, error: msgsErrorObj } = useQuery({
    queryKey: ['admin-conv-messages', selectedId, msgPage],
    queryFn: () => adminApi.getConversationMessages(selectedId!, { page: msgPage, limit: MSG_LIMIT }),
    enabled: !!selectedId,
    retry: 1,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const deleteConvMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
      setSelectedId(null);
      setDeleteConvConfirm(null);
    },
  });

  const deleteMsgMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-conv-messages', selectedId] });
      setDeleteMsgConfirm(null);
    },
  });

  // ── Derived data ──────────────────────────────────────────────────────────

  const convData = conversations as any;
  const convs: any[] = convData?.items ?? [];
  const convTotalPages: number = convData?.totalPages ?? 1;

  const msgData = detailData as any;
  const conv = msgData?.conversation ?? null;
  const msgs: any[] = msgData?.messages ?? [];
  const msgTotalPages: number = msgData?.totalPages ?? 1;
  const msgTotal: number = msgData?.total ?? 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Conversation detail view
  // ─────────────────────────────────────────────────────────────────────────

  if (selectedId) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setSelectedId(null); setMsgPage(1); }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {conv ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex -space-x-2">
                <AvatarImg url={conv.guest?.avatarUrl} name={`${conv.guest?.firstName ?? ''} ${conv.guest?.lastName ?? ''}`} size={9} colorClass="bg-blue-900" />
                <AvatarImg url={conv.host?.avatarUrl} name={`${conv.host?.firstName ?? ''} ${conv.host?.lastName ?? ''}`} size={9} colorClass="bg-emerald-900" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {conv.guest?.profileUuid ? (
                    <Link href={`/users/${conv.guest.profileUuid}`} className="text-sm font-semibold text-blue-400 hover:underline">
                      {conv.guest.firstName} {conv.guest.lastName}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-gray-300">{conv.guest?.firstName} {conv.guest?.lastName}</span>
                  )}
                  <span className="text-gray-500">↔</span>
                  {conv.host?.profileUuid ? (
                    <Link href={`/users/${conv.host.profileUuid}`} className="text-sm font-semibold text-emerald-400 hover:underline">
                      {conv.host.firstName} {conv.host.lastName}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-gray-300">{conv.host?.firstName} {conv.host?.lastName}</span>
                  )}
                  {conv.property?.title && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 ml-2"><Home className="h-3 w-3" />{conv.property.title}</span>
                  )}
                  {(conv.bookingUuid || conv.bookingId) && (
                    <Link href={`/bookings/${conv.bookingUuid ?? conv.bookingId}`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1 ml-2">
                      <Calendar className="h-3 w-3" />Booking #{conv.bookingId}
                    </Link>
                  )}
                </div>
                <p className="text-xs text-gray-500">{msgTotal} message{msgTotal !== 1 ? 's' : ''} · Conversation #{selectedId}</p>
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Conversation #{selectedId}</h1>
          )}

          {/* Delete conversation */}
          <div className="ml-auto">
            {deleteConvConfirm === selectedId ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete entire conversation?</span>
                <button
                  onClick={() => deleteConvMutation.mutate(selectedId)}
                  disabled={deleteConvMutation.isPending}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleteConvMutation.isPending ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setDeleteConvConfirm(null)}
                  className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConvConfirm(selectedId)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors border border-red-800/30"
              >
                <Trash2 className="h-3.5 w-3.5" />Delete conversation
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex-1 overflow-y-auto max-h-[65vh]">
          {msgsLoading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-800 animate-pulse" />)}</div>
          ) : msgsError ? (
            <div className="text-center py-8">
              <p className="text-red-400 font-medium">Failed to load conversation</p>
              <p className="text-xs text-gray-500 mt-1">{(msgsErrorObj as any)?.response?.data?.message || (msgsErrorObj as any)?.message || 'Unknown error'}</p>
            </div>
          ) : msgs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages in this conversation</p>
          ) : (
            <div className="space-y-3">
              {msgs.map((msg: any) => {
                const isHost = conv && String(msg.senderId) === String(conv.hostId);
                const senderName = msg.sender
                  ? `${msg.sender.firstName} ${msg.sender.lastName}`
                  : (isHost ? 'Host' : 'Guest');
                const senderUuid = msg.sender?.profileUuid;
                const senderAvatar = msg.sender?.avatarUrl;

                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isHost ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="shrink-0 pt-0.5">
                      <AvatarImg
                        url={senderAvatar}
                        name={senderName}
                        size={8}
                        colorClass={isHost ? 'bg-emerald-900' : 'bg-blue-900'}
                      />
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[70%] group relative ${isHost ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Sender + time row */}
                      <div className={`flex items-center gap-2 mb-0.5 ${isHost ? 'flex-row-reverse' : 'flex-row'}`}>
                        {senderUuid ? (
                          <Link href={`/users/${senderUuid}`} className={`text-xs font-medium hover:underline ${isHost ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {senderName}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">{senderName}</span>
                        )}
                        <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                        {msg.isRead ? (
                          <Check className="h-3 w-3 text-indigo-400 shrink-0" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" title="Unread" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`rounded-xl px-3.5 py-2.5 ${isHost ? 'bg-indigo-900/50 border border-indigo-800/40' : 'bg-gray-800 border border-gray-700'}`}>
                        {msg.messageType === 'image' && msg.imageUrl ? (
                          <button onClick={() => setLightboxUrl(getUploadUrl(msg.imageUrl))}>
                            <img
                              src={getUploadUrl(msg.imageUrl)}
                              alt="Message image"
                              className="max-w-full max-h-48 rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                            />
                          </button>
                        ) : (
                          <p className="text-sm text-gray-100 whitespace-pre-wrap break-words">{msg.body}</p>
                        )}
                      </div>

                      {/* Delete button */}
                      <div className={`mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isHost ? 'self-end' : 'self-start'}`}>
                        {deleteMsgConfirm === msg.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-red-400">Delete?</span>
                            <button
                              onClick={() => deleteMsgMutation.mutate(msg.id)}
                              disabled={deleteMsgMutation.isPending}
                              className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteMsgConfirm(null)}
                              className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteMsgConfirm(msg.id)}
                            className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="h-2.5 w-2.5" />delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message pagination */}
          {msgTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-4 text-sm text-gray-500">
              <span>Page {msgPage} of {msgTotalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={msgPage === 1}
                  onClick={() => setMsgPage((p) => p - 1)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />Newer
                </button>
                <button
                  disabled={msgPage >= msgTotalPages}
                  onClick={() => setMsgPage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Older<ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Conversation list view
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-400" />Message Threads
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage conversations between hosts and guests
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setConvPage(1); }}
        className="flex gap-2"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or property…"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-80"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setConvPage(1); }}
            className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : convs.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((c: any) => {
            const guestName = `${c.guest?.firstName ?? ''} ${c.guest?.lastName ?? ''}`.trim();
            const hostName = `${c.host?.firstName ?? ''} ${c.host?.lastName ?? ''}`.trim();

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-600/50 cursor-pointer transition-all group"
                onClick={() => { setSelectedId(c.id); setMsgPage(1); }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatars */}
                  <div className="flex -space-x-2 shrink-0">
                    <AvatarImg url={c.guest?.avatarUrl} name={guestName} size={10} colorClass="bg-blue-900" />
                    <AvatarImg url={c.host?.avatarUrl} name={hostName} size={10} colorClass="bg-emerald-900" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Participants */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.guest?.profileUuid ? (
                        <Link
                          href={`/users/${c.guest.profileUuid}`}
                          className="text-sm font-semibold text-blue-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {guestName || 'Guest'}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-gray-200">{guestName || 'Guest'}</span>
                      )}
                      <span className="text-gray-600 text-xs">↔</span>
                      {c.host?.profileUuid ? (
                        <Link
                          href={`/users/${c.host.profileUuid}`}
                          className="text-sm font-semibold text-emerald-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {hostName || 'Host'}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-gray-200">{hostName || 'Host'}</span>
                      )}
                    </div>

                    {/* Property / booking */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      {c.property?.title && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Home className="h-3 w-3 shrink-0" />{c.property.title}
                        </span>
                      )}
                      {(c.bookingUuid || c.bookingId) && (
                        <Link
                          href={`/bookings/${c.bookingUuid ?? c.bookingId}`}
                          className="flex items-center gap-1 text-indigo-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="h-3 w-3" />Booking #{c.bookingId}
                        </Link>
                      )}
                    </div>

                    {/* Last message preview */}
                    {c.lastMessage && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        <span className="text-gray-600">{c.lastMessage.senderName}:</span>{' '}
                        {c.lastMessage.messageType === 'image'
                          ? <span className="italic">[Photo]</span>
                          : c.lastMessage.body}
                      </p>
                    )}
                  </div>

                  {/* Right: time + unread + delete */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(c.lastMessage?.createdAt ?? c.updatedAt)}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                    {/* Delete conversation */}
                    {deleteConvConfirm === c.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => deleteConvMutation.mutate(c.id)}
                          disabled={deleteConvMutation.isPending}
                          className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConvConfirm(null)}
                          className="text-[10px] text-gray-500 hover:text-gray-300 px-1 py-0.5 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConvConfirm(c.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-1 rounded transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && convTotalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {convPage} of {convTotalPages} · {convData?.total ?? ''} total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={convPage === 1}
              onClick={() => setConvPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />Prev
            </button>
            <button
              disabled={convPage >= convTotalPages}
              onClick={() => setConvPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Next<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
