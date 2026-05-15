import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, User } from 'lucide-react-native';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/common/Button';
import { printerService } from '../../services/printer/printer.service';
import { ESCPOSService } from '../../services/printer/escpos.service';
import { usePrinterStore } from '../../store/printer.store';
import { Routes } from '../../constants/routes';
import { DBServices } from '../../services/firebase/db';

export const CartScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const tableNo = route.params?.tableNo ?? 14;
  
  const cartItems = useCartStore(state => state.carts[tableNo]) || [];
  const { clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { settings } = usePrinterStore();
  const [specialNote, setSpecialNote] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewKotNo] = useState(() => Math.floor(Math.random() * 100) + 1);
  const isPickup = tableNo === 0;

  const cartTotal = cartItems && Array.isArray(cartItems) 
    ? cartItems.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.qty) || 0)), 0)
    : 0;
  const cartItemCount = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);

  const saveOrderToDb = async () => {
    const kotNo = previewKotNo;
    await DBServices.createOrder({
      kotNo,
      tableNo,
      orderType: isPickup ? 'pickup' : 'dine-in',
      captainId: user?.id || 'unknown',
      captainName: user?.name || 'Unknown',
      status: 'running',
      items: cartItems,
      specialNote,
      totalAmount: cartTotal,
      createdAt: 0 // serverTimestamp handles this inside DBServices
    });

    if (!isPickup) {
      await DBServices.updateTableStatusByNo(tableNo, 'available');
    }
  };

  const handlePrint = async () => {
    if (cartItems.length === 0) return;
    setIsPrinting(true);
    try {
      const buffer = ESCPOSService.buildKOT(
        previewKotNo,
        tableNo,
        user?.name || 'Unknown',
        cartItems,
        specialNote
      );

      const printTask = async () => {
        try {
          const printerPromise = (async () => {
            await printerService.connect(settings.ipAddress, settings.port);
            await printerService.print(buffer);
            printerService.disconnect();
          })();
          
          await Promise.race([
            printerPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
          ]);
          
          return "SUCCESS";
        } catch (e) {
          console.warn("Printer failed or timed out:", e);
          return "FAILED";
        }
      };

      const [dbResult, printResult] = await Promise.all([saveOrderToDb(), printTask()]);
      
      if (printResult === "FAILED") {
        alert('KOT Saved to Cloud, but Printer is offline. Please check connection!');
      } else {
        alert('KOT Saved & Printed!');
      }
      
      clearCart(tableNo);
      navigation.navigate(Routes.TABLES);
    } catch (error: any) {
      alert(`Error saving KOT: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row py-3 border-b border-gray-100">
      <Text className="w-10 text-center font-bold text-gray-700">{item.qty}</Text>
      <View className="flex-1 px-2">
        <Text className="font-bold text-gray-800">{item.itemName || 'Unknown'}</Text>
        {Boolean(item.note) && <Text className="text-xs text-gray-500 mt-1">Note: {item.note}</Text>}
      </View>
      <Text className="w-20 text-right font-bold text-gray-800">₹{Number((Number(item.price) || 0) * (Number(item.qty) || 0))}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">KOT Preview</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="flex-row justify-between mb-6">
          <View>
            <Text className="text-gray-500 text-sm">KOT No.</Text>
            <Text className="text-2xl font-bold">#{previewKotNo}</Text>
          </View>
          <View>
            <Text className="text-gray-500 text-sm">Date & Time</Text>
            <Text className="text-base font-medium">{new Date().toLocaleString()}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <View>
            <Text className="text-gray-500 text-sm">{isPickup ? 'Order Type' : 'Table No.'}</Text>
            <Text className="text-2xl font-bold">{isPickup ? 'Pick Up' : tableNo}</Text>
          </View>
          {!isPickup && <Text className="text-[#5D3FD3] font-bold text-lg">Dine In</Text>}
        </View>

        <View className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
          <Text className="text-gray-500">Captain</Text>
          <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded">
            <User size={16} color="#666" />
            <Text className="ml-2 font-medium">{user?.name}</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-500 mb-2">Special Note</Text>
          <TextInput
            placeholder="Add any special note..."
            className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            value={specialNote}
            onChangeText={setSpecialNote}
          />
        </View>

        <Text className="font-bold text-gray-800 mb-2">ITEMS</Text>
        <View className="flex-row py-2 border-b-2 border-gray-200">
          <Text className="w-10 text-center font-bold text-gray-500 text-xs">Qty</Text>
          <Text className="flex-1 px-2 font-bold text-gray-500 text-xs">Item</Text>
          <Text className="w-20 text-right font-bold text-gray-500 text-xs">Amount</Text>
        </View>

        {cartItems.map(item => (
          <View key={item.itemId}>
             {renderItem({ item })}
          </View>
        ))}

        <View className="flex-row justify-between py-4 mt-2">
          <Text className="font-bold text-gray-600">Total Items: {cartItems.length}</Text>
          <Text className="font-bold text-gray-600">Total Qty: {cartItemCount}</Text>
        </View>
      </ScrollView>

      <View className="p-4 flex-row bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-8">
        <Button 
          title="PRINT KOT" 
          className="flex-1 py-5"
          onPress={handlePrint}
          isLoading={isPrinting}
        />
      </View>
    </SafeAreaView>
  );
};
