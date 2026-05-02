import { InventoryItem, SimpleDictionary, Brand, Unit } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

// Conexión directa a las colecciones de Firestore
export const inventoryService = createFirestoreAdapter<InventoryItem>('inventory');
export const categoryService = createFirestoreAdapter<SimpleDictionary>('categories');
export const brandService = createFirestoreAdapter<Brand>('brands');
export const unitService = createFirestoreAdapter<Unit>('units');
