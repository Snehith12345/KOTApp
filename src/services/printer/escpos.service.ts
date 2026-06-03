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

  private static wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
        while (currentLine.length > maxLength) {
          lines.push(currentLine.substring(0, maxLength));
          currentLine = currentLine.substring(maxLength);
        }
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  private static formatRow40(item: string, qty: string, price: string, amount: string): string {
    let col1 = item.substring(0, 16).padEnd(16, ' ');
    let col2 = qty.padStart(5, ' ');
    let col3 = price.padStart(9, ' ');
    let col4 = amount.padStart(10, ' ');
    return `${col1}${col2}${col3}${col4}`;
  }

  private static formatKOTRow40(item: string, note: string, qty: string): string {
    let col1 = item.substring(0, 22).padEnd(22, ' ');
    let col2 = note.substring(0, 12).padEnd(12, ' ');
    let col3 = qty.padStart(6, ' ');
    return `${col1}${col2}${col3}`;
  }

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
    buffer.push(...this.stringToBytes('----------------------------------------\n'));

    // Items header (40 characters)
    buffer.push(...this.stringToBytes(this.formatKOTRow40('Item', 'Special Note', 'Qty.') + '\n'));
    buffer.push(...this.stringToBytes('----------------------------------------\n'));

    // Items
    items.forEach(item => {
      let nameStr = (item.itemName || '');
      let wrappedNameLines = this.wrapText(nameStr, 22);

      let line1Name = wrappedNameLines[0] || '';
      let note = item.note || '--';
      let qty = (item.qty || 1).toString();

      buffer.push(...this.stringToBytes(this.formatKOTRow40(line1Name, note, qty) + '\n'));

      for (let i = 1; i < wrappedNameLines.length; i++) {
        buffer.push(...this.stringToBytes(wrappedNameLines[i].padEnd(40, ' ') + '\n'));
      }
    });

    buffer.push(...this.stringToBytes('----------------------------------------\n'));

    if (specialNote) {
      buffer.push(...this.stringToBytes(`Note: ${specialNote}\n`));
      buffer.push(...this.stringToBytes('----------------------------------------\n'));
    }

    // Feed and cut
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.NEW_LINE);
    buffer.push(...this.CUT);

    return new Uint8Array(buffer);
  }

  static buildKitchenSlip(tableNo: number, itemName: string, qty: number): Uint8Array {
    return this.buildKOT('NEW ITEM', tableNo, 'App', [{ itemName, qty, note: '--' }]);
  }

  static buildBill(billNo: number | string, tableNo: number, cashierName: string, items: any[]): Uint8Array {
    let buffer: number[] = [];

    buffer.push(...this.INIT);
    buffer.push(...this.ALIGN_CENTER);

    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes('VASUDA FAMILY RESTURANT\n'));
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.stringToBytes('Address : 2nd floor, Kaveri Enclave,\n'));
    buffer.push(...this.stringToBytes('Kompally, above SWISS CASTLE,\n'));
    buffer.push(...this.stringToBytes('Hyderabad\n'));
    buffer.push(...this.stringToBytes('GST NO : 36DLVPS528K1ZW\n'));

    buffer.push(...this.ALIGN_LEFT);
    buffer.push(...this.stringToBytes('----------------------------------------\n'));
    buffer.push(...this.stringToBytes('Name:\n'));
    buffer.push(...this.stringToBytes('----------------------------------------\n'));

    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    let leftDateStr = `Date: ${formattedDate}`;
    let rightOrderType = tableNo === 0 ? 'Pick Up' : `Dine In: ${tableNo}`;
    let paddingSpaces = ''.padEnd(40 - leftDateStr.length - rightOrderType.length, ' ');
    
    buffer.push(...this.stringToBytes(leftDateStr + paddingSpaces));
    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes(rightOrderType + '\n'));
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.stringToBytes(`${formattedTime}\n`));

    let leftCashier = `Cashier: ${cashierName}`;
    let rightBill = `Bill No.: ${billNo}`;
    let paddingSpaces2 = ''.padEnd(40 - leftCashier.length - rightBill.length, ' ');
    buffer.push(...this.stringToBytes(leftCashier + paddingSpaces2 + rightBill + '\n'));

    buffer.push(...this.stringToBytes('----------------------------------------\n'));
    buffer.push(...this.stringToBytes(this.formatRow40('Item', 'Qty.', 'Price', 'Amount') + '\n'));
    buffer.push(...this.stringToBytes('----------------------------------------\n'));

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
      let wrappedNameLines = this.wrapText(nameStr, 16);
      
      let line1Name = wrappedNameLines[0] || '';
      let qtyStr = qty.toString();
      let priceStr = basePrice.toFixed(2);
      let amtStr = baseAmount.toFixed(2);

      buffer.push(...this.stringToBytes(this.formatRow40(line1Name, qtyStr, priceStr, amtStr) + '\n'));

      for (let i = 1; i < wrappedNameLines.length; i++) {
        buffer.push(...this.stringToBytes(wrappedNameLines[i].padEnd(40, ' ') + '\n'));
      }
    });

    buffer.push(...this.stringToBytes('----------------------------------------\n'));

    const subTotalNum = grandTotal / 1.05;
    const subTotal = Math.round(subTotalNum * 100) / 100;
    const totalTax = grandTotal - subTotal;
    const cgst = Math.round((totalTax / 2) * 100) / 100;
    const sgst = Math.round((totalTax / 2) * 100) / 100;
    const roundOff = Math.round((grandTotal - (subTotal + cgst + sgst)) * 100) / 100;

    // Sub Total header stacked
    let subLabelLine = 'Sub'.padStart(40, ' ');
    buffer.push(...this.stringToBytes(subLabelLine + '\n'));

    let qtyStrLine = `Total Qty: ${totalQty}`;
    let subTotalValStr = `Total ${subTotal.toFixed(2)}`;
    let qtySubTotalLine = qtyStrLine.padEnd(40 - subTotalValStr.length, ' ') + subTotalValStr;
    buffer.push(...this.stringToBytes(qtySubTotalLine + '\n'));

    let cgstLabel = 'CGST@2.5 2.5%';
    let cgstVal = cgst.toFixed(2);
    let cgstLine = cgstLabel.padStart(40 - cgstVal.length - 2, ' ') + '  ' + cgstVal;
    buffer.push(...this.stringToBytes(cgstLine + '\n'));

    let sgstLabel = 'SGST@2.5 2.5%';
    let sgstVal = sgst.toFixed(2);
    let sgstLine = sgstLabel.padStart(40 - sgstVal.length - 2, ' ') + '  ' + sgstVal;
    buffer.push(...this.stringToBytes(sgstLine + '\n'));

    buffer.push(...this.stringToBytes('----------------------------------------\n'));

    if (roundOff !== 0) {
      let roundLabel = 'Round off';
      let roundVal = roundOff.toFixed(2);
      let roundLine = roundLabel.padStart(40 - roundVal.length - 2, ' ') + '  ' + roundVal;
      buffer.push(...this.stringToBytes(roundLine + '\n'));
    }

    let grandStr = `Grand Total ₹ ${grandTotal.toFixed(2)}`;
    let grandLine = grandStr.padStart(40, ' ');
    
    buffer.push(...this.BOLD_ON);
    buffer.push(...this.stringToBytes(grandLine + '\n'));
    buffer.push(...this.BOLD_OFF);

    buffer.push(...this.stringToBytes('----------------------------------------\n'));
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
      let code = str.charCodeAt(i);
      if (code === 8377) { // Rupee Symbol ₹
        bytes.push(158); // 0x9E Rupee symbol in standard Indian printer fonts
      } else if (code > 255) {
        bytes.push(63); // '?'
      } else {
        bytes.push(code);
      }
    }
    return bytes;
  }
}
