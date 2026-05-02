import { Staff, Role } from '../types';
import { createFirestoreAdapter } from '../lib/firestore.adapter';

const firestoreStaff = createFirestoreAdapter<Staff>('staff');

export const staffService = {
  ...firestoreStaff,
  create: async (data: Omit<Staff, 'id' | 'avatarUrl'>): Promise<Staff> => {
    // Interceptamos la creación para generar el avatar automáticamente
    const dataToSave = {
      ...data,
      avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${data.name}&backgroundColor=FFB6C1`
    };
    return await firestoreStaff.create(dataToSave);
  }
};

export const roleService = createFirestoreAdapter<Role>('roles');
