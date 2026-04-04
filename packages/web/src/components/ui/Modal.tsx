'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'centered' | 'fullscreen' | 'bottom';
  showClose?: boolean;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = 'centered',
  showClose = true,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-white shadow-xl focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            variant === 'centered' && [
              'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-2xl',
              'w-full max-w-lg max-h-[90vh] overflow-y-auto',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
              'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            ],
            variant === 'fullscreen' && [
              'inset-0 rounded-none',
              'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            ],
            variant === 'bottom' && [
              'bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] overflow-y-auto',
              'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            ],
            className
          )}
        >
          {(title || showClose) && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
              {title && (
                <Dialog.Title className="text-base font-semibold text-neutral-900">
                  {title}
                </Dialog.Title>
              )}
              {showClose && (
                <Dialog.Close className="ms-auto rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              )}
            </div>
          )}
          {description && (
            <Dialog.Description className="px-6 pt-4 text-sm text-neutral-500">
              {description}
            </Dialog.Description>
          )}
          <div className={cn(variant !== 'fullscreen' && 'p-6')}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Trigger helper
export const ModalTrigger = Dialog.Trigger;
