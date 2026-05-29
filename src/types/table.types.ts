export type TableStatus = 'available' | 'running';

export interface Table {
  id: string;
  tableNo: number;
  status: TableStatus;
  cartItems?: any[];
}
