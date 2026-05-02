import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Servicios } from './pages/Servicios';
import { POS } from './pages/POS';
import { Reportes } from './pages/Reportes';
import { Comisiones } from './pages/Comisiones';
import { Almacen } from './pages/Almacen';
import { KardexView } from './pages/KardexView';
import { Staff } from './pages/Staff';
import { Roles } from './pages/Roles';
import { Ordenes } from './pages/Ordenes';
import { Gastos } from './pages/Gastos';
import { Movimientos } from './pages/Movimientos';
import { Configuracion } from './pages/Configuracion';
import { Categorias } from './pages/Categorias';
import { Marcas } from './pages/Marcas';
import { Unidades } from './pages/Unidades';
import { Areas } from './pages/Areas';
import { Proveedores } from './pages/Proveedores';
import { Productos } from './pages/Productos';
import { Cajas } from './pages/Cajas';
import { AccesoDenegado } from './pages/AccesoDenegado';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

const AppRoutes = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
        <Route path="clientes" element={<ProtectedRoute permission="clients.view"><Clientes /></ProtectedRoute>} />
        <Route path="servicios" element={<ProtectedRoute permission="services.view"><Servicios /></ProtectedRoute>} />
        <Route path="pos" element={<ProtectedRoute permission="pos.use"><POS /></ProtectedRoute>} />
        <Route path="ordenes" element={<ProtectedRoute permission="pos.use"><Ordenes /></ProtectedRoute>} />
        <Route path="reportes" element={<ProtectedRoute permission="reports.view"><Reportes /></ProtectedRoute>} />
        <Route path="comisiones" element={<ProtectedRoute permission="reports.view"><Comisiones /></ProtectedRoute>} />
        
        {/* Rutas de Almacén y Kardex */}
        <Route path="almacen" element={<ProtectedRoute permission="inventory.view"><Almacen /></ProtectedRoute>} />
        <Route path="almacen/kardex/:id" element={<ProtectedRoute permission="inventory.view"><KardexView /></ProtectedRoute>} />
        
        <Route path="staff" element={<ProtectedRoute permission="staff.manage"><Staff /></ProtectedRoute>} />
        <Route path="roles" element={<ProtectedRoute permission="system.admin"><Roles /></ProtectedRoute>} />
        <Route path="gastos" element={<ProtectedRoute permission="finances.view"><Gastos /></ProtectedRoute>} />
        <Route path="movimientos" element={<ProtectedRoute permission="finances.view"><Movimientos /></ProtectedRoute>} />
        <Route path="configuracion" element={<ProtectedRoute permission="system.admin"><Configuracion /></ProtectedRoute>} />
        
        <Route path="categorias" element={<ProtectedRoute permission="catalog.view"><Categorias /></ProtectedRoute>} />
        <Route path="marcas" element={<ProtectedRoute permission="catalog.view"><Marcas /></ProtectedRoute>} />
        <Route path="unidades" element={<ProtectedRoute permission="catalog.view"><Unidades /></ProtectedRoute>} />
        <Route path="productos" element={<ProtectedRoute permission="catalog.view"><Productos /></ProtectedRoute>} />
        <Route path="areas" element={<ProtectedRoute permission="operations.view"><Areas /></ProtectedRoute>} />
        <Route path="proveedores" element={<ProtectedRoute permission="inventory.view"><Proveedores /></ProtectedRoute>} />
        <Route path="cajas" element={<ProtectedRoute permission="finances.view"><Cajas /></ProtectedRoute>} />
        
        <Route path="denegado" element={<AccesoDenegado />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ToastProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ToastProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
