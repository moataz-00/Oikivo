'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { messagesApi } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';

interface ContactHostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  propertyId?: number;
  listingTitle?: string;
}

export function ContactHostModal({
  open,
  onOpenChange,
  host,
  propertyId,
  listingTitle,
}: ContactHostModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const [message, setMessage] = useState('');

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: () => messagesApi.startConversation(host.id, message, propertyId),
    onSuccess: (conversation) => {
      toast.success('Message sent! Redirecting to inbox…');
      setMessage('');
      onOpenChange(false);
      router.push(`/${locale}/inbox`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send message');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMessage();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Contact host">
      <div className="space-y-5">
        {/* Host info */}
        <div className="flex items-center gap-3">
          <Avatar
            src={getAvatarUrl(host.avatar ?? host.avatarUrl)}
            firstName={host.firstName}
            lastName={host.lastName}
            size="lg"
          />
          <div>
            <p className="font-semibold text-neutral-900">
              {host.firstName} {host.lastName}
            </p>
            {listingTitle && (
              <p className="text-sm text-neutral-500 line-clamp-1">
                Re: {listingTitle}
              </p>
            )}
          </div>
        </div>

        {/* Message form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Your message
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I have a question about your listing…"
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition"
            />
            <p className="mt-1 text-xs text-neutral-400 text-right">
              {message.length}/2000
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || !message.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Spinner size="sm" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {isPending ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
