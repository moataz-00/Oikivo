'use client';

import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, firstName = '', lastName = '', size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const avatarUrl = src ? getAvatarUrl(src) : '';

  return (
    <RadixAvatar.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
    >
      {avatarUrl && (
        <RadixAvatar.Image
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
        />
      )}
      <RadixAvatar.Fallback
        className="flex h-full w-full items-center justify-center bg-neutral-200 font-semibold text-neutral-700"
        delayMs={avatarUrl ? 600 : 0}
      >
        {initials || '?'}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
