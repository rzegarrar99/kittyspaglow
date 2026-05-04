import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Modal, EmptyState, PageHeader, SearchBar, FormInput, FormSelect, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { Plus, Sparkles, Clock, Trash2, Edit } from 'lucide-react';
import { useServices, useCategories } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { Service } from '../types';
import { ConfirmModal } from '../components/shared/ConfirmModal';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

export const Servicios: React.FC = () => {
  const { services, loading, addService, updateService, deleteService } = useServices();
  const { data: categories } = useCategories();
  const { addToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState({ name: '', category: '', price: '', duration: '' });

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { paginated, currentPage, totalPages, setCurrentPage, total } = usePagination(filteredServices, 10);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category: service.category,
        price: service.price.toString(),
        duration: service.duration.toString()
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', category: '', price: '', duration: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      addToast('Por favor selecciona una categoría.', 'error');
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      duration: Number(formData.duration)
    };

    if (editingService) {
      await updateService(editingService.id, payload);
      addToast('¡Servicio actualizado con éxito! ✨', 'success');
    } else {
      await addService(payload);
      addToast('¡Servicio agregado al catálogo! ✨', 'success');
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) await deleteService(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Catálogo de Servicios" 
        subtitle="Administra los tratamientos del spa." 
        action={<Button onClick={() => openModal()}><Plus className="w-5 h-5" /> Nuevo Servicio</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/50 flex items-center gap-4 bg-white/40">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar servicio o categoría..." />
        </div>

        {loading ? (
          <Spinner />
        ) : filteredServices.length === 0 ? (
          <EmptyState message="No se encontraron servicios." />
        ) : (
          <Table>
            <Thead>
              <Th className="pl-6">Servicio</Th>
              <Th>Categoría</Th>
              <Th>Duración</Th>
              <Th>Precio (S/.)</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {paginated.map((service, idx) => (
                <Tr key={service.id} index={idx}>
                  <Td className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-plum">{service.name}</span>
                    </div>
                  </Td>
                  <Td><Badge variant="pink">{service.category}</Badge></Td>
                  <Td>
                    <div className="flex items-center gap-2 text-plum/70 font-semibold">
                      <Clock className="w-4 h-4" /> {service.duration} min
                    </div>
                  </Td>
                  <Td className="font-extrabold text-primary text-lg">
                    S/. {service.price.toFixed(2)}
                  </Td>
                  <Td className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(service)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-all">
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        pageSize={10}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Nombre del Servicio" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Limpieza Facial Profunda" />
          <FormSelect label="Categoría" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="">Seleccionar Categoría...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </FormSelect>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Precio (S/.)" required type="number" min="0" step="0.1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
            <FormInput label="Duración (min)" required type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="Ej. 60" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingService ? "Actualizar" : "Guardar Servicio"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar servicio"
        message="¿Estás segura de eliminar este servicio? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
};
