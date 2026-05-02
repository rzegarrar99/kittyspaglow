import React from 'react';
import { Tags } from 'lucide-react';
import { useBrands } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { CrudPage } from '../components/shared/CrudPage';
import { FormInput, Badge } from '../components/UI';
import { Brand } from '../types';

export const Marcas: React.FC = () => {
  const { data, loading, addItem, updateItem, deleteItem } = useBrands();
  const { addToast } = useToast();

  const handleAdd = async (formData: any) => {
    await addItem(formData);
    addToast('Marca guardada con éxito 🎀', 'success');
  };

  const handleUpdate = async (id: string, formData: any) => {
    await updateItem(id, formData);
    addToast('Marca actualizada con éxito 🎀', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    addToast('Marca eliminada.', 'success');
  };

  return (
    <CrudPage<Brand>
      title="Marcas"
      subtitle="Marcas de productos utilizados en el spa."
      icon={Tags}
      itemName="Marca"
      data={data}
      loading={loading}
      searchKeys={['name', 'description', 'origin']}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      initialFormState={{ name: '', description: '', origin: '' }}
      columns={[
        { header: 'Marca', accessor: (item) => item.name, className: 'pl-6' },
        { header: 'Descripción', accessor: (item) => <span className="text-plum/70 font-semibold">{item.description || '-'}</span> },
        { header: 'Origen', accessor: (item) => <Badge variant="gray">{item.origin || '-'}</Badge> }
      ]}
      renderForm={(formData, setFormData) => (
        <>
          <FormInput 
            label="Nombre" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="Ej. Glow Beauty, L'Oréal..." 
          />
          <FormInput 
            label="Descripción" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            placeholder="Ej. Línea premium de cuidado facial" 
          />
          <FormInput 
            label="País de Origen" 
            value={formData.origin} 
            onChange={e => setFormData({...formData, origin: e.target.value})} 
            placeholder="Ej. Francia, Japón, Perú..." 
          />
        </>
      )}
    />
  );
};
