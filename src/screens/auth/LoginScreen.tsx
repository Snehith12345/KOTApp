import React, { useEffect, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Utensils, User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/auth.store';
import { Routes } from '../../constants/routes';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<any>();
  const { setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const seedAdmin = async () => {
      try {
        const adminRef = doc(db, 'users', 'admin');
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            id: 'admin',
            name: 'Admin',
            mobile: 'admin',
            role: 'admin',
            password: 'admin'
          });
        }
      } catch (e) {
        console.warn("Failed to seed admin:", e);
      }
    };
    seedAdmin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter ID/Email and Password');
      return;
    }
    setLoading(true);
    try {
      if (email.includes('@')) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          setUser({
            id: u.id || userCredential.user.uid,
            name: u.name,
            role: u.role
          });
        } else {
          setUser({
            id: userCredential.user.uid,
            name: userCredential.user.email?.split('@')[0] || 'Admin',
            role: 'admin'
          });
        }
      } else {
        const userRef = doc(db, 'users', email.trim());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          if (u.password === password) {
            setUser({
              id: u.id,
              name: u.name,
              role: u.role
            });
          } else {
            alert('Incorrect password');
          }
        } else {
          alert('User ID / Mobile not found');
        }
      }
    } catch (error: any) {
      alert(`Login Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090D1A]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-[#5D3FD3] rounded-3xl items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <Utensils size={32} color="white" />
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-wider">Vasudha</Text>
          <Text className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1.5">Kitchen Order Ticket</Text>
        </View>

        <View className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
          <Text className="text-white text-base font-semibold text-center mb-6">Login to continue</Text>

          <Input
            placeholder="User ID / Email / Mobile"
            value={email}
            onChangeText={setEmail}
            className="mb-2"
            autoCapitalize="none"
            containerClassName="bg-slate-800/55 border border-slate-750/90 py-3"
            textClassName="text-white"
            placeholderTextColor="#64748B"
            leftIcon={<User size={18} color="#64748B" />}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            className='mb-2'
            containerClassName="bg-slate-800/55 border border-slate-750/90 py-3"
            textClassName="text-white"
            placeholderTextColor="#64748B"
            leftIcon={<Lock size={18} color="#64748B" />}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                {showPassword ? (
                  <Eye size={18} color="#64748B" />
                ) : (
                  <EyeOff size={18} color="#64748B" />
                )}
              </TouchableOpacity>
            }
          />

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-slate-400 text-xs font-medium">Remember me</Text>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text className="text-[#8F75FA] text-xs font-semibold">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="LOGIN"
            onPress={handleLogin}
            isLoading={isLoading}
            className="rounded-xl shadow-lg shadow-indigo-500/10"
          />
        </View>
        <Text className="text-center text-gray-600 text-xs mt-8">v1.1.0</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
