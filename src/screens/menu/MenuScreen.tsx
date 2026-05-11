import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useMenuStore } from '../../store/menu.store';
import { useCartStore } from '../../store/cart.store';
import { Routes } from '../../constants/routes';
import { MenuItem } from '../../types/menu.types';
import { DBServices } from '../../services/firebase/db';

export const MenuScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const tableNo = route.params?.tableNo ?? 14;
  
  const categories = useMenuStore(state => state.categories);
  const items = useMenuStore(state => state.items);
  const isLoadingCategories = useMenuStore(state => state.isLoadingCategories);
  const isLoadingItems = useMenuStore(state => state.isLoadingItems);
  const subscribeToMenu = useMenuStore(state => state.subscribeToMenu);
  
  const cartItems = useCartStore(state => state.carts[tableNo]) || [];
  const addItem = useCartStore(state => state.addItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const unsubscribe = subscribeToMenu();
    return () => unsubscribe();
  }, []);

  const getCartQty = useCallback((itemId: string) => {
    const item = cartItems.find(i => i.itemId === itemId);
    return item ? item.qty : 0;
  }, [cartItems]);

  const handleIncrement = async (item: MenuItem) => {
    try {
      addItem(tableNo, { itemId: item.id, itemName: item.name, price: item.price });
    } catch (error) {
      console.warn("Failed to increment item", error);
    }
  };

  const handleDecrement = async (item: MenuItem) => {
    try {
      const qty = getCartQty(item.id);
      if (qty > 1) {
        updateQuantity(tableNo, item.id, qty - 1);
      } else if (qty === 1) {
        removeItem(tableNo, item.id);
      }
    } catch (error) {
      console.warn("Failed to decrement item", error);
    }
  };

  const cartTotal = Array.isArray(cartItems) 
    ? cartItems.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.qty) || 0)), 0)
    : 0;
    
  const cartItemCount = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0)
    : 0;

  const renderItem = useCallback(({ item }: { item: MenuItem }) => {
    if (!item) return null;
    const qty = getCartQty(item.id);
    const itemPrice = Number(item.price) || 0;
    
    return (
      <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center">
            <Text className="text-xl">O</Text>
          </View>
          <View>
            <Text className="font-bold text-gray-800 text-base">{item.name || 'Item'}</Text>
            <Text className="text-gray-500">₹{itemPrice}</Text>
          </View>
        </View>
        <View className="flex-row items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
          <TouchableOpacity 
            className="w-8 h-8 items-center justify-center bg-white rounded shadow-sm"
            onPress={() => handleDecrement(item)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text className="text-xl text-gray-600">-</Text>
          </TouchableOpacity>
          <Text className="w-8 text-center font-bold">{qty}</Text>
          <TouchableOpacity 
            className="w-8 h-8 items-center justify-center bg-[#5D3FD3] rounded shadow-sm"
            onPress={() => handleIncrement(item)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text className="text-xl text-white">+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [cartItems, tableNo, getCartQty]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">
            {tableNo === 0 ? 'Pick Up Order' : `Menu (Table ${tableNo})`}
          </Text>
        </View>
      </View>

      <View className="py-2 border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All' }, ...(Array.isArray(categories) ? categories : [])]}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className={`px-4 py-2 mx-2 rounded-full justify-center items-center ${activeCategory === item.id ? 'bg-[#5D3FD3]' : 'bg-gray-100'}`}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text className={`${activeCategory === item.id ? 'text-white font-bold' : 'text-gray-600'}`}>
                {item.name || 'Category'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoadingItems ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5D3FD3" />
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={activeCategory === 'all' ? (Array.isArray(items) ? items : []) : (Array.isArray(items) ? items : []).filter(i => i.categoryId === activeCategory)}
            renderItem={renderItem}
            keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No items available.</Text>}
          />
        </View>
      )}

      {cartItemCount > 0 && (
        <View className="absolute bottom-4 left-4 right-4">
          <TouchableOpacity 
            className="bg-[#5D3FD3] p-4 rounded-xl flex-row justify-between items-center shadow-lg"
            onPress={() => navigation.navigate(Routes.CART, { tableNo })}
          >
            <Text className="text-white font-bold text-lg">View Cart ({cartItemCount})</Text>
            <Text className="text-white font-bold text-lg">₹{cartTotal}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};
