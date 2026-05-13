import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const RunningOrdersScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">Orders</Text>
        </View>
        <TouchableOpacity>
          <Search size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl text-gray-500 font-bold mb-2">No orders available as of now</Text>
        <Text className="text-sm text-gray-400 text-center">This screen is reserved for future enhancements.</Text>
      </View>
    </SafeAreaView>
  );
};
