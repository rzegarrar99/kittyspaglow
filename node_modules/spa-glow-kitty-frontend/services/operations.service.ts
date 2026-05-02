import { Area, Supplier, Purchase } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

// Conexión directa a las colecciones de Firestore
export const areaService = createFirestoreAdapter<Area>('areas');
export const supplierService = createFirestoreAdapter<Supplier>('suppliers');
export const purchaseService = createFirestoreAdapter<Purchase>('purchases');
