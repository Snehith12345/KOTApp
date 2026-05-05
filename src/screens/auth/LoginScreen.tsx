import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/auth.store';
import { Routes } from '../../constants/routes';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase/config';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<any>();
  const { setUser, setLoading, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser({
        id: userCredential.user.uid,
        name: userCredential.user.email?.split('@')[0] || 'Captain',
        role: 'captain'
      });
    } catch (error: any) {
      alert(`Login Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">🍽️</Text>
          </View>
          <Text className="text-3xl font-bold text-white mb-2">Vasudha</Text>
          <Text className="text-gray-400">Kitchen Order Ticket</Text>
        </View>

        <View className="bg-white/10 p-6 rounded-2xl">
          <Text className="text-white text-center mb-6">Login to continue</Text>

          <Input
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            className="mb-4"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="mb-6"
          />

          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-gray-400">Remember me</Text>
            <Text className="text-[#5D3FD3]">Forgot Password?</Text>
          </View>

          <Button
            title="LOGIN"
            onPress={handleLogin}
            isLoading={isLoading}
          />
        </View>
        <Text className="text-center text-gray-500 mt-8">v1.0.0</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
