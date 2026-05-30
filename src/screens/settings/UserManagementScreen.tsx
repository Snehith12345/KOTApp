import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Trash2, Pencil, Phone, Shield, User, Lock, X } from 'lucide-react-native';
import { DBServices } from '../../services/firebase/db';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

interface UserItem {
  id: string;
  name: string;
  mobile: string;
  role: 'captain' | 'manager' | 'admin';
  password?: string;
}

export const UserManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'captain' | 'manager' | 'admin'>('captain');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const unsubscribe = DBServices.subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers as UserItem[]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNameChange = (text: string) => {
    setName(text);
    if (!text.trim()) {
      setNameError('Full name is required.');
    } else {
      setNameError('');
    }
  };

  const handleMobileChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setMobile(sanitized);

    if (editingUserId) {
      setMobileError('');
      return;
    }

    if (!sanitized) {
      setMobileError('Mobile number is required.');
    } else if (sanitized.length !== 10 && sanitized !== 'admin') {
      setMobileError('Mobile number must be exactly 10 digits.');
    } else if (users.some(u => u.mobile === sanitized)) {
      setMobileError('This mobile number is already taken.');
    } else {
      setMobileError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (!text.trim()) {
      setPasswordError('Password is required.');
    } else if (text.trim().length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError('');
    }
  };

  const handleSaveUser = async () => {
    const trimmedName = name.trim();
    const sanitizedMobile = mobile.replace(/[^0-9]/g, '');
    const trimmedPassword = password.trim();

    let hasError = false;

    if (!trimmedName) {
      setNameError('Full name is required.');
      hasError = true;
    }

    if (!sanitizedMobile) {
      setMobileError('Mobile number is required.');
      hasError = true;
    } else if (sanitizedMobile.length !== 10 && editingUserId !== 'admin') {
      setMobileError('Mobile number must be exactly 10 digits.');
      hasError = true;
    } else if (!editingUserId && users.some(u => u.mobile === sanitizedMobile)) {
      setMobileError('This mobile number is already taken.');
      hasError = true;
    }

    if (!trimmedPassword) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    try {
      if (editingUserId) {
        await DBServices.updateUser(editingUserId, {
          name: trimmedName,
          mobile: sanitizedMobile,
          role,
          password: trimmedPassword
        });
      } else {
        await DBServices.addUser({
          name: trimmedName,
          mobile: sanitizedMobile,
          role,
          password: trimmedPassword
        });
      }

      setModalOpen(false);
      clearForm();
    } catch (e: any) {
      Alert.alert('Error', `Error saving user: ${e.message}`);
    }
  };

  const clearForm = () => {
    setName('');
    setMobile('');
    setPassword('');
    setRole('captain');
    setEditingUserId(null);
    setNameError('');
    setMobileError('');
    setPasswordError('');
  };

  const openAddModal = () => {
    clearForm();
    setModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUserId(user.id);
    setName(user.name);
    setMobile(user.mobile);
    setPassword(user.password || '');
    setRole(user.role);
    setNameError('');
    setMobileError('');
    setPasswordError('');
    setModalOpen(true);
  };

  const handleDeleteUser = (user: UserItem) => {
    if (user.id === 'admin') {
      Alert.alert("Error", "Cannot delete the primary admin account.");
      return;
    }
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await DBServices.deleteUserAccount(user.id);
            } catch (e: any) {
              Alert.alert('Error', `Could not delete user: ${e.message}`);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = useCallback(({ item }: { item: UserItem }) => (
    <View className="bg-white p-4 mb-3 rounded-xl border border-gray-100 shadow-sm mx-4 flex-row justify-between items-center">
      <View className="flex-1 mr-4">
        <View className="flex-row items-center gap-2 mb-1.5">
          <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
          <View className={`px-2 py-0.5 rounded-full ${
            item.role === 'admin' ? 'bg-red-100' : item.role === 'manager' ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <Text className={`text-[10px] font-semibold uppercase tracking-wide ${
              item.role === 'admin' ? 'text-red-700' : item.role === 'manager' ? 'text-amber-700' : 'text-blue-700'
            }`}>
              {item.role}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center mb-1">
          <Phone size={13} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm ml-1">ID / Mob: {item.mobile}</Text>
        </View>

        <View className="flex-row items-center">
          <Shield size={13} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm ml-1">Password: <Text className="font-semibold text-gray-700">{item.password}</Text></Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity 
          className="p-2.5 bg-blue-50 rounded-full"
          onPress={() => openEditModal(item)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Pencil size={18} color="#2563EB" />
        </TouchableOpacity>
        {item.id !== 'admin' && (
          <TouchableOpacity 
            className="p-2.5 bg-red-50 rounded-full"
            onPress={() => handleDeleteUser(item)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Trash2 size={18} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [users]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">User Management</Text>
        </View>
        <TouchableOpacity onPress={openAddModal} className="p-1">
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5D3FD3" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-400 font-medium">No users created yet.</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit User Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-slate-900/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-[400px] shadow-2xl border border-slate-100">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800">
                {editingUserId ? 'Edit User Details' : 'Create New User'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalOpen(false)}
                className="p-1.5 bg-slate-100 rounded-full"
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>
            
            <Input 
              label="Full Name" 
              placeholder="e.g. John Doe" 
              value={name} 
              onChangeText={handleNameChange}
              error={nameError}
              leftIcon={<User size={18} color="#94A3B8" />}
            />
            
            <Input 
              label="Mobile Number (acts as User ID)" 
              placeholder="e.g. 9876543210" 
              value={mobile} 
              onChangeText={handleMobileChange} 
              keyboardType="phone-pad"
              editable={editingUserId ? false : true}
              error={mobileError}
              leftIcon={<Phone size={18} color="#94A3B8" />}
              style={{ color: editingUserId ? '#64748B' : '#1E293B', fontWeight: editingUserId ? '600' : 'normal' }}
            />
            
            <Input 
              label="Password" 
              placeholder="Enter password (min 6 chars)" 
              value={password} 
              onChangeText={handlePasswordChange} 
              autoCapitalize="none"
              error={passwordError}
              leftIcon={<Lock size={18} color="#94A3B8" />}
            />

            {editingUserId !== 'admin' && (
              <View className="mb-6">
                <Text className="text-slate-700 mb-2 font-semibold text-sm">Assign Role</Text>
                <View className="flex-row justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['captain', 'manager', 'admin'] as const).map(r => (
                    <TouchableOpacity
                      key={r}
                      className={`flex-1 py-2.5 rounded-lg ${role === r ? 'bg-[#5D3FD3] shadow-sm' : ''}`}
                      onPress={() => setRole(r)}
                    >
                      <Text className={`text-center font-bold capitalize text-xs ${role === r ? 'text-white' : 'text-slate-500'}`}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View className="flex-row justify-between mt-2" style={{ gap: 16 }}>
              <Button 
                title="Cancel" 
                variant="outline" 
                onPress={() => setModalOpen(false)} 
                className="flex-1 rounded-xl" 
              />
              <Button 
                title={editingUserId ? 'Update' : 'Create'} 
                onPress={handleSaveUser} 
                className="flex-1 rounded-xl shadow-lg"
                disabled={Boolean(nameError || mobileError || passwordError || !name || !mobile || !password)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
