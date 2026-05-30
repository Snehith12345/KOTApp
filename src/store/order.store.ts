import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { Order } from '../types/order.types';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  subscribeToOrders: () => () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: true,
  subscribeToOrders: () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = Timestamp.fromDate(date);

    const q = query(
      collection(db, 'orders'), 
      where('status', '==', 'completed'),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        orders.push({ ...doc.data(), id: doc.id } as Order);
      });
      set({ orders, isLoading: false });
    }, (error) => {
      console.log("Error fetching orders:", error);
    });
    return unsubscribe;
  },
}));
