import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderItem } from '../types/order.types';

interface CartState {
  carts: Record<number, Omit<OrderItem, 'id' | 'orderId'>[]>;
  addItem: (tableNo: number, item: Omit<OrderItem, 'id' | 'orderId'>) => void;
  removeItem: (tableNo: number, itemId: string) => void;
  updateQuantity: (tableNo: number, itemId: string, qty: number) => void;
  updateNote: (tableNo: number, itemId: string, note: string) => void;
  clearCart: (tableNo: number) => void;
  getCart: (tableNo: number) => Omit<OrderItem, 'id' | 'orderId'>[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      getCart: (tableNo) => get().carts[tableNo] || [],
      addItem: (tableNo, item) => set((state) => {
        const tableCart = state.carts[tableNo] || [];
        const existing = tableCart.find(i => i.itemId === item.itemId);
        if (existing) {
          return {
            carts: {
              ...state.carts,
              [tableNo]: tableCart.map(i => i.itemId === item.itemId ? { ...i, qty: i.qty + 1 } : i)
            }
          };
        }
        return { 
          carts: {
            ...state.carts,
            [tableNo]: [...tableCart, { ...item, qty: 1 }] 
          }
        };
      }),
      removeItem: (tableNo, itemId) => set((state) => {
        const tableCart = state.carts[tableNo] || [];
        return {
          carts: {
            ...state.carts,
            [tableNo]: tableCart.filter(i => i.itemId !== itemId)
          }
        };
      }),
      updateQuantity: (tableNo, itemId, qty) => set((state) => {
        const tableCart = state.carts[tableNo] || [];
        return {
          carts: {
            ...state.carts,
            [tableNo]: tableCart.map(i => i.itemId === itemId ? { ...i, qty } : i)
          }
        };
      }),
      updateNote: (tableNo, itemId, note) => set((state) => {
        const tableCart = state.carts[tableNo] || [];
        return {
          carts: {
            ...state.carts,
            [tableNo]: tableCart.map(i => i.itemId === itemId ? { ...i, note } : i)
          }
        };
      }),
      clearCart: (tableNo) => set((state) => ({ 
        carts: {
          ...state.carts,
          [tableNo]: []
        }
      })),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
