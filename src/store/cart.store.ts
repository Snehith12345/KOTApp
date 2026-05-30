import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderItem } from '../types/order.types';
import { DBServices } from '../services/firebase/db';

export type CartItem = Omit<OrderItem, 'id' | 'orderId'> & { sentQty?: number };

const syncTimeouts: Record<number, any> = {};

const debounceSyncCart = (tableNo: number, items: CartItem[]) => {
  if (tableNo === 0) return;
  if (syncTimeouts[tableNo]) {
    clearTimeout(syncTimeouts[tableNo]);
  }
  syncTimeouts[tableNo] = setTimeout(() => {
    DBServices.updateCart(tableNo, items).catch(err => 
      console.error(`Failed to sync cart for Table ${tableNo} to Firestore:`, err)
    );
    delete syncTimeouts[tableNo];
  }, 400);
};

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
        debounceSyncCart(tableNo, newItems);
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
        debounceSyncCart(tableNo, newItems);
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
        debounceSyncCart(tableNo, newItems);
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
        debounceSyncCart(tableNo, newItems);
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
        if (syncTimeouts[tableNo]) {
          clearTimeout(syncTimeouts[tableNo]);
          delete syncTimeouts[tableNo];
        }
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
        if (syncTimeouts[tableNo]) {
          clearTimeout(syncTimeouts[tableNo]);
          delete syncTimeouts[tableNo];
        }
        DBServices.updateCart(tableNo, []).catch(err => console.error("Failed to sync clearCart to Firestore:", err));
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
