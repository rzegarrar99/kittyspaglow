import React from 'react';
import { useAuthStore } from '../stores/authStore';

interface HasPermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({ permission, children, fallback = null }) => {
  const hasPermission = useAuthStore(state => state.hasPermission);

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
