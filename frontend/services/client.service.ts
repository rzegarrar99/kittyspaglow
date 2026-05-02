import { Client } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

// ¡Así de simple! El adaptador genérico se encarga de todo el CRUD en la colección 'clients'
const firestoreCrud = createFirestoreAdapter<Client>('clients');

export const clientService = {
  getAll: firestoreCrud.getAll,
  
  create: async (clientData: Omit<Client, 'id' | 'lastVisit' | 'avatarUrl' | 'created_at'>): Promise<Client> => {
    // Interceptamos el create para añadir lógica de negocio específica (ej. Avatar)
    const dataToSave = {
      ...clientData,
      lastVisit: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${clientData.name}&backgroundColor=FFB6C1`,
    };
    return await firestoreCrud.create(dataToSave);
  },

  update: firestoreCrud.update,
  delete: firestoreCrud.delete
};
