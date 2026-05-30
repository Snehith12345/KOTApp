import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useMenuStore } from '../../store/menu.store';
import { useCartStore } from '../../store/cart.store';
import { usePrinterStore } from '../../store/printer.store';
import { Routes } from '../../constants/routes';
import { DBServices } from '../../services/firebase/db';
import { printerService } from '../../services/printer/printer.service';
import { ESCPOSService } from '../../services/printer/escpos.service';
import { useAuthStore } from '../../store/auth.store';
import { MenuItem, MenuItemVariant } from '../../types/menu.types';
import { Button } from '../../components/common/Button';

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
  
  const { settings } = usePrinterStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedItemForVariants, setSelectedItemForVariants] = useState<MenuItem | null>(null);
  const [isVariantModalOpen, setVariantModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMenu();
    return () => unsubscribe();
  }, []);

  const getCartQty = useCallback((itemId: string) => {
    const item = cartItems.find(i => i.itemId === itemId);
    return item ? item.qty : 0;
  }, [cartItems]);

  const getItemTotalCartQty = useCallback((item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.reduce((sum, v) => sum + getCartQty(`${item.id}_${v.name}`), 0);
    }
    return getCartQty(item.id);
  }, [getCartQty]);

  const getItemSelectionDesc = useCallback((item: MenuItem) => {
    if (!item.variants || item.variants.length === 0) return '';
    const selected: string[] = [];
    item.variants.forEach(v => {
      const qty = getCartQty(`${item.id}_${v.name}`);
      if (qty > 0) {
        selected.push(`${qty}x ${v.name}`);
      }
    });
    return selected.join(', ');
  }, [getCartQty]);

  const handleIncrement = async (item: MenuItem) => {
    try {
      addItem(tableNo, { itemId: item.id, itemName: item.name, price: item.price, qty: 1 });
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

  const handleIncrementVariant = (item: MenuItem, variant: MenuItemVariant) => {
    addItem(tableNo, {
      itemId: `${item.id}_${variant.name}`,
      itemName: `${item.name} (${variant.name})`,
      price: variant.price,
      qty: 1
    });
  };

  const handleDecrementVariant = (item: MenuItem, variant: MenuItemVariant) => {
    const variantId = `${item.id}_${variant.name}`;
    const qty = getCartQty(variantId);
    if (qty > 1) {
      updateQuantity(tableNo, variantId, qty - 1);
    } else if (qty === 1) {
      removeItem(tableNo, variantId);
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
    const hasVar = item.variants && item.variants.length > 0;
    const totalQty = getItemTotalCartQty(item);
    const itemPrice = Number(item.price) || 0;
    
    return (
      <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
        <TouchableOpacity 
          className="flex-row items-center flex-1 pr-4"
          activeOpacity={hasVar ? 0.7 : 1}
          onPress={() => {
            if (hasVar) {
              setSelectedItemForVariants(item);
              setVariantModalOpen(true);
            }
          }}
        >
          <View className="flex-1">
            <Text className="font-bold text-gray-800 text-base" numberOfLines={2}>{item.name || 'Item'}</Text>
            {hasVar ? (
              <View>
                <Text className="text-gray-400 text-xs mt-0.5">Options available</Text>
                {totalQty > 0 && (
                  <Text className="text-xs text-[#5D3FD3] mt-1 font-semibold" numberOfLines={2}>
                    {getItemSelectionDesc(item)}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-gray-500">₹{itemPrice}</Text>
            )}
          </View>
        </TouchableOpacity>

        {hasVar ? (
          totalQty === 0 ? (
            <TouchableOpacity 
              className="bg-[#5D3FD3] px-4 py-2 rounded-lg"
              onPress={() => {
                setSelectedItemForVariants(item);
                setVariantModalOpen(true);
              }}
            >
              <Text className="text-white font-bold text-sm">+ Add</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="flex-row items-center bg-purple-50 rounded-lg p-1 border border-[#5D3FD3]"
              onPress={() => {
                setSelectedItemForVariants(item);
                setVariantModalOpen(true);
              }}
            >
              <View className="w-8 h-8 items-center justify-center bg-white rounded shadow-sm">
                <Text className="text-lg text-[#5D3FD3] font-bold">-</Text>
              </View>
              <Text className="w-8 text-center font-bold text-[#5D3FD3]">{totalQty}</Text>
              <View className="w-8 h-8 items-center justify-center bg-[#5D3FD3] rounded shadow-sm">
                <Text className="text-lg text-white font-bold">+</Text>
              </View>
            </TouchableOpacity>
          )
        ) : (
          <View className="flex-row items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            <TouchableOpacity 
              className="w-8 h-8 items-center justify-center bg-white rounded shadow-sm"
              onPress={() => handleDecrement(item)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text className="text-xl text-gray-600">-</Text>
            </TouchableOpacity>
            <Text className="w-8 text-center font-bold">{totalQty}</Text>
            <TouchableOpacity 
              className="w-8 h-8 items-center justify-center bg-[#5D3FD3] rounded shadow-sm"
              onPress={() => handleIncrement(item)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text className="text-xl text-white">+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [cartItems, tableNo, getCartQty, getItemTotalCartQty, getItemSelectionDesc]);

  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const { user } = useAuthStore();
  const markAsSent = useCartStore(state => state.markAsSent);

  // Filter items that have unsent quantities
  const unsentItems = cartItems
    .map(item => ({
      ...item,
      qty: item.qty - (item.sentQty || 0)
    }))
    .filter(item => item.qty > 0);
  
  const unsentCount = unsentItems.reduce((sum, item) => sum + item.qty, 0);

  const handleSendToKitchen = async () => {
    if (unsentItems.length === 0) return;
    setIsSendingToKitchen(true);
    try {
      const kotNo = await DBServices.getNextSequenceNumber();

      if (tableNo !== 0) {
        await DBServices.updateTableStatusByNo(tableNo, 'running');
      }

      // Print KOT to Kitchen Printer with ONLY unsent items
      const buffer = ESCPOSService.buildKOT(
        kotNo,
        tableNo,
        user?.name || 'Unknown',
        unsentItems
      );

      const printTask = async () => {
        try {
          const printerPromise = (async () => {
            await printerService.connect(settings.kitchenIpAddress, settings.kitchenPort);
            await printerService.print(buffer);
            await printerService.disconnect();
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

      const printResult = await printTask();
      
      if (printResult === "FAILED") {
        alert('Printer is offline. Please check connection!');
      } else {
        alert('Order sent to Kitchen!');
        markAsSent(tableNo);
      }
    } catch (error: any) {
      alert(`Error sending order: ${error.message}`);
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const filteredItems = (Array.isArray(items) ? items : [])
    .filter(i => activeCategory === 'all' || i.categoryId === activeCategory)
    .filter(i => (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

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

      <View className="px-4 py-1.5 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1.5">
          <Search size={16} color="#6B7280" />
          <TextInput 
            className="flex-1 ml-2 text-sm text-gray-800 py-0.5"
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="py-2 border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All' }, ...(Array.isArray(categories) ? categories : [])]}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          keyboardShouldPersistTaps="handled"
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
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No items available.</Text>}
          />
        </View>
      )}

      {cartItemCount > 0 && (
        <View className="flex-row gap-3 bg-white p-4 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {unsentCount > 0 && (
            <TouchableOpacity 
              className="bg-orange-500 p-2.5 rounded-lg flex-1 justify-center items-center shadow-sm"
              onPress={handleSendToKitchen}
              disabled={isSendingToKitchen}
            >
              {isSendingToKitchen ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-bold text-sm text-center">Send to Kitchen ({unsentCount})</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            className="bg-[#5D3FD3] p-2.5 rounded-lg flex-1 justify-center items-center shadow-sm flex-row"
            onPress={() => navigation.navigate(Routes.CART, { tableNo })}
          >
            <Text className="text-white font-bold text-sm text-center">Cart ({cartItemCount})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Variant Selection Modal */}
      <Modal visible={isVariantModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-6 rounded-2xl w-full max-w-[400px]">
            <Text className="text-xl font-bold mb-1 text-gray-800">{selectedItemForVariants?.name}</Text>
            <Text className="text-gray-400 text-xs mb-4">Select options to add to order</Text>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[300px] mb-4">
              {selectedItemForVariants?.variants?.map((v, index) => {
                const qty = getCartQty(`${selectedItemForVariants.id}_${v.name}`);
                return (
                  <View key={index} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <View className="flex-1 mr-4">
                      <Text className="font-semibold text-gray-800 text-base">{v.name}</Text>
                      <Text className="text-gray-500 text-sm">₹{v.price}</Text>
                    </View>
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <TouchableOpacity 
                        className="w-8 h-8 items-center justify-center bg-white rounded shadow-sm"
                        onPress={() => handleDecrementVariant(selectedItemForVariants!, v)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <Text className="text-xl text-gray-600 font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="w-8 text-center font-bold text-gray-800">{qty}</Text>
                      <TouchableOpacity 
                        className="w-8 h-8 items-center justify-center bg-[#5D3FD3] rounded shadow-sm"
                        onPress={() => handleIncrementVariant(selectedItemForVariants!, v)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <Text className="text-xl text-white font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Button 
              title="Done" 
              onPress={() => {
                setVariantModalOpen(false);
                setSelectedItemForVariants(null);
              }} 
              className="w-full text-base"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
