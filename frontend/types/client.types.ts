export interface Client {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email?: string;
  status: 'VIP' | 'Activo' | 'Inactivo';
  lastVisit: string;
  avatarUrl: string;
  created_at?: string;
}
