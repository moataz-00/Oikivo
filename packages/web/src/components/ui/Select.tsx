'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
}: SelectProps) {
  const labelId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={labelId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={labelId}
          className={cn(
            'flex w-full items-center justify-between rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900 transition cursor-pointer',
            'focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900',
            'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
            'data-[state=open]:border-neutral-900 data-[state=open]:ring-1 data-[state=open]:ring-neutral-900',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          <RadixSelect.Value placeholder={placeholder ?? 'Select...'}>
            {selected?.label}
          </RadixSelect.Value>
          <RadixSelect.Icon asChild>
            <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'z-50 min-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)]',
              'overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/10',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center bg-white text-neutral-400">
              <ChevronDown className="h-3 w-3 rotate-180" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1 max-h-60">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2.5 pr-8 text-sm text-neutral-700 outline-none',
                    'hover:bg-neutral-100 focus:bg-neutral-100',
                    'data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[state=checked]:font-medium'
                  )}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-2.5 flex items-center">
                    <Check className="h-3.5 w-3.5 text-indigo-600" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center bg-white text-neutral-400">
              <ChevronDown className="h-3 w-3" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
