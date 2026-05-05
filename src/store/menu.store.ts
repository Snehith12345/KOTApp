import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { MenuCategory, MenuItem } from '../types/menu.types';

interface MenuState {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoadingCategories: boolean;
  isLoadingItems: boolean;
  subscribeToMenu: () => () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  categories: [],
  items: [],
  isLoadingCategories: true,
  isLoadingItems: true,
  subscribeToMenu: () => {
    const qCats = query(collection(db, 'menuCategories'), orderBy('name', 'asc'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      const categories: MenuCategory[] = [];
      snapshot.forEach((doc) => categories.push({ ...doc.data(), id: doc.id } as MenuCategory));
      set({ categories, isLoadingCategories: false });
    }, (error) => {
      console.warn("Error fetching categories:", error);
    });

    const qItems = query(collection(db, 'menuItems'), orderBy('name', 'asc'));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => items.push({ ...doc.data(), id: doc.id } as MenuItem));
      set({ items, isLoadingItems: false });
    }, (error) => {
      console.warn("Error fetching menu items:", error);
    });

    return () => {
      unsubCats();
      unsubItems();
    };
  },
}));
