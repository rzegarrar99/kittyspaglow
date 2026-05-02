import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasPermission = useAuthStore(state => state.hasPermission);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/denegado" replace />;
  }

  return <>{children}</>;
};
