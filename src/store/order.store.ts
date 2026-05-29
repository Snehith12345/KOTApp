import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
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
    const q = query(
      collection(db, 'orders'), 
      where('status', '==', 'completed'),
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
