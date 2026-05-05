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
    printerName: 'Kitchen Printer',
    ipAddress: PrinterConstants.DEFAULT_IP,
    port: PrinterConstants.DEFAULT_PORT,
  },
  setSettings: (settings) => set({ settings }),
}));
