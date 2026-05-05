import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <View className={`w-full mb-4 ${className}`}>
      {Boolean(label) && <Text className="text-gray-700 mb-1 font-medium">{label}</Text>}
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-800"
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {Boolean(error) && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};
