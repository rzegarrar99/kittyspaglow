import React, { useState } from 'react';
import { Card, Button, Spinner, Modal, EmptyState, PageHeader, SearchBar, Table, Thead, Tbody, Tr, Th, Td } from '../UI';
import { Plus, Trash2, Edit } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface CrudPageProps<T extends { id: string }> {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  data: T[];
  loading: boolean;
  columns: Column<T>[];
  searchKeys: (keyof T)[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  renderForm: (formData: any, setFormData: (data: any) => void, isEditing: boolean) => React.ReactNode;
  initialFormState: any;
  itemName: string;
}

export function CrudPage<T extends { id: string }>({
  title,
  subtitle,
  icon: Icon,
  data,
  loading,
  columns,
  searchKeys,
  onAdd,
  onUpdate,
  onDelete,
  renderForm,
  initialFormState,
  itemName
}: CrudPageProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredData = data.filter(item => 
    searchKeys.some(key => {
      const val = item[key];
      return typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const openModal = (item?: T) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await onUpdate(editingItem.id, formData);
    } else {
      await onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      await onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title={title} 
        subtitle={subtitle} 
        action={<Button onClick={() => openModal()}><Plus className="w-5 h-5" /> Nuevo {itemName}</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/50 flex items-center gap-4 bg-white/40">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder={`Buscar ${itemName.toLowerCase()}...`} />
        </div>

        {loading ? (
          <Spinner />
        ) : filteredData.length === 0 ? (
          <EmptyState message={`No se encontraron ${itemName.toLowerCase()}s.`} />
        ) : (
          <Table>
            <Thead>
              {columns.map((col, i) => (
                <Th key={i} className={col.className}>{col.header}</Th>
              ))}
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {filteredData.map((item, idx) => (
                <Tr key={item.id} index={idx}>
                  {columns.map((col, i) => (
                    <Td key={i} className={col.className}>
                      {i === 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-plum">{col.accessor(item)}</span>
                        </div>
                      ) : (
                        col.accessor(item)
                      )}
                    </Td>
                  ))}
                  <Td className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(item)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => confirmDelete(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-all">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Editar ${itemName}` : `Nuevo ${itemName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm(formData, setFormData, !!editingItem)}
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingItem ? "Actualizar" : "Guardar"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Estás segura de eliminar este ${itemName.toLowerCase()}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </div>
  );
};
