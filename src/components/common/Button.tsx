import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false,
  className = ''
}) => {
  const getBgColor = () => {
    if (disabled) return 'bg-gray-300';
    switch (variant) {
      case 'primary': return 'bg-[#5D3FD3]';
      case 'secondary': return 'bg-gray-200';
      case 'danger': return 'bg-red-500';
      case 'outline': return 'bg-transparent border-2 border-[#5D3FD3]';
      default: return 'bg-[#5D3FD3]';
    }
  };

  const getTextColor = () => {
    if (disabled) return 'text-gray-500';
    switch (variant) {
      case 'secondary': return 'text-gray-800';
      case 'outline': return 'text-[#5D3FD3]';
      default: return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`py-3 px-6 rounded-lg items-center justify-center ${getBgColor()} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#5D3FD3' : 'white'} />
      ) : (
        <Text className={`font-bold text-lg ${getTextColor()}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
