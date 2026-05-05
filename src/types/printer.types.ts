export interface PrinterSettings {
  printerType: 'LAN' | 'Bluetooth' | 'USB';
  printerName: string;
  ipAddress: string;
  port: number;
}
