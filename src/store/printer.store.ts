import { create } from 'zustand';
import { PrinterSettings } from '../types/printer.types';
import { PrinterConstants } from '../constants/printer';

interface PrinterState {
  settings: PrinterSettings;
  setSettings: (settings: PrinterSettings) => void;
}

export const usePrinterStore = create<PrinterState>((set) => ({
  settings: {
    printerType: PrinterConstants.DEFAULT_TYPE as any,
    printerName: 'Primary Printer',
    ipAddress: PrinterConstants.DEFAULT_IP,
    port: PrinterConstants.DEFAULT_PORT,
    kitchenIpAddress: '192.168.1.101',
    kitchenPort: 9100,
  },
  setSettings: (settings) => set({ settings }),
}));
