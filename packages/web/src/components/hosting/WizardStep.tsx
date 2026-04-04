'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface WizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
  direction?: 'forward' | 'backward';
  showProgressSidebar?: boolean;
}

export function WizardStep({
  title,
  description,
  children,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSaveDraft,
  nextLabel,
  backLabel,
  nextDisabled = false,
  isLastStep = false,
  isLoading = false,
  direction = 'forward',
  showProgressSidebar = false,
}: WizardStepProps) {
  const t = useTranslations('hosting');
  const tCommon = useTranslations('common');

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="flex-1 flex flex-col">
      {/* Inline gradient progress bar */}
      <div className="h-1 bg-neutral-200 shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Content with Animation */}
      <div
        className={cn(
          'flex-1 py-8 px-4 sm:px-8 w-full',
          !showProgressSidebar && 'max-w-2xl xl:max-w-3xl mx-auto'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: direction === 'forward' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'forward' ? -40 : 40 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-500 tracking-wide uppercase mb-3">
                  Step {currentStep} of {totalSteps}
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 leading-tight">
                  {title}
                </h1>
                {description && (
                  <p className="mt-3 text-neutral-500 text-base leading-relaxed">{description}</p>
                )}
              </div>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {currentStep} / {totalSteps}
              </motion.div>
            </div>

            <div>{children}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav — inline, not fixed */}
      <div className="shrink-0 border-t border-neutral-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          {onBack ? (
            <button onClick={onBack}
              className="text-sm font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900 transition-colors">
              {backLabel ?? tCommon('back')}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {onSaveDraft && (
              <Button variant="ghost" size="md" onClick={onSaveDraft} disabled={isLoading}>
                {t('saveDraft')}
              </Button>
            )}
            {onNext && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="md" onClick={onNext} disabled={nextDisabled || isLoading} isLoading={isLoading}>
                  {isLastStep ? `🎉 ${t('publishListing')}` : (nextLabel ?? tCommon('next'))} {!isLastStep && '→'}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
