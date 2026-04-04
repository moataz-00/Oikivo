'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration ?? 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Convenience functions
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, description }),
};

const typeConfig: Record<ToastType, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    className: 'border-green-200 bg-green-50',
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    className: 'border-red-200 bg-red-50',
  },
  warning: {
    icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    className: 'border-yellow-200 bg-yellow-50',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-600" />,
    className: 'border-blue-200 bg-blue-50',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        return (
          <ToastPrimitive.Root
            key={toast.id}
            open={true}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
              'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
              config.className
            )}
          >
            <div className="shrink-0 mt-0.5">{config.icon}</div>
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-sm font-semibold text-neutral-900">
                {toast.title}
              </ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="mt-0.5 text-sm text-neutral-600">
                  {toast.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-lg p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[100vw]" />
    </ToastPrimitive.Provider>
  );
}
