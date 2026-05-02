export interface Role {
  id: string;
  name: string;
  color: string;
  priority: number;
  permissions: string[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  username: string; // Nuevo campo para login sin correo
  roles: Role[];
  commission_rate: number;
  avatarUrl: string;
}
