'use client';

import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface Step {
  slug: string;
  title: string;
  description?: string;
}

interface MobileProgressBarProps {
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

export function MobileProgressBar({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: MobileProgressBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('hosting');
  const isRTL = useLocale() === 'ar';

  const currentStepData = steps[currentStep - 1];
  const progress = (completedSteps.size / steps.length) * 100;

  const handleStepClick = (stepNumber: number) => {
    // Only allow clicking on completed steps or current step
    if (completedSteps.has(stepNumber) || stepNumber === currentStep) {
      onStepClick?.(stepNumber);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Progress Bar */}
      <div className={cn('lg:hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Compact Bar */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{STEP_ICONS[currentStep]}</span>
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {currentStepData?.title || 'Step ' + currentStep}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 shrink-0">
                {currentStep}/{steps.length}
              </span>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 text-neutral-400 ms-2 shrink-0" />
        </button>
      </div>

      {/* Full Steps Modal (Bottom Sheet) */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto lg:hidden animate-in slide-in-from-bottom duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-lg font-semibold text-neutral-900">{t('allStepsLabel' as any)}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            {/* Steps List */}
            <div className="p-4 space-y-2 pb-8">
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
                      'w-full flex items-start gap-3 rounded-xl p-4 text-start transition-all',
                      'border-2',
                      isCurrent && 'bg-neutral-100 border-indigo-600',
                      isCompleted && !isCurrent && 'border-green-200 bg-green-50/30',
                      !isCurrent && !isCompleted && 'border-neutral-200',
                      !isClickable && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {/* Step Number Badge */}
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        isCurrent && 'bg-indigo-600 text-white',
                        isCompleted && !isCurrent && 'bg-green-500 text-white',
                        !isCurrent && !isCompleted && 'bg-neutral-100 text-neutral-500'
                      )}
                    >
                      {isCompleted && !isCurrent ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span>{stepNumber}</span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{STEP_ICONS[stepNumber]}</span>
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isCurrent ? 'text-neutral-900' : 'text-neutral-900'
                          )}
                        >
                          {step.title}
                        </p>
                      </div>
                      {step.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Current Indicator */}
                    {isCurrent && (
                      <div className="shrink-0 pt-2">
                        <div className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                          {t('wizardCurrentBadge' as any)}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress Summary */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-neutral-600">{t('progressLabel' as any)}</span>
                <span className="font-semibold text-neutral-900">
                  {t('wizardProgressCompleted' as any, { done: completedSteps.size, total: steps.length })}
                </span>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
