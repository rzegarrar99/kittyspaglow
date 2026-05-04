import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AccesoDenegado } from './pages/AccesoDenegado';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy imports de páginas para optimización de bundle (Performance)
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Clientes = React.lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const Servicios = React.lazy(() => import('./pages/Servicios').then(m => ({ default: m.Servicios })));
const POS = React.lazy(() => import('./pages/POS').then(m => ({ default: m.POS })));
const Reportes = React.lazy(() => import('./pages/Reportes').then(m => ({ default: m.Reportes })));
const Comisiones = React.lazy(() => import('./pages/Comisiones').then(m => ({ default: m.Comisiones })));
const Almacen = React.lazy(() => import('./pages/Almacen').then(m => ({ default: m.Almacen })));
const KardexView = React.lazy(() => import('./pages/KardexView').then(m => ({ default: m.KardexView })));
const Staff = React.lazy(() => import('./pages/Staff').then(m => ({ default: m.Staff })));
const Roles = React.lazy(() => import('./pages/Roles').then(m => ({ default: m.Roles })));
const Ordenes = React.lazy(() => import('./pages/Ordenes').then(m => ({ default: m.Ordenes })));
const Gastos = React.lazy(() => import('./pages/Gastos').then(m => ({ default: m.Gastos })));
const Movimientos = React.lazy(() => import('./pages/Movimientos').then(m => ({ default: m.Movimientos })));
const Configuracion = React.lazy(() => import('./pages/Configuracion').then(m => ({ default: m.Configuracion })));
const Categorias = React.lazy(() => import('./pages/Categorias').then(m => ({ default: m.Categorias })));
const Marcas = React.lazy(() => import('./pages/Marcas').then(m => ({ default: m.Marcas })));
const Unidades = React.lazy(() => import('./pages/Unidades').then(m => ({ default: m.Unidades })));
const Areas = React.lazy(() => import('./pages/Areas').then(m => ({ default: m.Areas })));
const Proveedores = React.lazy(() => import('./pages/Proveedores').then(m => ({ default: m.Proveedores })));
const Productos = React.lazy(() => import('./pages/Productos').then(m => ({ default: m.Productos })));
const Cajas = React.lazy(() => import('./pages/Cajas').then(m => ({ default: m.Cajas })));

const AppRoutes = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><span>Cargando...</span></div>}>
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
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
