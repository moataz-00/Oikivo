import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
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
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant look-up tables
// ---------------------------------------------------------------------------

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: '',
    text: 'text-white font-semibold',
  },
  secondary: {
    container: 'bg-gray-100 border border-gray-200',
    text: 'text-gray-900 font-semibold',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-gray-700 font-medium',
  },
  outline: {
    container: 'bg-white border border-brand',
    text: 'text-brand font-semibold',
  },
  danger: {
    container: 'bg-red-500',
    text: 'text-white font-semibold',
  },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-lg', text: 'text-sm' },
  md: { container: 'px-6 py-3 rounded-xl', text: 'text-base' },
  lg: { container: 'px-8 py-4 rounded-xl', text: 'text-base' },
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
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const inner = loading ? (
    <ActivityIndicator
      size="small"
      color={variant === 'primary' || variant === 'danger' ? '#fff' : '#4F46E5'}
    />
  ) : (
    <View className="flex-row items-center justify-center">
      {icon ? <View className="mr-2">{icon}</View> : null}
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
    </View>
  );

  // Primary uses gradient
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={style}
        className={clsx(
          'overflow-hidden',
          sizeStyles[size].container,
          isDisabled && 'opacity-50',
          className,
        )}
      >
        <LinearGradient
          colors={['#4F46E5', '#6366F1', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        variant === 'secondary'
          ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }
          : {},
        style,
      ]}
      className={clsx(
        'flex-row items-center justify-center',
        variantStyles[variant].container,
        sizeStyles[size].container,
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {inner}
    </TouchableOpacity>
  );
}
