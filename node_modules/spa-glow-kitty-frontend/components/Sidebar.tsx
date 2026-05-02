import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Tags, Box, MapPin, Truck, Sparkles, 
  Package, Archive, Users, MonitorSmartphone, ClipboardList, 
  Receipt, Wallet, ArrowRightLeft, UserCircle, Percent, BarChart3, 
  Settings, Shield, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { KittyIcon } from './KittyIcon';
import { useAuthStore } from '../stores/authStore';
import { useSettings } from '../contexts/SettingsContext';
import { useUIStore } from '../stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { logout, hasPermission } = useAuthStore();
  const { settings } = useSettings();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  const navGroups = [
    {
      title: 'Principal',
      items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: 'dashboard.view' }]
    },
    {
      title: 'Catálogo',
      items: [
        { name: 'Categorías', path: '/categorias', icon: BookOpen, permission: 'catalog.view' },
        { name: 'Marcas', path: '/marcas', icon: Tags, permission: 'catalog.view' },
        { name: 'Unidades', path: '/unidades', icon: Box, permission: 'catalog.view' },
        { name: 'Productos', path: '/productos', icon: Package, permission: 'catalog.view' },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { name: 'Áreas', path: '/areas', icon: MapPin, permission: 'operations.view' },
        { name: 'Proveedores', path: '/proveedores', icon: Truck, permission: 'inventory.view' },
        { name: 'Servicios', path: '/servicios', icon: Sparkles, permission: 'services.view' },
        { name: 'Almacén', path: '/almacen', icon: Archive, permission: 'inventory.view' },
      ]
    },
    {
      title: 'Ventas & Atención',
      items: [
        { name: 'Clientes', path: '/clientes', icon: Users, permission: 'clients.view' },
        { name: 'Punto de Venta', path: '/pos', icon: MonitorSmartphone, permission: 'pos.use' },
        { name: 'Órdenes', path: '/ordenes', icon: ClipboardList, permission: 'pos.use' },
      ]
    },
    {
      title: 'Finanzas',
      items: [
        { name: 'Gastos', path: '/gastos', icon: Receipt, permission: 'finances.view' },
        { name: 'Cajas', path: '/cajas', icon: Wallet, permission: 'finances.view' },
        { name: 'Movimientos', path: '/movimientos', icon: ArrowRightLeft, permission: 'finances.view' },
      ]
    },
    {
      title: 'Personal',
      items: [
        { name: 'Staff', path: '/staff', icon: UserCircle, permission: 'staff.manage' },
        { name: 'Comisiones', path: '/comisiones', icon: Percent, permission: 'reports.view' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { name: 'Reportes', path: '/reportes', icon: BarChart3, permission: 'reports.view' },
        { name: 'Roles', path: '/roles', icon: Shield, permission: 'system.admin' },
        { name: 'Configuración', path: '/configuracion', icon: Settings, permission: 'system.admin' },
      ]
    }
  ];

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(item.permission))
  })).filter(group => group.items.length > 0);

  const nameParts = settings.spaName.split(' ');
  const firstPart = nameParts.slice(0, -1).join(' ');
  const lastPart = nameParts[nameParts.length - 1];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarOpen ? 260 : 88 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-[calc(100vh-2rem)] z-50 fixed left-4 top-4"
    >
      {/* Contenedor principal con Glassmorphism */}
      <div className="w-full h-full bg-white/60 backdrop-blur-2xl border border-white rounded-4xl flex flex-col shadow-glass overflow-hidden relative">
        
        {/* Header */}
        <div className={`p-6 flex items-center gap-3 bg-white/40 border-b border-white/50 shrink-0 ${!isSidebarOpen && 'justify-center px-0'}`}>
          <div className="shrink-0 bg-white rounded-full shadow-sm p-1">
            <KittyIcon className="w-10 h-10" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-extrabold text-xl text-plum leading-tight truncate whitespace-nowrap overflow-hidden"
              >
                {firstPart}<br/><span className="text-primary">{lastPart}</span>
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {filteredGroups.map((group, idx) => (
            <div key={idx}>
              {isSidebarOpen ? (
                <motion.h3 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[11px] font-bold text-plum/40 uppercase tracking-widest mb-3 px-4 whitespace-nowrap"
                >
                  {group.title}
                </motion.h3>
              ) : (
                <div className="h-px bg-white/50 w-8 mx-auto mb-4 mt-2"></div>
              )}
              
              <ul className="space-y-1">
                {group.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <NavLink
                      to={item.path}
                      title={!isSidebarOpen ? item.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 py-2.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
                          isSidebarOpen ? 'px-4' : 'justify-center px-0'
                        } ${
                          isActive
                            ? 'bg-white text-primary shadow-sm border border-white'
                            : 'text-plum/70 hover:bg-white/50 hover:text-primary'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <AnimatePresence>
                        {isSidebarOpen && (
                          <motion.span 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: Logout Button */}
        <div className="p-4 border-t border-white/50 bg-white/40 shrink-0">
          <button 
            onClick={logout}
            title={!isSidebarOpen ? "Cerrar Sesión" : undefined}
            className={`flex items-center justify-center gap-3 py-3 w-full rounded-2xl text-plum/60 hover:bg-white hover:text-red-500 transition-colors font-bold text-sm ${isSidebarOpen ? 'px-4' : 'px-0'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }} 
                  animate={{ opacity: 1, width: 'auto' }} 
                  exit={{ opacity: 0, width: 0 }} 
                  className="whitespace-nowrap overflow-hidden"
                >
                  Cerrar Sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Botón Circular Flotante (Toggle) - Reposicionado arriba */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-4 top-8 w-8 h-8 bg-white border-2 border-white rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all z-50"
      >
        {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </motion.aside>
  );
};
