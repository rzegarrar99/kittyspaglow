import { Staff, Role } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

const firestoreStaff = createFirestoreAdapter<Staff>('staff');

export const staffService = {
  ...firestoreStaff,
  // 🛡️ Enterprise: Sobreescribimos 'create' para usar 'createWithId' cuando se proporciona un ID
  create: async (data: Omit<Staff, 'avatarUrl'>): Promise<Staff> => {
    // Interceptamos la creación para generar el avatar automáticamente
    const dataToSave = {
      ...data,
      avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${data.name}&backgroundColor=FFB6C1`
    };

    // Si el ID ya viene en los datos (ej. desde Firebase Auth UID), usamos createWithId
    if ((data as Staff).id) {
      return await firestoreStaff.createWithId((data as Staff).id, dataToSave);
    }
    // Si no viene ID, usamos el método genérico que genera uno (para casos donde no hay Auth)
    return await firestoreStaff.create(dataToSave);
  },

  // 🛡️ Enterprise: Sobreescribimos 'update' para asegurar que el ID sea el UID de Auth
  update: async (id: string, updates: Partial<Staff>): Promise<Staff> => {
    return await firestoreStaff.update(id, updates);
  },

  // 🛡️ Enterprise: Sobreescribimos 'delete' para asegurar que el ID sea el UID de Auth
  delete: async (id: string): Promise<void> => {
    return await firestoreStaff.delete(id);
  }
};

export const roleService = createFirestoreAdapter<Role>('roles');
