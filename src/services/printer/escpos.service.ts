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

  static buildBill(billNo: number | string, tableNo: number, cashierName: string, items: any[]): Uint8Array {
    let buffer: number[] = [];

    buffer.push(...this.INIT);
    buffer.push(...this.ALIGN_CENTER);

    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes('VASUDA FAMILY RESTURTANT\n'));
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.stringToBytes('Address: 2nd floor, Kaveri Enclave,\n'));
    buffer.push(...this.stringToBytes('Kompally, above SWISS CASTLE,\n'));
    buffer.push(...this.stringToBytes('Hyderabad\n'));
    buffer.push(...this.stringToBytes('GST NO: 36DLVPS528K1ZW\n'));

    buffer.push(...this.ALIGN_LEFT);
    buffer.push(...this.stringToBytes('--------------------------------\n'));
    buffer.push(...this.stringToBytes('Name:\n'));
    buffer.push(...this.stringToBytes('--------------------------------\n'));

    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    let orderTypeStr = tableNo === 0 ? 'Pick Up' : `Table No: ${tableNo}`;

    buffer.push(...this.stringToBytes(`Date: ${formattedDate}      ${orderTypeStr}\n`));
    buffer.push(...this.stringToBytes(`${formattedTime}\n`));
    buffer.push(...this.stringToBytes(`Cashier: ${cashierName.substring(0, 10).padEnd(10)} Bill No.: ${billNo}\n`));

    buffer.push(...this.stringToBytes('--------------------------------\n'));
    // Item (14) Qty(4) Price(7) Amt(7) -> 32 chars
    buffer.push(...this.stringToBytes('Item           Qty  Price   Amt\n'));
    buffer.push(...this.stringToBytes('--------------------------------\n'));

    let grandTotal = 0;
    let totalQty = 0;

    items.forEach(item => {
      let qty = (item.qty || 1);
      let price = (item.price || 0);
      grandTotal += price * qty;
      totalQty += qty;

      // Calculate reverse inclusive GST for individual item
      let basePrice = Math.round((price / 1.05) * 100) / 100;
      let baseAmount = Math.round((basePrice * qty) * 100) / 100;

      let nameStr = (item.itemName || '');
      let line1Name = nameStr.substring(0, 14).padEnd(14, ' ');

      let qtyStr = qty.toString().padStart(3, ' ');
      let priceStr = basePrice.toFixed(2).padStart(7, ' ');
      let amtStr = baseAmount.toFixed(2).padStart(7, ' ');

      buffer.push(...this.stringToBytes(`${line1Name}${qtyStr}${priceStr}${amtStr}\n`));

      if (nameStr.length > 14) {
        let remaining = nameStr.substring(14);
        for (let i = 0; i < remaining.length; i += 32) {
          buffer.push(...this.stringToBytes(`${remaining.substring(i, i + 32)}\n`));
        }
      }
    });

    buffer.push(...this.stringToBytes('--------------------------------\n'));

    const subTotalNum = grandTotal / 1.05;
    const subTotal = Math.round(subTotalNum * 100) / 100;
    const totalTax = grandTotal - subTotal;
    const cgst = Math.round((totalTax / 2) * 100) / 100;
    const sgst = Math.round((totalTax / 2) * 100) / 100;
    const roundOff = Math.round((grandTotal - (subTotal + cgst + sgst)) * 100) / 100;

    buffer.push(...this.ALIGN_RIGHT);
    buffer.push(...this.stringToBytes(`Total Qty: ${totalQty}  Sub Total ${subTotal.toFixed(2)}\n`));
    buffer.push(...this.stringToBytes(`CGST@2.5 2.5%  ${cgst.toFixed(2)}\n`));
    buffer.push(...this.stringToBytes(`SGST@2.5 2.5%  ${sgst.toFixed(2)}\n`));

    buffer.push(...this.ALIGN_LEFT);
    buffer.push(...this.stringToBytes('--------------------------------\n'));
    buffer.push(...this.ALIGN_RIGHT);

    buffer.push(...this.stringToBytes(`Round off     ${roundOff.toFixed(2)}\n`));

    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes(`Grand Total Rs ${grandTotal.toFixed(2)}\n`));
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.ALIGN_LEFT);
    buffer.push(...this.stringToBytes('--------------------------------\n'));
    buffer.push(...this.ALIGN_CENTER);
    buffer.push(...this.stringToBytes('Thank You & Visit Again!!\n'));

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
