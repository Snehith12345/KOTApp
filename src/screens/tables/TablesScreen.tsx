import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Menu as MenuIcon, Plus, Search } from 'lucide-react-native';
import { useTableStore } from '../../store/table.store';
import { Routes } from '../../constants/routes';
import { Table } from '../../types/table.types';
import { DBServices } from '../../services/firebase/db';
import { HamburgerMenu } from '../../components/common/HamburgerMenu';

export const TablesScreen = () => {
  const navigation = useNavigation<any>();
  const { tables, isLoading, subscribeToTables } = useTableStore();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTables();
    return () => unsubscribe();
  }, []);

  const handleAddTable = async () => {
    setIsAdding(true);
    try {
      const nextTableNo = tables.length > 0 ? Math.max(...tables.map(t => t.tableNo)) + 1 : 1;
      await Promise.race([
        DBServices.addTable(nextTableNo),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connecting to Firestore. Is the database created?')), 5000))
      ]);
    } catch (e: any) {
      alert(`Failed to add table: ${e.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'border-green-500 text-green-500';
      case 'running': return 'border-orange-500 text-orange-500';
      default: return 'border-gray-500 text-gray-500';
    }
  };

  const getStatusBg = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-50';
      case 'running': return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  const filteredTables = tables.filter(t => t.tableNo.toString().includes(search));

  const handleDeleteTable = (id: string, tableNo: number) => {
    Alert.alert(
      'Delete Table',
      `Are you sure you want to delete Table ${tableNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await DBServices.deleteTable(id);
            } catch (e: any) {
              Alert.alert('Error', `Could not delete table: ${e.message}`);
            }
          }
        }
      ]
    );
  };

  const renderTable = useCallback(({ item }: { item: Table }) => (
    <TouchableOpacity 
      className={`w-[30%] aspect-square m-[1.5%] rounded-xl border-2 items-center justify-center ${getStatusColor(item.status)} ${getStatusBg(item.status)}`}
      onPress={() => {
        navigation.navigate(Routes.MENU, { tableId: item.id, tableNo: item.tableNo });
      }}
      onLongPress={() => handleDeleteTable(item.id, item.tableNo)}
    >
      <Text className={`text-2xl font-bold ${getStatusColor(item.status).split(' ')[1]}`}>{item.tableNo}</Text>
      <Text className={`text-xs mt-1 ${getStatusColor(item.status).split(' ')[1]}`}>{item.status}</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HamburgerMenu 
        isVisible={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onAddCategoryClick={() => {}}
      />

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <MenuIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Tables</Text>
        <TouchableOpacity onPress={handleAddTable} disabled={isAdding}>
          {isAdding ? <ActivityIndicator size="small" color="#000" /> : <Plus size={24} color="#000" />}
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <TouchableOpacity 
          className="bg-[#5D3FD3] rounded-lg px-4 py-4 mb-4 flex-row items-center justify-center shadow-sm"
          onPress={() => navigation.navigate(Routes.MENU, { tableId: '0', tableNo: 0 })}
        >
          <Text className="text-white font-bold text-lg">🛍️ New Pick Up Order</Text>
        </TouchableOpacity>

        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
          <Search size={20} color="#666" />
          <TextInput 
            placeholder="Search Table" 
            className="flex-1 ml-2 text-base"
            value={search}
            onChangeText={setSearch}
            keyboardType="numeric"
          />
        </View>

        <View className="flex-row justify-between mb-4 px-2 items-center">
          <View className="flex-row gap-4">
            <Text className="font-bold text-[#5D3FD3]">All {tables.length}</Text>
            <Text className="font-bold text-green-500">Available {tables.filter(t => t.status === 'available').length}</Text>
            <Text className="font-bold text-orange-500">Running {tables.filter(t => t.status === 'running').length}</Text>
          </View>
        </View>
        
        <Text className="text-xs text-gray-400 italic mb-2 ml-2">Tip: Long press a table to delete it</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#5D3FD3" className="mt-10" />
        ) : (
          <FlatList
            data={filteredTables}
            renderItem={renderTable}
            keyExtractor={(item, index) => item?.id || index.toString()}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No tables found. Click + to add one.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
