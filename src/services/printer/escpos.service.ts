export class ESCPOSService {
  static INIT = [0x1B, 0x40];
  static ALIGN_LEFT = [0x1B, 0x61, 0x00];
  static ALIGN_CENTER = [0x1B, 0x61, 0x01];
  static ALIGN_RIGHT = [0x1B, 0x61, 0x02];
  static BOLD_ON = [0x1B, 0x45, 0x01];
  static BOLD_OFF = [0x1B, 0x45, 0x00];
  static DOUBLE_HEIGHT = [0x1B, 0x21, 0x10];
  static DOUBLE_WIDTH = [0x1B, 0x21, 0x20];
  static DOUBLE_HEIGHT_WIDTH = [0x1B, 0x21, 0x30];
  static NORMAL_SIZE = [0x1B, 0x21, 0x00];
  static CUT = [0x1D, 0x56, 0x41, 0x10];
  static NEW_LINE = [0x0A];

  static buildKOT(kotNo: number, tableNo: number, captainName: string, items: any[], specialNote?: string): Uint8Array {
    let buffer: number[] = [];

    // Initialize printer
    buffer.push(...this.INIT);

    // Header
    buffer.push(...this.ALIGN_CENTER);
    buffer.push(...this.DOUBLE_HEIGHT_WIDTH);
    buffer.push(...this.stringToBytes(`KOT - ${kotNo}\n`));
    buffer.push(...this.NORMAL_SIZE);
    
    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes(`Table No: ${tableNo}\n`));
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.stringToBytes('--------------------------------\n'));

    // Details
    buffer.push(...this.ALIGN_LEFT);
    buffer.push(...this.stringToBytes(`Captain: ${captainName}\n`));
    const date = new Date();
    buffer.push(...this.stringToBytes(`Time: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`));
    
    buffer.push(...this.stringToBytes('--------------------------------\n'));
    
    // Items
    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes(`Qty    Item\n`));
    buffer.push(...this.BOLD_OFF);
    buffer.push(...this.stringToBytes('--------------------------------\n'));

    items.forEach(item => {
      const qtyStr = item.qty.toString().padEnd(6, ' ');
      buffer.push(...this.stringToBytes(`${qtyStr} ${item.itemName}\n`));
      if (item.note) {
        buffer.push(...this.stringToBytes(`       * ${item.note}\n`));
      }
    });

    buffer.push(...this.stringToBytes('--------------------------------\n'));
    
    if (specialNote) {
      buffer.push(...this.BOLD_ON);
      buffer.push(...this.stringToBytes(`Note: ${specialNote}\n`));
      buffer.push(...this.BOLD_OFF);
      buffer.push(...this.stringToBytes('--------------------------------\n'));
    }

    // Feed and cut
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.CUT);

    return new Uint8Array(buffer);
  }

  private static stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
}
