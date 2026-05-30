import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  textClassName?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  leftIcon, 
  className, 
  containerClassName,
  textClassName,
  style, 
  ...props 
}) => {
  return (
    <View className={`w-full mb-4 ${className}`}>
      {Boolean(label) && <Text className="text-gray-705 mb-1 font-medium text-gray-700">{label}</Text>}
      <View className={`flex-row items-center rounded-lg ${leftIcon ? 'px-3' : 'px-4'} ${containerClassName || 'bg-gray-50 border border-gray-200'}`}>
        {leftIcon}
        <TextInput
          className={`flex-1 py-2.5 text-sm ${leftIcon ? 'ml-2' : ''} ${textClassName || 'text-gray-800'}`}
          placeholderTextColor="#9ca3af"
          style={style}
          {...props}
        />
      </View>
      {Boolean(error) && <Text className="text-red-500 text-xs font-semibold mt-1">{error}</Text>}
    </View>
  );
};
