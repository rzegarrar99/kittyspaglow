import React from 'react';
import { Truck, Phone, Mail } from 'lucide-react';
import { useSuppliers } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { CrudPage } from '../components/shared/CrudPage';
import { FormInput } from '../components/UI';
import { Supplier } from '../types';

export const Proveedores: React.FC = () => {
  const { data, loading, addItem, updateItem, deleteItem } = useSuppliers();
  const { addToast } = useToast();

  const handleAdd = async (formData: any) => {
    await addItem(formData);
    addToast('Proveedor guardado con éxito 🎀', 'success');
  };

  const handleUpdate = async (id: string, formData: any) => {
    await updateItem(id, formData);
    addToast('Proveedor actualizado con éxito 🎀', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    addToast('Proveedor eliminada.', 'success');
  };

  return (
    <CrudPage<Supplier>
      title="Proveedores"
      subtitle="Directorio de proveedores del spa."
      icon={Truck}
      itemName="Proveedor"
      data={data}
      loading={loading}
      searchKeys={['name', 'ruc', 'email']}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      initialFormState={{ name: '', ruc: '', phone: '', email: '' }}
      columns={[
        { header: 'Razón Social', accessor: (item) => item.name, className: 'pl-6' },
        { header: 'RUC', accessor: (item) => <span className="text-plum/70 font-semibold">{item.ruc}</span> },
        { header: 'Contacto', accessor: (item) => (
          <div className="flex flex-col gap-1 text-sm text-plum/80 font-semibold">
            <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-primary/60" /> {item.phone}</div>
            <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-accent/60" /> {item.email}</div>
          </div>
        )}
      ]}
      renderForm={(formData, setFormData) => (
        <>
          <FormInput 
            label="Razón Social" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="Ej. Distribuidora Belleza SAC" 
          />
          <FormInput 
            label="RUC" 
            required 
            maxLength={11} 
            value={formData.ruc} 
            onChange={e => setFormData({...formData, ruc: e.target.value})} 
            placeholder="Ej. 20555555555" 
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              label="Teléfono" 
              required 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="Ej. 999888777" 
            />
            <FormInput 
              label="Correo" 
              required 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="Ej. ventas@proveedor.com" 
            />
          </div>
        </>
      )}
    />
  );
};
