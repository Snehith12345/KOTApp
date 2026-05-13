import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Settings, PlusCircle, LogOut } from 'lucide-react-native';
import { Routes } from '../../constants/routes';
import { useAuthStore } from '../../store/auth.store';

const { width } = Dimensions.get('window');

interface HamburgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onAddCategoryClick: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isVisible, onClose, onAddCategoryClick }) => {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuthStore();

  if (!isVisible) return null;

  const navigateTo = (route: string) => {
    onClose();
    navigation.navigate(route);
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 flex-row">
        {/* Sidebar */}
        <View className="w-3/4 max-w-[300px] bg-white h-full shadow-2xl">
          <View className="p-6 pt-12 border-b border-gray-100 flex-row justify-between items-center bg-[#5D3FD3]">
            <View>
              <Text className="text-white font-bold text-xl">Vasudha</Text>

            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View className="p-4 flex-1">
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-50"
              onPress={() => navigateTo(Routes.ORDERS)}
            >
              <PlusCircle size={24} color="#4B5563" />
              <Text className="ml-4 text-lg text-gray-700">Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-50"
              onPress={() => navigateTo(Routes.MENU_MANAGEMENT)}
            >
              <PlusCircle size={24} color="#4B5563" />
              <Text className="ml-4 text-lg text-gray-700">Manage Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-50"
              onPress={() => navigateTo(Routes.SETTINGS)}
            >
              <Settings size={24} color="#4B5563" />
              <Text className="ml-4 text-lg text-gray-700">Printer Settings</Text>
            </TouchableOpacity>
          </View>

          <View className="p-4 border-t border-gray-100">
            <TouchableOpacity
              className="flex-row items-center py-4"
              onPress={() => {
                onClose();
                logout();
              }}
            >
              <LogOut size={24} color="#DC2626" />
              <Text className="ml-4 text-lg text-red-600 font-bold">Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backdrop overlay */}
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};
