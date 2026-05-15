import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterSettings } from '../types/printer.types';
import { PrinterConstants } from '../constants/printer';

interface PrinterState {
  settings: PrinterSettings;
  setSettings: (settings: PrinterSettings) => void;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      settings: {
        printerType: PrinterConstants.DEFAULT_TYPE as any,
        printerName: 'Primary Printer',
        ipAddress: PrinterConstants.DEFAULT_IP,
        port: PrinterConstants.DEFAULT_PORT,
        kitchenIpAddress: '192.168.1.101',
        kitchenPort: 9100,
      },
      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'printer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
