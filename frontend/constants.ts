import { Client, Service, Staff, Role } from './types';

export const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard.view', label: 'Ver Dashboard', group: 'Principal' },
  { id: 'catalog.view', label: 'Ver Catálogo (Categorías, Marcas, etc.)', group: 'Catálogo' },
  { id: 'operations.view', label: 'Ver Operaciones (Áreas)', group: 'Operaciones' },
  { id: 'services.view', label: 'Gestionar Servicios', group: 'Operaciones' },
  { id: 'inventory.view', label: 'Ver Almacén y Proveedores', group: 'Almacén' },
  { id: 'inventory.edit', label: 'Registrar Compras y Ajustes', group: 'Almacén' },
  { id: 'clients.view', label: 'Ver Directorio de Clientes', group: 'Ventas' },
  { id: 'clients.edit', label: 'Editar/Eliminar Clientes', group: 'Ventas' },
  { id: 'pos.use', label: 'Usar Punto de Venta (POS) y Órdenes', group: 'Ventas' },
  { id: 'finances.view', label: 'Ver Cajas, Gastos y Movimientos', group: 'Finanzas' },
  { id: 'staff.manage', label: 'Gestionar Personal', group: 'Personal' },
  { id: 'reports.view', label: 'Ver Reportes y Comisiones', group: 'Sistema' },
  { id: 'system.admin', label: 'Configuración del Sistema', group: 'Sistema' },
];

export const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Administradora', color: '#D4AF37', priority: 1000, permissions: ['*'] },
  { id: 'r2', name: 'Senior Esteticista', color: '#FF2A7A', priority: 40, permissions: ['dashboard.view', 'clients.view', 'services.view', 'pos.use'] },
  { id: 'r3', name: 'Caja', color: '#2D1B2E', priority: 30, permissions: ['dashboard.view', 'pos.use', 'finances.view'] },
  { id: 'r4', name: 'Recepcionista', color: '#FFB6C1', priority: 40, permissions: ['dashboard.view', 'clients.view', 'clients.edit', 'pos.use'] }
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'WALK_IN', name: 'Clienta de Paso', dni: '00000000', phone: '-', status: 'Activo', lastVisit: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=walkin&backgroundColor=FFB6C1' },
  { id: '1', name: 'Valeria Rojas', dni: '72345678', phone: '+51 987 654 321', status: 'VIP', lastVisit: new Date().toISOString(), avatarUrl: 'https://picsum.photos/150/150?random=1' },
  { id: '2', name: 'Camila Mendoza', dni: '45678901', phone: '+51 912 345 678', status: 'Activo', lastVisit: new Date().toISOString(), avatarUrl: 'https://picsum.photos/150/150?random=2' },
];

export const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Facial Glow Kitty', category: 'Faciales', price: 150, duration: 60 },
  { id: 's2', name: 'Masaje Relajante Oro', category: 'Masajes', price: 200, duration: 90 },
  { id: 's3', name: 'Manicura Coquette', category: 'Manicura', price: 80, duration: 45 },
];

export const MOCK_STAFF: Staff[] = [
  { 
    id: 'st1', 
    name: 'Ana Directora', 
    email: 'admin@spaglowkitty.pe',
    roles: [MOCK_ROLES[0]], 
    commission_rate: 0.10,
    avatarUrl: 'https://picsum.photos/150/150?random=10'
  },
  { 
    id: 'st2', 
    name: 'María Masajista', 
    email: 'maria@spaglowkitty.pe',
    roles: [MOCK_ROLES[1]], 
    commission_rate: 0.20,
    avatarUrl: 'https://picsum.photos/150/150?random=11'
  },
  { 
    id: 'st3', 
    name: 'Lucía Recepción', 
    email: 'lucia@spaglowkitty.pe',
    roles: [MOCK_ROLES[2], MOCK_ROLES[3]], 
    commission_rate: 0.05,
    avatarUrl: 'https://picsum.photos/150/150?random=12'
  },
];
