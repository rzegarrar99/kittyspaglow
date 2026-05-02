import React from 'react';
import { Box } from 'lucide-react';
import { useUnits } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { CrudPage } from '../components/shared/CrudPage';
import { FormInput, Badge } from '../components/UI';
import { Unit } from '../types';

export const Unidades: React.FC = () => {
  const { data, loading, addItem, updateItem, deleteItem } = useUnits();
  const { addToast } = useToast();

  const handleAdd = async (formData: any) => {
    await addItem(formData);
    addToast('Unidad guardada con éxito 🎀', 'success');
  };

  const handleUpdate = async (id: string, formData: any) => {
    await updateItem(id, formData);
    addToast('Unidad actualizada con éxito 🎀', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    addToast('Unidad eliminada.', 'success');
  };

  return (
    <CrudPage<Unit>
      title="Unidades de Medida"
      subtitle="Unidades para el control de inventario."
      icon={Box}
      itemName="Unidad"
      data={data}
      loading={loading}
      searchKeys={['name', 'abbreviation']}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      initialFormState={{ name: '', abbreviation: '' }}
      columns={[
        { header: 'Unidad', accessor: (item) => item.name, className: 'pl-6' },
        { header: 'Abreviatura', accessor: (item) => <Badge variant="pink">{item.abbreviation}</Badge> }
      ]}
      renderForm={(formData, setFormData) => (
        <>
          <FormInput 
            label="Nombre" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="Ej. Litros, Gramos, Unidades..." 
          />
          <FormInput 
            label="Abreviatura" 
            required 
            value={formData.abbreviation} 
            onChange={e => setFormData({...formData, abbreviation: e.target.value})} 
            placeholder="Ej. ml, gr, und..." 
          />
        </>
      )}
    />
  );
};
