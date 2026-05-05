import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { Table } from '../types/table.types';

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
      snapshot.forEach((doc) => {
        tables.push({ ...doc.data(), id: doc.id } as Table);
      });
      set({ tables, isLoading: false });
    }, (error) => {
      console.warn("Error fetching tables:", error);
    });
    return unsubscribe;
  },
}));
