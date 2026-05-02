import { Service } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

// Conexión directa a la colección de Firestore
export const serviceService = createFirestoreAdapter<Service>('services');
