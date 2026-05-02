import React from 'react';
import { BookOpen } from 'lucide-react';
import { useCategories } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { CrudPage } from '../components/shared/CrudPage';
import { FormInput } from '../components/UI';
import { SimpleDictionary } from '../types';

export const Categorias: React.FC = () => {
  const { data, loading, addItem, updateItem, deleteItem } = useCategories();
  const { addToast } = useToast();

  const handleAdd = async (formData: any) => {
    await addItem(formData);
    addToast('Categoría guardada con éxito 🎀', 'success');
  };

  const handleUpdate = async (id: string, formData: any) => {
    await updateItem(id, formData);
    addToast('Categoría actualizada con éxito 🎀', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    addToast('Categoría eliminada.', 'success');
  };

  return (
    <CrudPage<SimpleDictionary>
      title="Categorías"
      subtitle="Clasificación de productos y servicios."
      icon={BookOpen}
      itemName="Categoría"
      data={data}
      loading={loading}
      searchKeys={['name', 'description']}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      initialFormState={{ name: '', description: '' }}
      columns={[
        { header: 'Nombre', accessor: (item) => item.name, className: 'pl-6' },
        { header: 'Descripción', accessor: (item) => <span className="text-plum/70 font-semibold">{item.description || '-'}</span> }
      ]}
      renderForm={(formData, setFormData) => (
        <>
          <FormInput 
            label="Nombre" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="Ej. Faciales, Masajes, Cremas..." 
          />
          <FormInput 
            label="Descripción" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            placeholder="Ej. Tratamientos para el cuidado del rostro" 
          />
        </>
      )}
    />
  );
};
