import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react-native';
import { useMenuStore } from '../../store/menu.store';
import { DBServices } from '../../services/firebase/db';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { MenuItem } from '../../types/menu.types';

export const MenuManagementScreen = () => {
  const navigation = useNavigation<any>();
  const { categories, items, subscribeToMenu } = useMenuStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMenu();
    return () => unsubscribe();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName) return;
    await DBServices.addMenuCategory(newCatName);
    setNewCatName('');
    setCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${name}" and all its items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await DBServices.deleteMenuCategory(id);
            if (activeCategory === id) setActiveCategory('all');
          }
        }
      ]
    );
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice) {
      alert("Please enter details.");
      return;
    }
    
    if (editingItemId) {
      await DBServices.updateMenuItem(editingItemId, {
        name: newItemName,
        price: parseFloat(newItemPrice)
      });
    } else {
      if (activeCategory === 'all') {
        alert("Please select a specific category first.");
        return;
      }
      await DBServices.addMenuItem({
        name: newItemName,
        price: parseFloat(newItemPrice),
        categoryId: activeCategory,
        isAvailable: true
      });
    }
    
    setNewItemName('');
    setNewItemPrice('');
    setEditingItemId(null);
    setItemModalOpen(false);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemPrice(item.price.toString());
    setItemModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setNewItemName('');
    setNewItemPrice('');
    setItemModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => await DBServices.deleteMenuItem(id) }
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: MenuItem }) => (
    <View className="flex-row justify-between items-center bg-white p-4 mb-2 rounded-xl border border-gray-100 shadow-sm mx-4">
      <View className="flex-1 mr-4">
        <Text className="font-bold text-gray-800 text-base">{item.name}</Text>
        <Text className="text-gray-500 mt-1">₹{Number(item.price || 0).toFixed(2)}</Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity 
          className="p-2 bg-blue-50 rounded-full"
          onPress={() => openEditModal(item)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Pencil size={20} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity 
          className="p-2 bg-red-50 rounded-full"
          onPress={() => handleDeleteItem(item.id)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Trash2 size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">Manage Menu</Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="mr-4" onPress={() => setCategoryModalOpen(true)}>
            <Plus size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="py-2 border-b border-gray-100 flex-row items-center">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All' }, ...categories]}
          keyExtractor={(item, index) => item?.id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className={`px-4 py-2 mx-2 rounded-full flex-row items-center ${activeCategory === item.id ? 'bg-[#5D3FD3]' : 'bg-gray-100'}`}
              onPress={() => setActiveCategory(item.id)}
              onLongPress={() => item.id !== 'all' && handleDeleteCategory(item.id, item.name)}
            >
              <Text className={`${activeCategory === item.id ? 'text-white font-bold' : 'text-gray-600'}`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <View className="p-2 flex-row justify-between items-center bg-gray-50">
         <Text className="text-xs text-gray-500 italic ml-2">Tip: Long press a category to delete it</Text>
         {activeCategory !== 'all' && (
          <TouchableOpacity onPress={openAddModal}>
             <Text className="text-[#5D3FD3] font-bold">+ Add Item</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={activeCategory === 'all' ? items : items.filter(i => i.categoryId === activeCategory)}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id || index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No items found.</Text>}
      />

      {/* Add Category Modal */}
      <Modal visible={isCategoryModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-6 rounded-2xl w-full">
            <Text className="text-xl font-bold mb-4">New Category</Text>
            <Input placeholder="Category Name" value={newCatName} onChangeText={setNewCatName} />
            <View className="flex-row justify-between mt-4" style={{ gap: 16 }}>
              <Button title="Cancel" variant="outline" onPress={() => setCategoryModalOpen(false)} className="flex-1" />
              <Button title="Save" onPress={handleAddCategory} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal visible={isItemModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-6 rounded-2xl w-full">
            <Text className="text-xl font-bold mb-4">{editingItemId ? 'Edit Item' : 'New Item'}</Text>
            <Input placeholder="Item Name" value={newItemName} onChangeText={setNewItemName} />
            <Input placeholder="Price (₹)" value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="numeric" />
            <View className="flex-row justify-between mt-4" style={{ gap: 16 }}>
              <Button title="Cancel" variant="outline" onPress={() => {
                setItemModalOpen(false);
                setEditingItemId(null);
                setNewItemName('');
                setNewItemPrice('');
              }} className="flex-1" />
              <Button title={editingItemId ? 'Update' : 'Save'} onPress={handleAddItem} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
