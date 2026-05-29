import TcpSocket from 'react-native-tcp-socket';

export class PrinterService {
  private static instance: PrinterService;
  private client: TcpSocket.Socket | null = null;

  private constructor() {}

  static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  connect(ip: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!TcpSocket || !TcpSocket.createConnection) {
          reject(new Error('Printer TCP Sockets are not supported in Expo Go. You MUST build an APK to test printing!'));
          return;
        }

        this.client = TcpSocket.createConnection({
          port,
          host: ip,
        }, () => {
          resolve();
        });

        this.client.setTimeout(5000);

        this.client.on('error', (error) => {
          reject(error);
        });

        this.client.on('timeout', () => {
          reject(new Error('Connection timeout'));
          this.disconnect();
        });
      } catch (error: any) {
        // If the native module is missing (e.g. running in Expo Go), it throws a TypeError
        if (error instanceof TypeError && error.message.includes('null')) {
          reject(new Error('Printer is not supported in Expo Go. Please build the APK to test printing.'));
        } else {
          reject(error);
        }
      }
    });
  }

  print(data: Buffer | string | Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('Printer not connected'));
        return;
      }
      this.client.write(data, 'ascii', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        const clientInstance = this.client;
        
        let isClosed = false;
        const cleanup = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              clientInstance.destroy();
            } catch (err) {
              console.warn('Error destroying client:', err);
            }
            if (this.client === clientInstance) {
              this.client = null;
            }
            resolve();
          }
        };

        const safetyTimeout = setTimeout(cleanup, 1500);

        clientInstance.once('close', () => {
          clearTimeout(safetyTimeout);
          cleanup();
        });

        clientInstance.once('error', (err) => {
          console.warn('Socket error during disconnect:', err);
          clearTimeout(safetyTimeout);
          cleanup();
        });

        try {
          clientInstance.end();
        } catch (err) {
          console.warn('Error calling socket.end():', err);
          clearTimeout(safetyTimeout);
          cleanup();
        }
      } else {
        resolve();
      }
    });
  }
}

export const printerService = PrinterService.getInstance();
