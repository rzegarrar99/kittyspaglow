import { Order, Movement, CashRegister, KardexEntry } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

// Conexión directa a las colecciones de Firestore
export const orderService = createFirestoreAdapter<Order>('orders');
export const movementService = createFirestoreAdapter<Movement>('movements');
export const cashRegisterService = createFirestoreAdapter<CashRegister>('cash_registers');
export const kardexService = createFirestoreAdapter<KardexEntry>('kardex');
