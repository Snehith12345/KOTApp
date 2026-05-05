import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name={Routes.AUTH} component={AuthNavigator} />
        ) : (
          <Stack.Screen name={Routes.APP} component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
