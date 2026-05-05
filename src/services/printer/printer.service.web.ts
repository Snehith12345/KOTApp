export class PrinterService {
  private static instance: PrinterService;

  private constructor() {}

  static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  connect(ip: string, port: number): Promise<void> {
    console.log(`[Web Mock] Connecting to printer at ${ip}:${port}`);
    return Promise.resolve();
  }

  print(data: any): Promise<void> {
    console.log('[Web Mock] Printing data:', data);
    return Promise.resolve();
  }

  disconnect() {
    console.log('[Web Mock] Disconnecting from printer');
  }
}

export const printerService = PrinterService.getInstance();
