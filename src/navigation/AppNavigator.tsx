import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TablesScreen } from '../screens/tables/TablesScreen';
import { MenuScreen } from '../screens/menu/MenuScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { RunningOrdersScreen } from '../screens/orders/RunningOrdersScreen';
import { PrinterSettingsScreen } from '../screens/settings/PrinterSettingsScreen';
import { MenuManagementScreen } from '../screens/menu/MenuManagementScreen';
import { Routes } from '../constants/routes';
import { useTableStore } from '../store/table.store';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { subscribeToTables } = useTableStore();

  useEffect(() => {
    const unsubscribe = subscribeToTables();
    return () => unsubscribe();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.TABLES} component={TablesScreen} />
      <Stack.Screen name={Routes.MENU} component={MenuScreen} />
      <Stack.Screen name={Routes.MENU_MANAGEMENT} component={MenuManagementScreen} />
      <Stack.Screen name={Routes.CART} component={CartScreen} />
      <Stack.Screen name={Routes.ORDERS} component={RunningOrdersScreen} />
      <Stack.Screen name={Routes.SETTINGS} component={PrinterSettingsScreen} />
    </Stack.Navigator>
  );
};
