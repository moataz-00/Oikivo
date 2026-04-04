import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
} from 'react-native';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerClassName,
      inputClassName,
      labelClassName,
      leftIcon,
      rightIcon,
      ...rest
    },
    ref,
  ) => {
    return (
      <View className={clsx('mb-4', containerClassName)}>
        {label ? (
          <Text
            className={clsx(
              'mb-1.5 text-sm font-medium text-gray-700',
              labelClassName,
            )}
          >
            {label}
          </Text>
        ) : null}

        <View
          className={clsx(
            'flex-row items-center border rounded-xl px-3 bg-white',
            error ? 'border-red-500' : 'border-gray-300 focus:border-brand',
          )}
        >
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            className={clsx(
              'flex-1 py-3 text-base text-gray-900',
              inputClassName,
            )}
            placeholderTextColor="#9CA3AF"
            {...rest}
          />

          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>

        {error ? (
          <Text className="mt-1 text-xs text-red-500">{error}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';
