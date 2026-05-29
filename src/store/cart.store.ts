import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderItem } from '../types/order.types';
import { DBServices } from '../services/firebase/db';

export type CartItem = Omit<OrderItem, 'id' | 'orderId'> & { sentQty?: number };

interface CartState {
  carts: Record<number, CartItem[]>;
  setCarts: (carts: Record<number, CartItem[]>) => void;
  addItem: (tableNo: number, item: Omit<OrderItem, 'id' | 'orderId'>) => void;
  removeItem: (tableNo: number, itemId: string) => void;
  updateQuantity: (tableNo: number, itemId: string, qty: number) => void;
  updateNote: (tableNo: number, itemId: string, note: string) => void;
  markAsSent: (tableNo: number) => void;
  clearCart: (tableNo: number) => void;
  getCart: (tableNo: number) => CartItem[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      getCart: (tableNo) => get().carts[tableNo] || [],
      setCarts: (carts) => set({ carts }),
      addItem: (tableNo, item) => {
        const currentCarts = get().carts;
        const tableCart = currentCarts[tableNo] || [];
        const existing = tableCart.find(i => i.itemId === item.itemId);
        let newItems: CartItem[];
        if (existing) {
          newItems = tableCart.map(i => i.itemId === item.itemId ? { ...i, qty: i.qty + 1 } : i);
        } else {
          newItems = [...tableCart, { ...item, qty: 1 }];
        }
        set({
          carts: {
            ...currentCarts,
            [tableNo]: newItems
          }
        });
        DBServices.updateCart(tableNo, newItems).catch(err => console.error("Failed to sync add item to Firestore:", err));
      },
      removeItem: (tableNo, itemId) => {
        const currentCarts = get().carts;
        const tableCart = currentCarts[tableNo] || [];
        const newItems = tableCart.filter(i => i.itemId !== itemId);
        set({
          carts: {
            ...currentCarts,
            [tableNo]: newItems
          }
        });
        DBServices.updateCart(tableNo, newItems).catch(err => console.error("Failed to sync remove item to Firestore:", err));
      },
      updateQuantity: (tableNo, itemId, qty) => {
        const currentCarts = get().carts;
        const tableCart = currentCarts[tableNo] || [];
        const newItems = tableCart.map(i => i.itemId === itemId ? { ...i, qty } : i);
        set({
          carts: {
            ...currentCarts,
            [tableNo]: newItems
          }
        });
        DBServices.updateCart(tableNo, newItems).catch(err => console.error("Failed to sync qty to Firestore:", err));
      },
      updateNote: (tableNo, itemId, note) => {
        const currentCarts = get().carts;
        const tableCart = currentCarts[tableNo] || [];
        const newItems = tableCart.map(i => i.itemId === itemId ? { ...i, note } : i);
        set({
          carts: {
            ...currentCarts,
            [tableNo]: newItems
          }
        });
        DBServices.updateCart(tableNo, newItems).catch(err => console.error("Failed to sync note to Firestore:", err));
      },
      markAsSent: (tableNo) => {
        const currentCarts = get().carts;
        const tableCart = currentCarts[tableNo] || [];
        const newItems = tableCart.map(i => ({ ...i, sentQty: i.qty }));
        set({
          carts: {
            ...currentCarts,
            [tableNo]: newItems
          }
        });
        DBServices.updateCart(tableNo, newItems).catch(err => console.error("Failed to sync markAsSent to Firestore:", err));
      },
      clearCart: (tableNo) => {
        const currentCarts = get().carts;
        set({
          carts: {
            ...currentCarts,
            [tableNo]: []
          }
        });
        DBServices.updateCart(tableNo, []).catch(err => console.error("Failed to sync clearCart to Firestore:", err));
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
