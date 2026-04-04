'use client';

import { Edit2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface StepSummaryCardProps {
  icon: string;
  label: string;
  value: string | React.ReactNode;
  onEdit: () => void;
  className?: string;
  photos?: string[];
}

export function StepSummaryCard({
  icon,
  label,
  value,
  onEdit,
  className,
  photos,
}: StepSummaryCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm',
        className
      )}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xl">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
          {label}
        </p>

        {/* Photos Grid */}
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {photos.slice(0, 4).map((photo, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-neutral-200"
              >
                <Image src={photo} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                {idx === 0 && (
                  <div className="absolute bottom-0.5 left-0.5 rounded bg-white/90 px-1 text-[10px] font-medium text-neutral-700">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-900 font-medium">{value}</p>
        )}

        {photos && photos.length > 4 && (
          <p className="text-xs text-neutral-500 mt-1">+{photos.length - 4} more photos</p>
        )}
      </div>

      {/* Edit Button */}
      <button
        onClick={onEdit}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        aria-label={`Edit ${label}`}
      >
        <Edit2 className="h-4 w-4" />
      </button>
    </div>
  );
}
