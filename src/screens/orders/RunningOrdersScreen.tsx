import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useOrderStore } from '../../store/order.store';
import { DBServices } from '../../services/firebase/db';

export const RunningOrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { orders, isLoading, subscribeToOrders } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    return () => unsubscribe();
  }, []);

  const totalSale = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const baseSale = totalSale / 1.05;
  const taxCollected = totalSale - baseSale;

  const filteredOrders = orders.filter(order => {
    const tableMatch = order.tableNo?.toString().includes(searchQuery);
    const idMatch = order.kotNo?.toString().includes(searchQuery);
    const captainMatch = order.captainName?.toLowerCase().includes(searchQuery.toLowerCase());
    return tableMatch || idMatch || captainMatch;
  });

  const formatOrderDate = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const date = typeof createdAt.toDate === 'function' 
      ? createdAt.toDate() 
      : new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt);
      
    if (isNaN(date.getTime())) return 'Just now';

    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDeleteOrder = (id: string, kotNo: number | string) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete Order KOT #${kotNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await DBServices.deleteOrder(id);
            } catch (e: any) {
              Alert.alert('Error', `Could not delete order: ${e.message}`);
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item: order }: { item: any }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onLongPress={() => handleDeleteOrder(order.id, order.kotNo)}
      >
        <View className="bg-white p-4 mb-3 mx-4 rounded-xl border border-gray-100 shadow-sm">
          <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="font-bold text-gray-800 text-base">KOT #{order.kotNo}</Text>
                <View className={`px-2 py-0.5 rounded-full ${order.orderType === 'pickup' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                  <Text className={`text-[10px] font-semibold ${order.orderType === 'pickup' ? 'text-purple-700' : 'text-blue-700'}`}>
                    {order.orderType === 'pickup' ? 'Pick Up' : `Table ${order.tableNo}`}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-gray-400 mt-0.5">{formatOrderDate(order.createdAt)} • By {order.captainName || 'Unknown'}</Text>
            </View>
          </View>

          <View className="py-2 border-b border-gray-100">
            {order.items?.map((item: any, idx: number) => (
              <View key={idx} className="flex-row justify-between items-center py-1">
                <Text className="text-gray-700 text-sm">
                  <Text className="font-bold text-gray-900">{item.qty}x</Text> {item.itemName}
                </Text>
                <Text className="text-gray-500 text-sm">₹{Number(item.price * item.qty).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {order.specialNote ? (
            <View className="mt-2 bg-yellow-50 border border-yellow-100 p-2 rounded-lg">
              <Text className="text-xs text-yellow-700 font-medium">Note: {order.specialNote}</Text>
            </View>
          ) : null}

          <View className="flex-row justify-between items-center mt-3 pt-1">
            <Text className="font-bold text-gray-800 text-base">Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">Orders</Text>
        </View>
      </View>

      <View className="bg-white p-4 mb-3 border-b border-gray-100 shadow-sm">
        <View className="flex-row justify-between mb-3">
          <View className="bg-purple-50 p-3 rounded-xl flex-1 mr-2 border border-purple-100">
            <Text className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Total Sales</Text>
            <Text className="text-xl font-bold text-[#5D3FD3] mt-1">₹{totalSale.toFixed(2)}</Text>
            <Text className="text-[9px] text-purple-400 mt-0.5">Incl. 5% GST</Text>
          </View>
          <View className="bg-orange-50 p-3 rounded-xl flex-1 ml-2 border border-orange-100">
            <Text className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">5% Tax Collected</Text>
            <Text className="text-xl font-bold text-orange-600 mt-1">₹{taxCollected.toFixed(2)}</Text>
            <Text className="text-[9px] text-orange-400 mt-0.5">CGST 2.5% + SGST 2.5%</Text>
          </View>
        </View>
        <View className="bg-gray-50 px-3 py-1.5 rounded-lg flex-row justify-between items-center">
          <Text className="text-gray-500 text-[11px] font-medium">Net Sales (Excl. Tax):</Text>
          <Text className="text-gray-700 text-xs font-bold">₹{baseSale.toFixed(2)}</Text>
        </View>
      </View>

      <View className="px-4 py-2 bg-white border-b border-gray-100 mb-3">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1.5">
          <Search size={16} color="#666" />
          <TextInput 
            placeholder="Search by KOT, Table, or Captain" 
            className="flex-1 ml-2 text-sm py-0.5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <Text className="text-[11px] text-gray-400 italic mb-2 ml-4">Tip: Long press an order to delete it</Text>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5D3FD3" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-400 font-medium">No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
