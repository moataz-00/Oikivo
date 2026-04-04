import React from 'react';
import { View, Text } from 'react-native';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'superhost';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

// ---------------------------------------------------------------------------
// Variant look-up
// ---------------------------------------------------------------------------

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-yellow-100', text: 'text-yellow-700' },
  error:   { container: 'bg-red-100',    text: 'text-red-700' },
  info:    { container: 'bg-blue-100',   text: 'text-blue-700' },
  superhost: { container: 'bg-brand/10', text: 'text-brand' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Badge({ label, variant = 'info', className }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View
      className={clsx(
        'px-2.5 py-0.5 rounded-full self-start',
        styles.container,
        className,
      )}
    >
      <Text className={clsx('text-xs font-medium', styles.text)}>
        {label}
      </Text>
    </View>
  );
}
