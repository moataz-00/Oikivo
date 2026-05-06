'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface Step {
  slug: string;
  title: string;
  description?: string;
}

interface ProgressTrackerProps {
  steps: readonly Step[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (stepNumber: number) => void;
  className?: string;
}

const STEP_ICONS: Record<number, string> = {
  1: '🏠',
  2: '🔒',
  3: '📍',
  4: '📐',
  5: '✨',
  6: '🎯',
  7: '📸',
  8: '✍️',
  9: '📝',
  10: '⚙️',
  11: '⚡',
  12: '💰',
  13: '📅',
  14: '🎁',
  15: '⚖️',
  16: '✅',
};

export function ProgressTracker({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ProgressTrackerProps) {
  const t = useTranslations('hosting');
  const isRTL = useLocale() === 'ar';

  const handleStepClick = (stepNumber: number) => {
    // Only allow clicking on completed steps or current step
    if (completedSteps.has(stepNumber) || stepNumber === currentStep) {
      onStepClick?.(stepNumber);
    }
  };

  return (
    <aside
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'shrink-0 sticky top-0 h-screen overflow-y-auto border-e border-neutral-200 bg-white pt-6 pb-8 px-4',
        'w-72',
        className
      )}
    >
      <div className="space-y-1">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = completedSteps.has(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isClickable = isCompleted || isCurrent;

          return (
            <button
              key={step.slug}
              onClick={() => handleStepClick(stepNumber)}
              disabled={!isClickable}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-start transition-all',
                'hover:bg-neutral-50',
                isCurrent && 'bg-neutral-100 border border-neutral-200',
                isCompleted && !isCurrent && 'opacity-70 hover:opacity-100',
                !isClickable && 'opacity-40 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {/* Step Number/Icon Badge */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isCurrent && 'bg-indigo-600 text-white',
                  isCompleted && !isCurrent && 'bg-green-100 text-green-700',
                  !isCurrent && !isCompleted && 'bg-neutral-100 text-neutral-500'
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="md:hidden lg:block">{stepNumber}</span>
                )}
                <span className="hidden md:block lg:hidden text-base">
                  {STEP_ICONS[stepNumber]}
                </span>
              </div>

              {/* Step Name (hidden on tablet, visible on desktop) */}
              <div className="hidden lg:block flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isCurrent ? 'text-neutral-900' : 'text-neutral-700'
                  )}
                >
                  {step.title.length > 30 ? step.title.slice(0, 30) + '...' : step.title}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{t('wizardStepOf' as any, { current: stepNumber, total: steps.length })}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="hidden lg:block mt-6 pt-6 border-t border-neutral-200">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{t('completedLabel' as any)}</span>
            <span className="font-semibold text-neutral-900">
              {completedSteps.size}/{steps.length}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
