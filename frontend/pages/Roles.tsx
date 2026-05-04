import React, { useState, useMemo } from 'react';
import { Card, Button, Spinner, Modal, EmptyState, PageHeader, FormInput, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { Plus, Trash2, Edit, Check } from 'lucide-react';
import { useRoles } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { Role } from '../types';
import { AVAILABLE_PERMISSIONS } from '../constants';
import { ConfirmModal } from '../components/shared/ConfirmModal';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

export const Roles: React.FC = () => {
  const { data: roles, loading, addItem, updateItem, deleteItem } = useRoles();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#FF2A7A' });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof AVAILABLE_PERMISSIONS> = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, []);

  const { paginated: paginatedRoles, currentPage, totalPages, setCurrentPage, total } = usePagination([...roles].sort((a, b) => b.priority - a.priority), 10);

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, color: role.color });
      setSelectedPerms(role.permissions);
    } else {
      setEditingRole(null);
      setFormData({ name: '', color: '#FF2A7A' });
      setSelectedPerms([]);
    }
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    if (permId === '*') {
      setSelectedPerms(selectedPerms.includes('*') ? [] : ['*']);
      return;
    }
    if (selectedPerms.includes('*')) return;

    if (selectedPerms.includes(permId)) {
      setSelectedPerms(selectedPerms.filter(id => id !== permId));
    } else {
      setSelectedPerms([...selectedPerms, permId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calculatedPriority = selectedPerms.includes('*') ? 1000 : selectedPerms.length * 10;

      const payload = {
        name: formData.name,
        color: formData.color,
        priority: calculatedPriority,
        permissions: selectedPerms
      };

      if (editingRole) {
        await updateItem(editingRole.id, payload);
        addToast('Rol actualizado con éxito 🎀', 'success');
      } else {
        await addItem(payload);
        addToast('Rol creado con éxito 🎀', 'success');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error al guardar rol:", error);
      addToast(
        error.message?.includes('permissions') 
          ? 'Error: No tienes permisos en Firebase para crear roles. 🔒' 
          : 'Ocurrió un error al procesar el rol.', 
        'error'
      );
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteItem(deleteTargetId);
      addToast('Rol eliminado.', 'success');
    } catch {
      addToast('No se pudo eliminar el rol. Revisa los permisos.', 'error');
    }
    setDeleteTargetId(null);
  };

  const isAdmin = selectedPerms.includes('*');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Gestión de Roles" 
        subtitle="La prioridad se calcula automáticamente según los permisos 🎀" 
        action={<Button onClick={() => openModal()}><Plus className="w-5 h-5" /> Nuevo Rol</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        {loading ? <Spinner /> : roles.length === 0 ? <EmptyState message="No hay roles registrados." /> : (
          <Table>
            <Thead>
              <Th className="pl-6">Rol</Th>
              <Th>Prioridad (Auto)</Th>
              <Th>Permisos</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {paginatedRoles.map((role, idx) => (
                <Tr key={role.id} index={idx}>
                  <Td className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-sm border border-white" style={{ backgroundColor: role.color }}></div>
                      <span className="font-extrabold text-plum uppercase tracking-wide" style={{ color: role.color }}>{role.name}</span>
                    </div>
                  </Td>
                  <Td className="text-plum/70 font-bold">{role.priority} pts</Td>
                  <Td>
                    {role.permissions.includes('*') ? (
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-accent/20 text-yellow-700 border border-accent/30">Administrador Total</span>
                    ) : (
                      <span className="text-xs font-bold text-plum/60">{role.permissions.length} permisos asignados</span>
                    )}
                  </Td>
                  <Td className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(role)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(role.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
      <Pagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? "Editar Rol" : "Nuevo Rol"} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Nombre del Rol" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Cajera Fin de Semana" />
            <div>
              <label className="block text-xs font-bold text-plum/60 mb-2 ml-1 uppercase tracking-wider">Color del Rol</label>
              <div className="flex items-center gap-4">
                <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm" />
                <span className="font-bold text-plum/60">{formData.color.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/50 pt-4">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-extrabold text-plum uppercase tracking-wider">Permisos del Sistema</label>
              <label className="flex items-center gap-2 cursor-pointer bg-accent/10 px-4 py-2 rounded-full border border-accent/30 hover:bg-accent/20 transition-colors">
                <input type="checkbox" checked={isAdmin} onChange={() => togglePermission('*')} className="rounded text-accent focus:ring-accent/20 w-4 h-4" />
                <span className="text-xs font-black text-yellow-700 uppercase">Administrador Total (*)</span>
              </label>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
                  <h4 className="font-black text-primary mb-3 uppercase text-[10px] tracking-widest">{group}</h4>
                  <div className="space-y-2">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-3 cursor-pointer group/label">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPerms.includes(p.id) ? 'bg-primary border-primary text-white' : 'bg-white border-plum/20 group-hover/label:border-primary/50'}`}>
                          {selectedPerms.includes(p.id) && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm font-bold text-plum/80 group-hover/label:text-plum transition-colors">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingRole ? "Actualizar Rol" : "Crear Rol"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar rol"
        message="¿Estás segura de eliminar este rol? Los usuarios con este rol perderán sus permisos."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
};
