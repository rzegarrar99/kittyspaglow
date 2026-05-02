import React from 'react';
import { MapPin } from 'lucide-react';
import { useAreas } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { CrudPage } from '../components/shared/CrudPage';
import { FormInput, FormSelect, Badge } from '../components/UI';
import { Area } from '../types';

export const Areas: React.FC = () => {
  const { data, loading, addItem, updateItem, deleteItem } = useAreas();
  const { addToast } = useToast();

  const handleAdd = async (formData: any) => {
    await addItem(formData);
    addToast('Área guardada con éxito 🎀', 'success');
  };

  const handleUpdate = async (id: string, formData: any) => {
    await updateItem(id, formData);
    addToast('Área actualizada con éxito 🎀', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    addToast('Área eliminada.', 'success');
  };

  return (
    <CrudPage<Area>
      title="Áreas del Spa"
      subtitle="Salas y espacios de atención."
      icon={MapPin}
      itemName="Área"
      data={data}
      loading={loading}
      searchKeys={['name']}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      initialFormState={{ name: '', capacity: 1, status: 'Disponible' }}
      columns={[
        { header: 'Nombre del Área', accessor: (item) => item.name, className: 'pl-6' },
        { header: 'Capacidad', accessor: (item) => <span className="text-plum/70 font-semibold">{item.capacity} personas</span> },
        { header: 'Estado', accessor: (item) => (
          <Badge variant={item.status === 'Disponible' ? 'pink' : item.status === 'Ocupado' ? 'red' : 'gray'}>
            {item.status}
          </Badge>
        )}
      ]}
      renderForm={(formData, setFormData) => (
        <>
          <FormInput 
            label="Nombre" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="Ej. Sala VIP 1, Cabina de Masajes..." 
          />
          <FormInput 
            label="Capacidad (Personas)" 
            required 
            type="number" 
            min="1" 
            value={formData.capacity} 
            onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} 
            placeholder="Ej. 1" 
          />
          <FormSelect 
            label="Estado Inicial" 
            value={formData.status} 
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="Disponible">Disponible</option>
            <option value="Ocupado">Ocupado</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </FormSelect>
        </>
      )}
    />
  );
};
