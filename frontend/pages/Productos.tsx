import React, { useState } from 'react';
import { Card, Badge, Spinner, Button, Modal, EmptyState, PageHeader, SearchBar, FormInput, FormSelect, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { Package, Plus, Trash2, Edit } from 'lucide-react';
import { useInventory, useCategories, useBrands, useUnits } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { InventoryItem } from '../types';

export const Productos: React.FC = () => {
  const { data: inventory, loading, addItem, updateItem, deleteItem } = useInventory();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: units } = useUnits();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    name: '', category: '', brand: '', unit: '', stock: '', minStock: '', cost: '', price: ''
  });

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name, category: item.category, brand: item.brand || '', unit: item.unit || '',
        stock: item.stock.toString(), minStock: item.minStock.toString(), cost: item.cost.toString(), price: item.price.toString()
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', category: '', brand: '', unit: '', stock: '0', minStock: '5', cost: '', price: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name, category: formData.category, brand: formData.brand, unit: formData.unit,
      stock: Number(formData.stock), minStock: Number(formData.minStock), cost: Number(formData.cost), price: Number(formData.price),
      lastUpdated: new Date().toISOString()
    };

    if (editingItem) {
      await updateItem(editingItem.id, payload);
      addToast('Producto actualizado 🎀', 'success');
    } else {
      await addItem(payload);
      addToast('Producto agregado al catálogo 🎀', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás segura de eliminar este producto del catálogo?')) {
      await deleteItem(id);
      addToast('Producto eliminado.', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Catálogo de Productos" 
        subtitle="Define los productos que vendes en el Spa." 
        action={<Button onClick={() => openModal()}><Plus className="w-5 h-5" /> Nuevo Producto</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/50 flex items-center gap-4 bg-white/40">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar producto, categoría o marca..." />
        </div>

        {loading ? <Spinner /> : filteredInventory.length === 0 ? <EmptyState message="No hay productos registrados." /> : (
          <Table>
            <Thead>
              <Th className="pl-6">Producto</Th>
              <Th>Marca</Th>
              <Th>Categoría</Th>
              <Th>Costo (S/.)</Th>
              <Th>Precio Venta (S/.)</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {filteredInventory.map((item, idx) => (
                <Tr key={item.id} index={idx}>
                  <Td className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-plum">{item.name}</span>
                    </div>
                  </Td>
                  <Td className="text-plum/70 font-semibold">{item.brand || '-'}</Td>
                  <Td><Badge variant="gray">{item.category}</Badge></Td>
                  <Td className="font-semibold text-plum/70">S/. {item.cost.toFixed(2)}</Td>
                  <Td className="font-extrabold text-primary">S/. {item.price.toFixed(2)}</Td>
                  <Td className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(item)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Producto" : "Nuevo Producto"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Nombre del Producto" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Crema Facial Ácido Hialurónico" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect label="Categoría" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">Seleccionar...</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </FormSelect>
            <FormSelect label="Marca" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
              <option value="">Ninguna...</option>
              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </FormSelect>
            <FormSelect label="Unidad" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
              <option value="">Ninguna...</option>
              {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </FormSelect>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {!editingItem && (
              <FormInput label="Stock Inicial" required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
            )}
            <FormInput label="Stock Mínimo" required type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} placeholder="5" />
            <FormInput label="Costo (S/.)" required type="number" min="0" step="0.1" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
            <FormInput label="Precio Venta (S/.)" required type="number" min="0" step="0.1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingItem ? "Actualizar" : "Guardar Producto"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
