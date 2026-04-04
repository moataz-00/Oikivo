import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// ---------------------------------------------------------------------------
// Variant look-up tables
// ---------------------------------------------------------------------------

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-brand',
    text: 'text-white font-semibold',
  },
  secondary: {
    container: 'border border-gray-800 bg-white',
    text: 'text-gray-900 font-semibold',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-gray-700 font-medium',
  },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-lg', text: 'text-sm' },
  md: { container: 'px-6 py-3 rounded-xl', text: 'text-base' },
  lg: { container: 'px-8 py-4 rounded-2xl', text: 'text-lg' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  textClassName,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={style}
      className={clsx(
        'flex-row items-center justify-center',
        variantStyles[variant].container,
        sizeStyles[size].container,
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#FF385C'}
        />
      ) : (
        <Text
          style={textStyle}
          className={clsx(
            variantStyles[variant].text,
            sizeStyles[size].text,
            textClassName,
          )}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
