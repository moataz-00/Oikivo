'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, getUploadUrl } from '@/lib/api';
import { MessageSquare, Search, ArrowLeft, User, Home, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [convPage, setConvPage] = useState(1);
  const CONV_LIMIT = 25;

  const MSG_LIMIT = 50;
  const [msgPage, setMsgPage] = useState(1);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['admin-conversations', search, convPage],
    queryFn: () => adminApi.getConversations(search ? { search, page: convPage, limit: CONV_LIMIT } : { page: convPage, limit: CONV_LIMIT }),
  });

  // MSG-2: Fetch selected conversation independently so it works on page 2+
  const { data: selectedConv } = useQuery({
    queryKey: ['admin-conversation', selectedId],
    queryFn: () => adminApi.getConversations({ conversationId: selectedId! } as any),
    enabled: !!selectedId,
  });

  const { data: messages } = useQuery({
    queryKey: ['admin-messages', selectedId, msgPage],
    queryFn: () => adminApi.getConversationMessages(selectedId!, { page: msgPage, limit: MSG_LIMIT }),
    enabled: !!selectedId,
  });

  const convs: any[] = (conversations as any)?.items ?? (Array.isArray(conversations) ? conversations : []);
  const msgData = messages as any;
  const msgs: any[] = msgData?.items ?? (Array.isArray(messages) ? messages : msgData?.data ?? []);
  const msgTotalPages: number = msgData?.totalPages ?? 1;

  if (selectedId) {
    // MSG-2: Use dedicated query instead of finding in current page's list
    const conv = (selectedConv as any) ?? convs.find((c: any) => c.id === selectedId);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedId(null); setMsgPage(1); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Conversation #{selectedId}</h1>
            {conv && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {conv.guest?.firstName} {conv.guest?.lastName} ↔ {conv.host?.firstName} {conv.host?.lastName}
                {conv.property?.title && <span> · {conv.property.title}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 max-h-[70vh] overflow-y-auto">
          {msgs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages in this conversation</p>
          ) : (
            <div className="space-y-4">
              {msgs.map((msg: any) => {
                const isHost = conv && msg.senderId === conv.hostId;
                return (
                  <div key={msg.id} className={`flex ${isHost ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${isHost ? 'bg-indigo-900/40 border border-indigo-800/30' : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'}`}>
                      <p className="text-xs text-gray-500 mb-1">
                        {msg.sender?.firstName || (isHost ? 'Host' : 'Guest')} · {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                      </p>
                      {msg.messageType === 'image' && msg.imageUrl ? (
                        <img src={getUploadUrl(msg.imageUrl)} alt="" className="max-w-full max-h-48 rounded-lg" />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white">{msg.body}</p>
                      )}
                      {!msg.isRead && <span className="text-[10px] text-yellow-500 mt-1 block">Unread</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MSG-3: Message pagination */}
          {msgTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Page {msgPage} of {msgTotalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={msgPage === 1}
                  onClick={() => setMsgPage((p) => p - 1)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Newer
                </button>
                <button
                  disabled={msgPage >= msgTotalPages}
                  onClick={() => setMsgPage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Older <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare className="h-6 w-6 text-indigo-400" />Message Threads</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View conversations between hosts and guests (read-only)</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setConvPage(1); }} className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by user name or property..." className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-80" />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Search</button>
      </form>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse" />)}</div>
      ) : convs.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((conv: any) => (
            <div key={conv.id} onClick={() => setSelectedId(conv.id)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-700 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex -space-x-2">
                    <div className="h-9 w-9 rounded-full bg-blue-900/40 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-blue-400">
                      {conv.guest?.firstName?.[0] || 'G'}
                    </div>
                    <div className="h-9 w-9 rounded-full bg-emerald-900/40 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {conv.host?.firstName?.[0] || 'H'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.guest?.firstName} {conv.guest?.lastName}</span>
                      <span className="text-gray-600">↔</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.host?.firstName} {conv.host?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {conv.property?.title && <span className="flex items-center gap-1 truncate"><Home className="h-3 w-3" />{conv.property.title}</span>}
                      {conv.bookingId && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Booking #{conv.bookingId}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 ml-4 shrink-0 flex flex-col items-end gap-1">
                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}
                  {/* MSG-5: Unread badge */}
                  {(conv.unreadCount > 0 || conv.hasUnread) && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                      {conv.unreadCount || '!'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (convs.length === CONV_LIMIT || convPage > 1) && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {convPage}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={convPage === 1}
              onClick={() => setConvPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              disabled={convs.length < CONV_LIMIT}
              onClick={() => setConvPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
