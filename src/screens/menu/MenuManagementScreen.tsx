import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Trash2, Pencil, Search } from 'lucide-react-native';
import { useMenuStore } from '../../store/menu.store';
import { DBServices } from '../../services/firebase/db';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { MenuItem, MenuItemVariant } from '../../types/menu.types';

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

  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!newItemName) {
      alert("Please enter item name.");
      return;
    }

    let finalPrice = 0;
    let cleanVariants: MenuItemVariant[] | null = null;

    if (hasVariants) {
      if (variants.length === 0) {
        alert("Please add at least one variant.");
        return;
      }
      for (const v of variants) {
        if (!v.name.trim() || !v.price.trim() || isNaN(parseFloat(v.price))) {
          alert("All variants must have a name and a valid price.");
          return;
        }
      }
      cleanVariants = variants.map(v => ({
        name: v.name.trim(),
        price: parseFloat(v.price)
      }));
      finalPrice = cleanVariants[0].price;
    } else {
      if (!newItemPrice || isNaN(parseFloat(newItemPrice))) {
        alert("Please enter a valid price.");
        return;
      }
      finalPrice = parseFloat(newItemPrice);
    }
    
    try {
      if (editingItemId) {
        await DBServices.updateMenuItem(editingItemId, {
          name: newItemName.trim(),
          price: finalPrice,
          variants: cleanVariants as any
        });
      } else {
        if (activeCategory === 'all') {
          alert("Please select a specific category first.");
          return;
        }
        await DBServices.addMenuItem({
          name: newItemName.trim(),
          price: finalPrice,
          categoryId: activeCategory,
          isAvailable: true,
          variants: cleanVariants as any
        });
      }
      
      setNewItemName('');
      setNewItemPrice('');
      setHasVariants(false);
      setVariants([]);
      setEditingItemId(null);
      setItemModalOpen(false);
    } catch (e: any) {
      alert(`Error saving menu item: ${e.message}`);
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    if (item.variants && item.variants.length > 0) {
      setHasVariants(true);
      setVariants(item.variants.map(v => ({ name: v.name, price: v.price.toString() })));
      setNewItemPrice('');
    } else {
      setHasVariants(false);
      setVariants([]);
      setNewItemPrice(item.price.toString());
    }
    setItemModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setNewItemName('');
    setNewItemPrice('');
    setHasVariants(false);
    setVariants([]);
    setItemModalOpen(true);
  };

  const addVariantRow = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const updateVariantRow = (index: number, key: 'name' | 'price', value: string) => {
    const newVariants = [...variants];
    newVariants[index][key] = value;
    setVariants(newVariants);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, idx) => idx !== index));
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
        {item.variants && item.variants.length > 0 ? (
          <View className="mt-2 flex-row flex-wrap gap-1">
            {item.variants.map((v, i) => (
              <View key={i} className="bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                <Text className="text-gray-600 text-xs font-medium">{v.name}: ₹{v.price}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-gray-500 mt-1">₹{Number(item.price || 0).toFixed(2)}</Text>
        )}
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

  const filteredItems = items
    .filter(i => activeCategory === 'all' || i.categoryId === activeCategory)
    .filter(i => (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

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

      <View className="py-2 border-b border-gray-100 flex-row items-center">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All' }, ...categories]}
          keyExtractor={(item, index) => item?.id || index.toString()}
          keyboardShouldPersistTaps="handled"
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
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id || index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
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
          <View className="bg-white p-6 rounded-2xl w-full max-w-[450px]" style={{ maxHeight: '85%' }}>
            <Text className="text-xl font-bold mb-4">{editingItemId ? 'Edit Item' : 'New Item'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginBottom: 16 }}>
              <Input placeholder="Item Name" value={newItemName} onChangeText={setNewItemName} />
              
              <TouchableOpacity 
                className="flex-row items-center mb-4 mt-2" 
                onPress={() => setHasVariants(!hasVariants)}
                activeOpacity={0.8}
              >
                <View className={`w-5 h-5 rounded border border-gray-300 mr-2 items-center justify-center ${hasVariants ? 'bg-[#5D3FD3] border-[#5D3FD3]' : ''}`}>
                  {hasVariants && <Text className="text-white text-[10px] font-bold">✓</Text>}
                </View>
                <Text className="text-gray-700 font-medium text-sm">Has Size/Quantity Options?</Text>
              </TouchableOpacity>

              {!hasVariants ? (
                <Input placeholder="Price (₹)" value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="numeric" />
              ) : (
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-gray-700">Variants</Text>
                    <TouchableOpacity onPress={addVariantRow}>
                      <Text className="text-[#5D3FD3] font-bold">+ Add Option</Text>
                    </TouchableOpacity>
                  </View>

                  {variants.map((v, index) => (
                    <View key={index} className="flex-row items-center gap-2 mb-2">
                      <TextInput 
                        placeholder="Option (e.g. Single)" 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 mr-1"
                        value={v.name}
                        onChangeText={(val) => updateVariantRow(index, 'name', val)}
                        style={{ flex: 2 }}
                      />
                      <TextInput 
                        placeholder="Price" 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 mr-1"
                        value={v.price}
                        onChangeText={(val) => updateVariantRow(index, 'price', val)}
                        keyboardType="numeric"
                        style={{ flex: 1 }}
                      />
                      <TouchableOpacity 
                        className="p-2 bg-red-50 rounded"
                        onPress={() => removeVariantRow(index)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View className="flex-row justify-between mt-4" style={{ gap: 16 }}>
              <Button title="Cancel" variant="outline" onPress={() => {
                setItemModalOpen(false);
                setEditingItemId(null);
                setNewItemName('');
                setNewItemPrice('');
                setHasVariants(false);
                setVariants([]);
              }} className="flex-1" />
              <Button title={editingItemId ? 'Update' : 'Save'} onPress={handleAddItem} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
