import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { Table } from '../types/table.types';
import { useCartStore } from './cart.store';

interface TableState {
  tables: Table[];
  isLoading: boolean;
  subscribeToTables: () => () => void; // returns unsubscribe function
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  isLoading: true,
  subscribeToTables: () => {
    const q = query(collection(db, 'tables'), orderBy('tableNo', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tables: Table[] = [];
      const cartsData: Record<number, any[]> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        tables.push({ ...data, id: doc.id });
        if (typeof data.tableNo === 'number') {
          cartsData[data.tableNo] = data.cartItems || [];
        }
      });
      set({ tables, isLoading: false });
      
      // Synchronize real-time cart data to useCartStore
      useCartStore.getState().setCarts(cartsData);
    }, (error) => {
      console.warn("Error fetching tables:", error);
    });
    return unsubscribe;
  },
}));
