import { collection, addDoc, updateDoc, doc, setDoc, getDoc, serverTimestamp, deleteDoc, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './config';
import { Table } from '../../types/table.types';
import { MenuCategory, MenuItem } from '../../types/menu.types';
import { Order } from '../../types/order.types';

export const DBServices = {
  async addTable(tableNo: number): Promise<void> {
    const tableRef = doc(collection(db, 'tables'));
    await setDoc(tableRef, {
      id: tableRef.id,
      tableNo,
      status: 'available'
    });
  },

  async getNextSequenceNumber(): Promise<number> {
    const seqRef = doc(db, 'settings', 'sequence');
    const docSnap = await getDoc(seqRef);
    let nextSeq = 1;
    if (docSnap.exists()) {
      nextSeq = (docSnap.data().value || 0) + 1;
    }
    await setDoc(seqRef, { value: nextSeq }, { merge: true });
    return nextSeq;
  },

  async updateTableStatus(id: string, status: Table['status']): Promise<void> {
    const tableRef = doc(db, 'tables', id);
    await updateDoc(tableRef, { status });
  },

  async updateTableStatusByNo(tableNo: number | string, status: Table['status']): Promise<void> {
    const numericTableNo = Number(tableNo);
    try {
      const { useTableStore } = require('../../store/table.store');
      const localTables = useTableStore.getState().tables;
      const table = localTables.find((t: any) => t.tableNo === numericTableNo);
      
      if (table) {
        await updateDoc(doc(db, 'tables', table.id), { status });
        return;
      }
    } catch (e) {
      console.warn("Local table lookup failed in updateTableStatusByNo:", e);
    }

    const q = query(collection(db, 'tables'), where('tableNo', '==', numericTableNo));
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(document => 
      updateDoc(doc(db, 'tables', document.id), { status })
    );
    await Promise.all(updatePromises);
  },

  async addMenuCategory(name: string): Promise<void> {
    const categoryRef = doc(collection(db, 'menuCategories'));
    await setDoc(categoryRef, {
      id: categoryRef.id,
      name
    });
  },

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<void> {
    const itemRef = doc(collection(db, 'menuItems'));
    await setDoc(itemRef, {
      ...item,
      id: itemRef.id
    });
  },

  async createOrder(orderData: Omit<Order, 'id'>): Promise<void> {
    const orderRef = doc(collection(db, 'orders'));
    await setDoc(orderRef, {
      ...orderData,
      id: orderRef.id,
      createdAt: serverTimestamp(),
    });
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, { status });
  },

  async deleteTable(id: string): Promise<void> {
    await deleteDoc(doc(db, 'tables', id));
  },

  async deleteMenuCategory(id: string): Promise<void> {
    // Cascading delete: First find all items with this categoryId
    const q = query(collection(db, 'menuItems'), where('categoryId', '==', id));
    const snapshot = await getDocs(q);
    
    // Delete all matching items
    const deletePromises = snapshot.docs.map(document => 
      deleteDoc(doc(db, 'menuItems', document.id))
    );
    await Promise.all(deletePromises);

    // Then delete the category itself
    await deleteDoc(doc(db, 'menuCategories', id));
  },

  async deleteMenuItem(id: string): Promise<void> {
    await deleteDoc(doc(db, 'menuItems', id));
  },

  async deleteOrder(id: string): Promise<void> {
    await deleteDoc(doc(db, 'orders', id));
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    const itemRef = doc(db, 'menuItems', id);
    await updateDoc(itemRef, updates);
  },

  async updateCart(tableNo: number, items: any[]): Promise<void> {
    if (tableNo === 0) return;
    try {
      const { useTableStore } = require('../../store/table.store');
      const localTables = useTableStore.getState().tables;
      const table = localTables.find((t: any) => t.tableNo === tableNo);
      
      if (table) {
        await updateDoc(doc(db, 'tables', table.id), { 
          cartItems: items,
          status: items.length > 0 ? 'running' : 'available'
        });
        return;
      }

      const q = query(collection(db, 'tables'), where('tableNo', '==', tableNo));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(document => 
        updateDoc(doc(db, 'tables', document.id), { 
          cartItems: items,
          status: items.length > 0 ? 'running' : 'available'
        })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error updating table cart in Firestore:", err);
    }
  },

  async addUser(userData: any): Promise<void> {
    const userRef = doc(db, 'users', userData.mobile);
    await setDoc(userRef, {
      ...userData,
      id: userData.mobile
    });
  },

  async updateUser(id: string, updates: Partial<any>): Promise<void> {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, updates);
  },

  async deleteUserAccount(id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', id));
  },

  subscribeToUsers(onUpdate: (users: any[]) => void): () => void {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const users: any[] = [];
      snapshot.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id });
      });
      onUpdate(users);
    }, (error) => {
      console.warn("Error fetching users:", error);
    });
  }
};
