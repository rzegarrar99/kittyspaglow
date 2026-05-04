import React, { useState, useCallback } from 'react';
import { Card, Button, Spinner, Modal, Badge, PageHeader, FormInput, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { UserPlus, Check, Trash2, Edit, KeyRound, AlertTriangle } from 'lucide-react';
import { useStaff, useRoles } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../stores/authStore';
import { Staff as StaffType, Role } from '../types';
import { motion } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { env, isFirebaseConfigured } from '../config/env';
import { useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

// 🚨 NOTA: Si hay un error en la desestructuración de 'refetch' aquí,
// asegúrate de que tu archivo 'frontend/hooks/useQueries.ts' esté actualizado
// y que tu compilador de TypeScript haya recargado los hooks.
export const Staff: React.FC = () => {
  const { staff, loading, addStaff, updateStaff, deleteStaff, refetch } = useStaff();
  const { data: roles = [] } = useRoles();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore(state => state.hasPermission);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffType | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState<{ name: string; username: string; email: string; password?: string; commission_rate: string; roles: Role[] }>({ 
    name: '', 
    username: '',
    email: '', 
    password: '',
    commission_rate: '',
    roles: []
  });

  const { paginated: paginatedStaff, currentPage, totalPages, setCurrentPage, total } = usePagination(staff, 10);

  const openModal = useCallback((member?: StaffType) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        name: member.name,
        username: member.username || '',
        email: member.email,
        password: '', // No mostramos la contraseña al editar por seguridad
        commission_rate: (member.commission_rate * 100).toString(),
        roles: member.roles
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', username: '', email: '', password: '', commission_rate: '0', roles: [] });
    }
    setIsModalOpen(true);
  }, []);

  const toggleRole = (role: Role) => {
    const hasRole = formData.roles.find(r => r.id === role.id);
    if (hasRole) {
      setFormData({ ...formData, roles: formData.roles.filter(r => r.id !== role.id) });
    } else {
      setFormData({ ...formData, roles: [...formData.roles, role] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🛡️ Validación Enterprise: Integridad de Datos
    if (formData.roles.length === 0) {
      addToast('Error: Es obligatorio asignar al menos un rol al usuario. 🎀', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Si es un nuevo usuario y estamos en Firebase, creamos la cuenta en Auth primero
      if (!editingStaff && isFirebaseConfigured && formData.password) {
        const emailToRegister = formData.email || `${formData.username}@spaglowkitty.pe`;
        
        // 🎀 PATRÓN ENTERPRISE: Secondary Firebase App
        // Creamos una app secundaria temporal para registrar al usuario sin desloguear al Admin actual
        const secondaryApp = initializeApp({
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
        }, "SecondaryApp");
        
        const secondaryAuth = getAuth(secondaryApp);
        
        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, emailToRegister, formData.password);
          
          // Cerramos sesión en la app secundaria inmediatamente
          await signOut(secondaryAuth);

          // Guardamos en Firestore usando el UID generado
           await addStaff({ // Ahora addStaff usará el método createWithId si el ID está presente
            id: userCredential.user.uid,
            name: formData.name,
            username: formData.username,
            email: emailToRegister,
            commission_rate: Number(formData.commission_rate) / 100,
            roles: formData.roles
          } as any);
          
          addToast('Nuevo miembro agregado y cuenta creada 🎀', 'success');
        } catch (authError: any) {
          if (authError.code === 'auth/operation-not-allowed') {
            throw new Error("Firebase bloqueó la creación. Ve a Firebase > Authentication > Sign-in method y habilita 'Correo electrónico/Contraseña'.");
          }
          if (authError.code === 'auth/email-already-in-use') {
            throw new Error("Este usuario o correo ya está registrado en el sistema.");
          }
          throw authError;
        }
      } else {
        // Flujo normal de actualización o Modo Demo
        const payload = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          commission_rate: Number(formData.commission_rate) / 100,
          roles: formData.roles
        };

        if (editingStaff) {
          // 🛡️ Lógica Enterprise: updateStaff ahora usa el ID correcto (UID)
          // La lógica de reparación de "No document to update" se maneja en el catch principal
          // si el update falla, y el addStaff lo creará con el ID correcto.
          await updateStaff(editingStaff.id, payload);
          addToast(`Perfil de ${formData.name} actualizado 🎀`, 'success');
        } else {
          await addStaff(payload as any); // Esto ahora usará createWithId si el payload tiene 'id'
          addToast('Nuevo miembro agregado al equipo 🎀', 'success');
        }
      }
      
      // 🛡️ Sincronización Enterprise: Refrescamos la lista antes de cerrar el modal
      if (refetch) await refetch();
      
      setIsModalOpen(false);
    } catch (error: any) {
      let msg = error.message || 'Error al guardar el personal.';
      if (error.code === 'permission-denied') {
        msg = 'No tienes permisos en Firebase para modificar este registro. Revisa las Reglas de Firestore. 🔒';
      } else if (error.message?.includes('No document to update') && editingStaff) {
        // Este caso debería ser manejado por el upsert, pero si llega aquí, es un error más profundo.
        msg = `Error: El documento para ${editingStaff.name} no se encontró. Intenta crear uno nuevo o contacta soporte.`;
      }
      addToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDeleteModal = useCallback((member: StaffType) => {
    setStaffToDelete(member);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    const idToRemove = staffToDelete.id;
    setIsProcessing(true);
    
    try {
      // 🛡️ Flujo Enterprise: Esperamos la confirmación real de la DB antes de actualizar UI
      await deleteStaff(idToRemove);
      
      // Invalidamos y refrescamos antes de cerrar
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      if (refetch) await refetch();

      addToast(`Miembro ${staffToDelete.name} eliminado correctamente 🎀`, 'success');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      const msg = error.code === 'permission-denied'
        ? 'No tienes permiso para eliminar. Revisa las Reglas de Firestore (debe incluir "delete"). 🔒'
        : error.message?.includes('not-found')
          ? 'El registro ya no existe en la base de datos.'
          : 'Ocurrió un problema inesperado al eliminar.';
      addToast(msg, 'error');
    } finally {
      setIsProcessing(false);
      setStaffToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Gestión de Personal" 
        subtitle="Crea usuarios y asígnales contraseñas para que puedan ingresar al sistema." 
        action={<Button onClick={() => openModal()}><UserPlus className="w-5 h-5" /> Nuevo Miembro</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        {loading ? <Spinner /> : (
          <Table>
            <Thead>
              <Th className="pl-6">Especialista</Th>
              <Th>Usuario (Login)</Th>
              <Th>Rol Principal</Th>
              <Th>Comisión Base</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {/* 🛡️ Auditoría Enterprise: Eliminamos el filtro de duplicados. 
                  Si hay 7 registros en la DB, el administrador DEBE ver los 7 para poder limpiar los duplicados. */}
              {paginatedStaff
                .map((member, idx) => {
                const sortedRoles = [...member.roles].sort((a, b) => b.priority - a.priority);
                const highestRole = sortedRoles[0];
                
                return (
                  <Tr key={`${member.id}-${idx}`} index={idx}>
                    <Td className="pl-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src={member.avatarUrl} 
                          alt={member.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 shadow-sm"
                          style={{ borderColor: highestRole?.color || '#FF2A7A' }}
                        />
                        <div>
                          <span className="font-extrabold text-lg" style={{ color: highestRole?.color || '#2D1B2E' }}>
                            {member.name}
                          </span>
                          <p className="text-xs text-plum/60 font-bold">{member.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant="gray">{member.username || 'Sin usuario'}</Badge>
                    </Td>
                    <Td>
                      {highestRole ? (
                        <span className="text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1 w-max" style={{ backgroundColor: `${highestRole.color}15`, color: highestRole.color, borderColor: `${highestRole.color}30` }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: highestRole.color }}></div>
                          {highestRole.name}
                        </span>
                      ) : (
                        <span className="text-plum/40 text-sm italic font-bold">Sin rol asignado</span>
                      )}
                    </Td>
                    <Td className="font-bold text-plum/70">
                      {(member.commission_rate * 100).toFixed(0)}%
                    </Td>
                    <Td className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(member)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDeleteModal(member)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>
      <Pagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Editar Miembro" : "Nuevo Miembro del Equipo"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Nombre Completo" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. María Masajista" />
            <FormInput label="Comisión Base (%)" required type="number" min="0" max="100" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: e.target.value})} placeholder="Ej. 10" />
            
            <div className="md:col-span-2 border-t border-white/50 pt-4 mt-2">
              <h4 className="text-sm font-extrabold text-plum mb-3 flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary"/> Credenciales de Acceso</h4>
            </div>
            
            <FormInput label="Nombre de Usuario (Para Login)" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Ej. maria123" />
            <FormInput label="Correo Electrónico (Opcional)" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Ej. maria@spaglowkitty.pe" />
            
            {!editingStaff && (
              <FormInput className="md:col-span-2" label="Contraseña Inicial" required type="password" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Mínimo 6 caracteres" />
            )}
          </div>

          <div className="border-t border-white/50 pt-4">
            <label className="block text-sm font-extrabold text-plum mb-3 uppercase tracking-wider">Asignar Roles</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.length === 0 ? (
                <div className="sm:col-span-2 p-6 bg-red-50/50 border-2 border-dashed border-red-200 rounded-[2rem] text-center animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-black text-xs uppercase tracking-tight">Acción Requerida</p>
                  <p className="text-red-600 text-[10px] mt-1 font-bold leading-tight">No puedes crear personal porque no existen roles. Ve al módulo de <strong>Roles</strong> y crea uno (ej. "Administradora") primero.</p>
                </div>
              ) : (
                roles.map(role => {
                const isSelected = formData.roles.some(r => r.id === role.id);
                return (
                  <div 
                    key={role.id} 
                    onClick={() => toggleRole(role)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'bg-white/80 shadow-sm' : 'hover:bg-white/50 border-transparent'
                    }`}
                    style={{ borderColor: isSelected ? role.color : 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                      <span className="font-bold text-sm" style={{ color: role.color }}>{role.name}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'text-white' : 'border-plum/20'
                    }`} style={{ backgroundColor: isSelected ? role.color : 'transparent', borderColor: isSelected ? role.color : '' }}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <Spinner size="sm" /> : (editingStaff ? "Actualizar Perfil" : "Crear Usuario")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 🎀 UX Senior: Modal de Confirmación de Eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-red-50 text-red-500 border-4 border-white shadow-sm">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div>
            <p className="text-plum/80 font-bold text-lg">¿Estás segura de eliminar a este miembro?</p>
            <p className="text-plum/50 text-sm font-semibold mt-1">
              Esta acción eliminará el perfil de <strong>{staffToDelete?.name}</strong>. El acceso a su cuenta será revocado en la base de datos.
            </p>
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-gradient-to-r from-red-500 to-red-400 shadow-lg text-white" 
              onClick={confirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? <Spinner size="sm" /> : "Eliminar Perfil"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
