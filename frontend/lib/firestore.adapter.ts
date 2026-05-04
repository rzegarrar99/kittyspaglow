import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, setDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { isFirebaseConfigured } from '../config/env';

const log = import.meta.env.DEV ? console.log : () => {};

export const createFirestoreAdapter = <T extends { id: string }>(collectionName: string) => {
  
  // ==========================================
  // 🛠️ MODO DEMO (Fallback a LocalStorage)
  // ==========================================
  if (!isFirebaseConfigured) {
    const storageKey = `spa_demo_${collectionName}`;
    
    const getStored = (): T[] => {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    };
    const setStored = (data: T[]) => localStorage.setItem(storageKey, JSON.stringify(data));

    return {
      getAll: async (): Promise<T[]> => {
        await new Promise(res => setTimeout(res, 300));
        return getStored().sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      },
      getById: async (id: string): Promise<T | null> => {
        const item = getStored().find(i => i.id === id);
        return item || null;
      },
      create: async (data: Omit<T, 'id'>): Promise<T> => {
        await new Promise(res => setTimeout(res, 300));
        const newItem = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() } as unknown as T;
        setStored([newItem, ...getStored()]);
        return newItem;
      },
      createWithId: async (id: string, data: Omit<T, 'id'>): Promise<T> => {
        await new Promise(res => setTimeout(res, 300));
        // En modo demo, simulamos la creación con ID manual
        const newItem = { ...data, id, created_at: new Date().toISOString() } as unknown as T;
        setStored([newItem, ...getStored()]);
        return newItem;
      },
      update: async (id: string, updates: Partial<T>): Promise<T> => {
        await new Promise(res => setTimeout(res, 300));
        const current = getStored();
        const index = current.findIndex(item => item.id === id);
        if (index === -1) throw new Error('Item no encontrado');
        const updatedItem = { ...current[index], ...updates };
        current[index] = updatedItem;
        setStored(current);
        return updatedItem;
      },
      delete: async (id: string): Promise<void> => {
        await new Promise(res => setTimeout(res, 300));
        setStored(getStored().filter(item => item.id !== id));
      }
    };
  }

  // ==========================================
  // 🔥 MODO PRODUCCIÓN (Firebase Firestore)
  // ==========================================
  const colRef = collection(db, collectionName);

  return {
    getAll: async (): Promise<T[]> => {
      try {
        const q = query(colRef, orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      } catch (error) {
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      }
    },
    getById: async (id: string): Promise<T | null> => {
      const docRef = doc(db, collectionName, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
    create: async (data: Omit<T, 'id'>): Promise<T> => {
      const docRef = await addDoc(colRef, { ...data, created_at: new Date().toISOString() });
      return { id: docRef.id, ...data } as unknown as T;
    },
    // 🔥 Enterprise: Implementación real para Firebase
    createWithId: async (id: string, data: Omit<T, 'id'>): Promise<T> => {
      const docRef = doc(db, collectionName, id);
      // Usamos setDoc para forzar que el ID del documento sea el que nosotros enviamos (el UID)
      await setDoc(docRef, { ...data, created_at: new Date().toISOString() });
      return { id, ...data } as unknown as T;
    },
    update: async (id: string, updates: Partial<T>): Promise<T> => {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates as any);
      return { id, ...updates } as unknown as T;
    },
    delete: async (id: string): Promise<void> => {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    }
  };
};
