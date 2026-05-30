import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Settings, LogOut, Users, ClipboardList, Utensils, ChevronRight } from 'lucide-react-native';
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

  const getInitials = (name?: string) => {
    if (!name) return 'US';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 flex-row">
        {/* Sidebar */}
        <View className="w-3/4 max-w-[300px] bg-[#0F172A] h-full shadow-2xl">
          {/* Header */}
          <View className="p-6 pt-12 border-b border-slate-800 flex-row justify-between items-center bg-[#1E293B]">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-[#5D3FD3] rounded-full items-center justify-center shadow-sm">
                <Text className="text-white font-bold text-base">{getInitials(user?.name)}</Text>
              </View>
              <View>
                <Text className="text-white font-bold text-base capitalize">{user?.name || 'User'}</Text>
                <Text className="text-indigo-300 text-xs mt-0.5 capitalize">{user?.role || 'Staff'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-slate-800">
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View className="p-4 flex-1 bg-[#0F172A]">
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <TouchableOpacity
                className="flex-row items-center justify-between py-4 px-3 mb-1.5 rounded-xl bg-slate-800/40 border border-slate-800/60"
                onPress={() => navigateTo(Routes.ORDERS)}
              >
                <View className="flex-row items-center">
                  <ClipboardList size={22} color="#818CF8" />
                  <Text className="ml-4 text-base text-slate-200 font-medium">Orders</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
            )}

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <TouchableOpacity
                className="flex-row items-center justify-between py-4 px-3 mb-1.5 rounded-xl bg-slate-800/40 border border-slate-800/60"
                onPress={() => navigateTo(Routes.MENU_MANAGEMENT)}
              >
                <View className="flex-row items-center">
                  <Utensils size={22} color="#818CF8" />
                  <Text className="ml-4 text-base text-slate-200 font-medium">Manage Menu</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
            )}

            {user?.role === 'admin' && (
              <TouchableOpacity
                className="flex-row items-center justify-between py-4 px-3 mb-1.5 rounded-xl bg-slate-800/40 border border-slate-800/60"
                onPress={() => navigateTo(Routes.USER_MANAGEMENT)}
              >
                <View className="flex-row items-center">
                  <Users size={22} color="#818CF8" />
                  <Text className="ml-4 text-base text-slate-200 font-medium">User Management</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-row items-center justify-between py-4 px-3 mb-1.5 rounded-xl bg-slate-800/40 border border-slate-800/60"
              onPress={() => navigateTo(Routes.SETTINGS)}
            >
              <View className="flex-row items-center">
                <Settings size={22} color="#818CF8" />
                <Text className="ml-4 text-base text-slate-200 font-medium">Printer Settings</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="p-4 border-t border-slate-800 bg-[#0F172A]">
            <TouchableOpacity
              className="flex-row items-center justify-center py-3.5 bg-red-950/20 border border-red-900/50 rounded-xl"
              onPress={() => {
                onClose();
                logout();
              }}
            >
              <LogOut size={20} color="#F87171" />
              <Text className="ml-3 text-base text-red-400 font-semibold">Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backdrop overlay */}
        <TouchableOpacity
          className="flex-1 bg-black/60"
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};
