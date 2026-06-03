import React, { useRef, useState } from 'react';
import { View, TextInput, Text, TextInputProps, Platform } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  textClassName?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  leftIcon, 
  rightIcon,
  className, 
  containerClassName,
  textClassName,
  style, 
  onFocus,
  onBlur,
  ...props 
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isDarkTheme = containerClassName?.includes('slate-850') || containerClassName?.includes('slate-800') || containerClassName?.includes('bg-slate');
  
  const isFocusedBorderColor = isFocused ? (isDarkTheme ? '#8F75FA' : '#5D3FD3') : undefined;
  const isErrorBorderColor = error ? '#EF4444' : undefined;
  const activeBorderColor = isFocusedBorderColor || isErrorBorderColor;

  return (
    <View className={`w-full mb-4 ${className || ''}`}>
      {Boolean(label) && (
        <Text className={`mb-1 font-medium text-gray-700 ${isFocused ? (isDarkTheme ? 'text-indigo-400' : 'text-indigo-650') : ''}`}>
          {label}
        </Text>
      )}
      <View 
        className={`flex-row items-center rounded-lg ${leftIcon ? 'pl-3' : 'pl-4'} ${rightIcon ? 'pr-3' : 'pr-4'} ${containerClassName || 'bg-gray-50 border border-gray-200 py-2.5'}`}
        style={activeBorderColor ? { borderColor: activeBorderColor } : undefined}
      >
        {leftIcon && React.isValidElement(leftIcon)
          ? React.cloneElement(leftIcon as React.ReactElement<any>, {
              color: isFocused ? (isDarkTheme ? '#8F75FA' : '#5D3FD3') : ((leftIcon as any).props?.color || '#64748B'),
            })
          : leftIcon}
        <TextInput
          ref={inputRef}
          className={`flex-1 ${leftIcon ? 'ml-2' : ''} ${rightIcon ? 'mr-2' : ''} ${textClassName || 'text-gray-800'}`}
          placeholderTextColor={props.placeholderTextColor || "#9ca3af"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          textAlignVertical="center"
          style={[
            {
              fontSize: 14,
              paddingTop: 0,
              paddingBottom: 0,
              paddingVertical: 0,
              ...Platform.select({
                android: {
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                },
              }),
            },
            style
          ]}
          {...props}
        />
        {rightIcon}
      </View>
      {Boolean(error) && <Text className="text-red-500 text-xs font-semibold mt-1">{error}</Text>}
    </View>
  );
};


