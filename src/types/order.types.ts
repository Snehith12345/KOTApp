export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  qty: number;
  price: number;
  note?: string;
}

export interface Order {
  id: string;
  kotNo: number;
  tableNo: number;
  captainId: string;
  captainName: string;
  status: 'running' | 'completed' | 'cancelled';
  orderType?: 'dine-in' | 'pickup';
  createdAt: any;
  items: OrderItem[];
  specialNote?: string;
  totalAmount: number;
}
