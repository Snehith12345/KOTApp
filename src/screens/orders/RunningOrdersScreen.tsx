import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useOrderStore } from '../../store/order.store';
import { DBServices } from '../../services/firebase/db';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/common/Button';


export const RunningOrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { orders, isLoading, subscribeToOrders } = useOrderStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);


  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    return () => unsubscribe();
  }, []);

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const [customStartDate, setCustomStartDate] = useState(getTodayString());
  const [customEndDate, setCustomEndDate] = useState(getTodayString());

  const handleDateChange = (text: string, setter: (val: string) => void) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }
    setter(formatted);
  };

  const isValidDateStr = (str: string) => {
    const parts = str.split('-');
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    if (year < 2000 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
  };

  // Date filtering logic (Last 30 Days tracking from Firestore)
  const dateFilteredOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    
    const orderDate = typeof order.createdAt.toDate === 'function' 
      ? order.createdAt.toDate() 
      : new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt);
      
    if (isNaN(orderDate.getTime())) return false;

    const now = new Date();
    
    switch (dateFilter) {
      case 'today': {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return orderDate >= startOfToday && orderDate <= endOfToday;
      }
      case 'yesterday': {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
      }
      case 'custom': {
        try {
          if (!customStartDate || !customEndDate) return true;
          if (!isValidDateStr(customStartDate) || !isValidDateStr(customEndDate)) return true;
          const startParts = customStartDate.split('-');
          const endParts = customEndDate.split('-');
          
          const start = new Date(
            parseInt(startParts[0]),
            parseInt(startParts[1]) - 1,
            parseInt(startParts[2]),
            0, 0, 0
          );
          const end = new Date(
            parseInt(endParts[0]),
            parseInt(endParts[1]) - 1,
            parseInt(endParts[2]),
            23, 59, 59
          );
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
          return orderDate >= start && orderDate <= end;
        } catch (e) {
          return true;
        }
      }
      default:
        return true;
    }
  });

  // Apply search query filter
  const finalFilteredOrders = dateFilteredOrders.filter(order => {
    const tableMatch = order.tableNo?.toString().includes(searchQuery);
    const idMatch = order.kotNo?.toString().includes(searchQuery);
    const captainMatch = order.captainName?.toLowerCase().includes(searchQuery.toLowerCase());
    return tableMatch || idMatch || captainMatch;
  });

  // Dynamic statistics based on the active filtered set
  const totalSale = dateFilteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const baseSale = totalSale / 1.05;
  const taxCollected = totalSale - baseSale;

  const totalOrders = dateFilteredOrders.length;
  const dineInOrders = dateFilteredOrders.filter(o => o.orderType !== 'pickup').length;
  const pickupOrders = dateFilteredOrders.filter(o => o.orderType === 'pickup').length;

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
    const displayedItems = order.items?.slice(0, 2) || [];
    const remainingCount = (order.items?.length || 0) - displayedItems.length;

    return (
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => setSelectedOrder(order)}
        onLongPress={() => {
          if (user?.role === 'admin' || user?.role === 'manager') {
            handleDeleteOrder(order.id, order.kotNo);
          }
        }}
      >
        <View className="bg-white p-4 mb-3 mx-4 rounded-xl border border-gray-100 shadow-sm flex-row justify-between items-center">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center gap-2 mb-1.5">
              <Text className="font-bold text-gray-800 text-base">KOT #{order.kotNo}</Text>
              <View className={`px-2 py-0.5 rounded-full ${order.orderType === 'pickup' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                <Text className={`text-[10px] font-semibold ${order.orderType === 'pickup' ? 'text-purple-700' : 'text-blue-700'}`}>
                  {order.orderType === 'pickup' ? 'Pick Up' : `Table ${order.tableNo}`}
                </Text>
              </View>
            </View>

            <View className="mb-2">
              {displayedItems.map((item: any, idx: number) => (
                <Text key={idx} className="text-slate-650 text-xs py-0.5" numberOfLines={1}>
                  <Text className="font-bold text-slate-800">{item.qty}x</Text> {item.itemName}
                </Text>
              ))}
              {remainingCount > 0 && (
                <Text className="text-xs text-indigo-500 font-semibold mt-0.5">+ {remainingCount} more items</Text>
              )}
            </View>

            <Text className="text-[10px] text-gray-400">{formatOrderDate(order.createdAt)} • By {order.captainName || 'Unknown'}</Text>
          </View>

          <View className="items-end">
            <Text className="font-black text-slate-800 text-lg">₹{Number(order.totalAmount || 0).toFixed(0)}</Text>
            <Text className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">Tap to open</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View>
      {/* Date Filter Tabs */}
      <View className="bg-white pt-3 pb-2 border-b border-gray-100">
        <View className="flex-row bg-gray-100 p-1 rounded-xl mx-4">
          {([
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'custom', label: 'Custom' }
          ] as const).map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 py-2.5 rounded-lg items-center justify-center ${dateFilter === tab.id ? 'bg-[#5D3FD3] shadow-sm' : ''}`}
              onPress={() => setDateFilter(tab.id)}
            >
              <Text className={`text-[11px] font-bold ${dateFilter === tab.id ? 'text-white' : 'text-gray-500'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Date Inputs */}
      {dateFilter === 'custom' && (
        <View className="px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-row gap-3">
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Start Date</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={customStartDate}
              onChangeText={(text) => handleDateChange(text, setCustomStartDate)}
              className={`bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-800 ${
                customStartDate.length === 10 && !isValidDateStr(customStartDate) ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
              }`}
              maxLength={10}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">End Date</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={customEndDate}
              onChangeText={(text) => handleDateChange(text, setCustomEndDate)}
              className={`bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-800 ${
                customEndDate.length === 10 && !isValidDateStr(customEndDate) ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
              }`}
              maxLength={10}
            />
          </View>
        </View>
      )}

      {/* Sales Analytics Dashboard */}
      <View className="bg-slate-900 p-5 mb-4 shadow-md">
        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</Text>
        <Text className="text-3xl font-black text-white mt-1">₹{totalSale.toFixed(2)}</Text>
        
        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-850">
          <View>
            <Text className="text-[9px] text-slate-400 uppercase tracking-wider">Net Sales (Excl. Tax)</Text>
            <Text className="text-sm font-bold text-slate-200 mt-0.5">₹{baseSale.toFixed(2)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] text-slate-400 uppercase tracking-wider">5% GST Collected</Text>
            <Text className="text-sm font-bold text-indigo-400 mt-0.5">₹{taxCollected.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Metric Breakdown Cards */}
      <View className="flex-row justify-between px-4 mb-4" style={{ gap: 10 }}>
        <View className="bg-white p-3.5 rounded-2xl flex-1 border border-gray-100 shadow-sm items-center">
          <Text className="text-xs text-gray-500 font-medium">Total Orders</Text>
          <Text className="text-2xl font-black text-slate-800 mt-1">{totalOrders}</Text>
        </View>
        <View className="bg-white p-3.5 rounded-2xl flex-1 border border-gray-100 shadow-sm items-center">
          <Text className="text-xs text-gray-500 font-medium">In-House</Text>
          <Text className="text-2xl font-black text-emerald-600 mt-1">{dineInOrders}</Text>
        </View>
        <View className="bg-white p-3.5 rounded-2xl flex-1 border border-gray-100 shadow-sm items-center">
          <Text className="text-xs text-gray-500 font-medium">Pick Up</Text>
          <Text className="text-2xl font-black text-indigo-600 mt-1">{pickupOrders}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-2 bg-white border-y border-gray-100 mb-3">
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

      {(user?.role === 'admin' || user?.role === 'manager') && (
        <Text className="text-[11px] text-gray-400 italic mb-2 ml-4">Tip: Tap an order to open details or long press to delete</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4 text-slate-800">Orders</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5D3FD3" />
        </View>
      ) : (
        <FlatList
          data={finalFilteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={{ paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-400 font-medium">No orders found</Text>
            </View>
          }
        />
      )}

      {/* Order Details Modal */}
      <Modal visible={selectedOrder !== null} transparent animationType="slide">
        {selectedOrder && (
          <SafeAreaView className="flex-1 bg-gray-50">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={() => setSelectedOrder(null)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  className="p-1.5 bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} color="#334155" />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-3 text-slate-800">Order Details</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className={`px-3 py-1 rounded-full ${selectedOrder.orderType === 'pickup' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                  <Text className={`text-xs font-bold ${selectedOrder.orderType === 'pickup' ? 'text-purple-700' : 'text-blue-700'}`}>
                    {selectedOrder.orderType === 'pickup' ? 'Pick Up' : `Table ${selectedOrder.tableNo}`}
                  </Text>
                </View>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <TouchableOpacity 
                    onPress={() => {
                      handleDeleteOrder(selectedOrder.id, selectedOrder.kotNo);
                      setSelectedOrder(null);
                    }}
                    className="p-2 bg-red-50 rounded-full ml-1"
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ paddingBottom: 60 }}>
              {/* Order Info Card */}
              <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-xl font-black text-slate-800">KOT #{selectedOrder.kotNo}</Text>
                  <Text className="text-xs text-gray-400">{formatOrderDate(selectedOrder.createdAt)}</Text>
                </View>
                <View className="flex-row items-center border-t border-gray-100 pt-3 mt-1 justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-500 font-medium">Captain:</Text>
                    <Text className="text-sm font-bold text-slate-800 ml-1.5">{selectedOrder.captainName || 'Unknown'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-500 font-medium">Status:</Text>
                    <Text className="text-sm font-extrabold text-emerald-600 ml-1.5 capitalize">{selectedOrder.status || 'Completed'}</Text>
                  </View>
                </View>
              </View>

              {/* Items Card */}
              <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Items List</Text>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <View key={idx} className="flex-row justify-between items-start py-3 border-b border-gray-50 last:border-b-0">
                    <View className="flex-1 mr-4">
                      <Text className="text-slate-800 text-base font-bold">
                        <Text className="text-[#5D3FD3] font-black">{item.qty}x</Text> {item.itemName}
                      </Text>
                      {item.variantName && (
                        <Text className="text-xs text-gray-400 mt-0.5">Size: {item.variantName}</Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-800 font-semibold">₹{Number(item.price * item.qty).toFixed(2)}</Text>
                      <Text className="text-[10px] text-gray-400 mt-0.5">₹{Number(item.price).toFixed(2)} each</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Notes Card if present */}
              {selectedOrder.specialNote ? (
                <View className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl mb-4">
                  <Text className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">Special Instruction</Text>
                  <Text className="text-sm text-amber-900 font-medium">{selectedOrder.specialNote}</Text>
                </View>
              ) : null}

              {/* Bill Details Card */}
              <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4">Receipt Invoice</Text>
                
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-gray-500 text-sm">Subtotal</Text>
                  <Text className="text-slate-800 text-sm font-semibold">₹{Number(selectedOrder.totalAmount / 1.05).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-500 text-sm">GST (5%)</Text>
                  <Text className="text-[#5D3FD3] text-sm font-semibold">₹{Number(selectedOrder.totalAmount - (selectedOrder.totalAmount / 1.05)).toFixed(2)}</Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-800 text-lg font-bold">Total Paid</Text>
                  <Text className="text-slate-800 text-2xl font-black">₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Actions Area */}
              <View className="mt-6">
                <Button 
                  title="Close Details" 
                  variant="primary"
                  onPress={() => setSelectedOrder(null)} 
                  className="w-full rounded-xl shadow-lg shadow-purple-500/10"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};
