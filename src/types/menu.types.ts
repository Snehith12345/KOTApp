export interface MenuItemVariant {
  name: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  isAvailable: boolean;
  variants?: MenuItemVariant[];
}
