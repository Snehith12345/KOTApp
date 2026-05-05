import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightElement }) => {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
      <View className="flex-row items-center">
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
};
