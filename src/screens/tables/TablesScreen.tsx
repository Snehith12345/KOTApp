import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Menu as MenuIcon, Plus, Search } from 'lucide-react-native';
import { useTableStore } from '../../store/table.store';
import { useCartStore } from '../../store/cart.store';
import { Routes } from '../../constants/routes';
import { Table } from '../../types/table.types';
import { DBServices } from '../../services/firebase/db';
import { HamburgerMenu } from '../../components/common/HamburgerMenu';
import { useAuthStore } from '../../store/auth.store';

export const TablesScreen = () => {
  const navigation = useNavigation<any>();
  const { tables, isLoading } = useTableStore();
  const carts = useCartStore(state => state.carts);
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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

  const getStatusClasses = (status: Table['status']) => {
    switch (status) {
      case 'available': 
        return {
          bg: 'bg-emerald-50/30 border-emerald-100',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500'
        };
      case 'running': 
        return {
          bg: 'bg-amber-50/30 border-amber-100',
          text: 'text-amber-700',
          dot: 'bg-amber-500'
        };
      default: 
        return {
          bg: 'bg-slate-50 border-slate-200',
          text: 'text-slate-500',
          dot: 'bg-slate-400'
        };
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

  const renderTable = useCallback(({ item }: { item: Table }) => {
    const hasItems = carts[item.tableNo] && carts[item.tableNo].length > 0;
    const displayStatus = hasItems ? 'running' : item.status;
    const classes = getStatusClasses(displayStatus);

    return (
      <TouchableOpacity 
        className={`w-[30%] aspect-square m-[1.5%] rounded-2xl border bg-white items-center justify-center shadow-sm relative ${classes.bg}`}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate(Routes.MENU, { tableId: item.id, tableNo: item.tableNo });
        }}
        onLongPress={() => {
          if (user?.role === 'admin' || user?.role === 'manager') {
            handleDeleteTable(item.id, item.tableNo);
          }
        }}
      >
        <View className="absolute top-2.5 right-2.5 flex-row items-center">
          <View className={`w-2.5 h-2.5 rounded-full ${classes.dot}`} />
        </View>
        <Text className="text-3xl font-black text-slate-800">{item.tableNo}</Text>
        <Text className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${classes.text}`}>{displayStatus}</Text>
      </TouchableOpacity>
    );
  }, [carts, user, navigation]);

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
        {(user?.role === 'admin' || user?.role === 'manager') ? (
          <TouchableOpacity onPress={handleAddTable} disabled={isAdding}>
            {isAdding ? <ActivityIndicator size="small" color="#000" /> : <Plus size={24} color="#000" />}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <View className="flex-1 p-4">
        <TouchableOpacity 
          className="bg-[#5D3FD3] rounded-lg px-4 py-4 mb-4 flex-row items-center justify-center shadow-sm"
          onPress={() => navigation.navigate(Routes.MENU, { tableId: '0', tableNo: 0 })}
        >
          <Text className="text-white font-bold text-lg">🛍️ New Pick Up Order</Text>
        </TouchableOpacity>

        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1.5 mb-4">
          <Search size={16} color="#666" />
          <TextInput 
            placeholder="Search Table" 
            className="flex-1 ml-2 text-sm py-0.5"
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
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No tables found. Click + to add one.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
