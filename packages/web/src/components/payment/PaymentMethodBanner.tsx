'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodBannerProps {
  className?: string;
  compact?: boolean;
}

/**
 * UX-02 — Informs guests that only InstaPay and OPay are accepted.
 * Use compact=true for inline widget placement, false for standalone notice.
 */
export function PaymentMethodBanner({ className, compact = false }: PaymentMethodBannerProps) {
  if (compact) {
    return (
      <div className={cn('flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800', className)}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          We currently accept <strong>InstaPay</strong> and <strong>OPay</strong> only.
          Credit / debit cards are not supported yet.
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900', className)}>
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
      <div>
        <p className="font-semibold text-amber-900 mb-0.5">Accepted payment methods</p>
        <p className="text-amber-800 text-xs leading-relaxed">
          This platform currently accepts <strong>InstaPay</strong> and <strong>OPay Card</strong> only.
          International credit / debit cards are not supported at this time.
        </p>
      </div>
    </div>
  );
}
