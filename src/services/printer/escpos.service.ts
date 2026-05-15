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

  static buildKOT(kotNo: number | string, tableNo: number, captainName: string, items: any[], specialNote?: string): Uint8Array {
    let buffer: number[] = [];

    // Initialize printer
    buffer.push(...this.INIT);

    // Header
    buffer.push(...this.ALIGN_CENTER);
    buffer.push(...this.stringToBytes('Running Table\n'));
    
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    buffer.push(...this.stringToBytes(`${formattedDate}\n`));
    
    buffer.push(...this.stringToBytes(`KOT - ${kotNo}\n`));
    
    buffer.push(...this.BOLD_ON);
    if (tableNo === 0) {
      buffer.push(...this.stringToBytes('Pick Up\n'));
    } else {
      buffer.push(...this.stringToBytes('Dine In\n'));
      buffer.push(...this.stringToBytes(`Table No: ${tableNo}\n`));
    }
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.ALIGN_LEFT);
    buffer.push(...this.stringToBytes('--------------------------------\n'));
    
    // Items header
    buffer.push(...this.stringToBytes('Item                Special Qty.\n'));
    buffer.push(...this.stringToBytes('                    Note\n'));
    
    // Items
    items.forEach(item => {
      let nameStr = (item.itemName || '');
      let line1Name = nameStr.substring(0, 19);
      let paddedName = line1Name.padEnd(20, ' ');
      
      let note = (item.note || '--').substring(0, 7).padEnd(8, ' ');
      let qty = (item.qty || 1).toString().padStart(4, ' ');
      
      buffer.push(...this.stringToBytes(`${paddedName}${note}${qty}\n`));
      
      if (nameStr.length > 19) {
        let remaining = nameStr.substring(19);
        // split remaining into 32 char chunks
        for (let i = 0; i < remaining.length; i += 32) {
          buffer.push(...this.stringToBytes(`${remaining.substring(i, i + 32)}\n`));
        }
      }
    });

    buffer.push(...this.stringToBytes('--------------------------------\n'));
    
    if (specialNote) {
      buffer.push(...this.stringToBytes(`Note: ${specialNote}\n`));
      buffer.push(...this.stringToBytes('--------------------------------\n'));
    }

    // Feed and cut
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.CUT);

    return new Uint8Array(buffer);
  }

  static buildKitchenSlip(tableNo: number, itemName: string, qty: number): Uint8Array {
    // Reuse buildKOT for exactly the same format
    return this.buildKOT('NEW ITEM', tableNo, 'App', [{ itemName, qty, note: '--' }]);
  }

  private static stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
}
