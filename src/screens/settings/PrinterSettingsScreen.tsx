import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { usePrinterStore } from '../../store/printer.store';
import { Button } from '../../components/common/Button';
import { printerService } from '../../services/printer/printer.service';
import { ESCPOSService } from '../../services/printer/escpos.service';

export const PrinterSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { settings, setSettings } = usePrinterStore();
  
  const [ipAddress, setIpAddress] = useState(settings.ipAddress);
  const [port, setPort] = useState(settings.port.toString());
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    setSettings({
      ...settings,
      ipAddress,
      port: parseInt(port, 10),
    });
    alert('Settings Saved!');
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      await printerService.connect(ipAddress, parseInt(port, 10));
      
      const buffer = ESCPOSService.buildKOT(
        99,
        0,
        'Test User',
        [{ itemName: 'Test Item', qty: 1, price: 0 }],
        'This is a test print'
      );

      await printerService.print(buffer);
      printerService.disconnect();
      
      alert('Test Print Successful!');
    } catch (error: any) {
      alert(`Test Print Failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">Printer Settings</Text>
      </View>

      <ScrollView className="p-6">
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Printer Type</Text>
          <View className="bg-gray-50 border border-gray-300 rounded-lg p-3">
             <Text className="text-gray-800">LAN / Ethernet</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Printer Name</Text>
          <TextInput
            value={settings.printerName}
            editable={false}
            className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-500"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">IP Address</Text>
          <TextInput
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="numeric"
            className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800"
          />
        </View>

        <View className="mb-8">
          <Text className="text-gray-700 font-medium mb-2">Port</Text>
          <TextInput
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
            className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800"
          />
        </View>

        <Button 
          title="TEST PRINT" 
          onPress={handleTestPrint} 
          isLoading={isTesting}
          className="mb-4"
        />
        
        <Button 
          title="SAVE SETTINGS" 
          onPress={handleSave} 
          variant="outline"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
