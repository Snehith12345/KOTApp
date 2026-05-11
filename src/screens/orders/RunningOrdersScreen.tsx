import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';
import { useOrderStore } from '../../store/order.store';
import { Order } from '../../types/order.types';

export const RunningOrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { orders, isLoading, subscribeToOrders } = useOrderStore();

  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    return () => unsubscribe();
  }, []);

  const handleCompleteOrder = (orderId: string, tableNo: number) => {
    Alert.alert(
      'Complete Order',
      `Complete Order for ${tableNo === 0 ? 'Pick Up' : `Table ${tableNo}`}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: async () => {
            await DBServices.updateOrderStatus(orderId, 'completed');
            if (tableNo !== 0) {
              const remainingOrders = orders.filter(o => o.tableNo === tableNo && o.id !== orderId && o.status === 'running');
              if (remainingOrders.length === 0) {
                await DBServices.updateTableStatusByNo(tableNo, 'available');
              }
            }
          }
        }
      ]
    );
  };

  const handleCancelOrder = (orderId: string, tableNo: number) => {
    Alert.alert(
      'Cancel Order',
      `Cancel Order for ${tableNo === 0 ? 'Pick Up' : `Table ${tableNo}`}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            await DBServices.updateOrderStatus(orderId, 'cancelled');
            if (tableNo !== 0) {
              const remainingOrders = orders.filter(o => o.tableNo === tableNo && o.id !== orderId && o.status === 'running');
              if (remainingOrders.length === 0) {
                await DBServices.updateTableStatusByNo(tableNo, 'available');
              }
            }
          }
        }
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: Order }) => {
    return (
      <View className="bg-white m-4 rounded-xl border border-gray-200 shadow-sm p-4">
        <View className="flex-row justify-between items-center mb-3 border-b border-gray-100 pb-3">
          <View className="flex-row items-center gap-2">
            <View className={`px-3 py-1 rounded-full ${item.tableNo === 0 ? 'bg-purple-100' : 'bg-orange-100'}`}>
              <Text className={`font-bold ${item.tableNo === 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                {item.tableNo === 0 ? 'Pick Up' : `Table ${item.tableNo}`}
              </Text>
            </View>
            <Text className="text-gray-500 font-medium">#{item.kotNo}</Text>
          </View>
          <Text className="text-xs text-gray-400">
            {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
          </Text>
        </View>

        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-600">{item.captainName}</Text>
          <Text className="text-gray-600">{item.items?.length || 0} items</Text>
        </View>

        <View className="flex-row justify-between border-t border-gray-100 pt-4 mt-2" style={{ gap: 12 }}>
          <TouchableOpacity 
            className="flex-1 py-3 items-center bg-green-500 rounded-lg"
            onPress={() => handleCompleteOrder(item.id, item.tableNo)}
          >
            <Text className="text-white font-bold text-sm">Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-3 items-center bg-purple-100 rounded-lg"
            onPress={() => navigation.navigate(Routes.MENU, { tableNo: item.tableNo, orderId: item.id })}
          >
            <Text className="text-[#5D3FD3] font-bold text-sm">Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-3 items-center bg-red-100 rounded-lg"
            onPress={() => handleCancelOrder(item.id, item.tableNo)}
          >
            <Text className="text-red-600 font-bold text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">Running Orders</Text>
        </View>
        <TouchableOpacity>
          <Search size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="flex-row p-4">
        <TouchableOpacity className="px-6 py-2 bg-[#5D3FD3] rounded-full mr-2">
          <Text className="text-white font-bold">Running ({orders.filter(o => o.status === 'running').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-6 py-2 bg-gray-200 rounded-full mr-2">
          <Text className="text-gray-700 font-bold">All Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-6 py-2 bg-gray-200 rounded-full">
          <Text className="text-gray-700 font-bold">Completed</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#5D3FD3" className="mt-10" />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id || index.toString()}
          ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No running orders found.</Text>}
        />
      )}
    </SafeAreaView>
  );
};
