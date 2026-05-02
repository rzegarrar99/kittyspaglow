import React, { useState } from 'react';
import { Card, Button, Spinner, Modal, EmptyState, Badge, PageHeader, FormInput, FormSelect, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { ShoppingCart, Plus } from 'lucide-react';
import { usePurchases, useSuppliers, useOrders, useInventory, useKardex } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../stores/authStore';
import { PaymentMethod } from '../types';

export const Compras: React.FC = () => {
  const { data: purchases, loading, addItem } = usePurchases();
  const { data: suppliers } = useSuppliers();
  const { data: inventory, updateItem: updateInventory } = useInventory();
  const { addItem: addKardex } = useKardex();
  const { addMovement } = useOrders();
  const { addToast } = useToast();
  const user = useAuthStore(state => state.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ supplier_id: '', item_id: '', quantity: '', cost: '', payment_method: 'Transferencia' as PaymentMethod });

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Desconocido';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.quantity);
    const cost = Number(formData.cost);
    const totalAmount = qty * cost;
    const supplierName = getSupplierName(formData.supplier_id);
    const item = inventory.find(i => i.id === formData.item_id);

    if (!item) return;

    await addItem({
      supplier_id: formData.supplier_id,
      total: totalAmount,
      date: new Date().toISOString(),
      status: 'Completado'
    });

    await addMovement({
      type: 'Egreso',
      description: `Compra a ${supplierName}: ${qty}x ${item.name}`,
      amount: totalAmount,
      payment_method: formData.payment_method
    });

    const newStock = item.stock + qty;
    await updateInventory(item.id, { stock: newStock });
    
    await addKardex({
      item_id: item.id,
      type: 'Ingreso',
      quantity: qty,
      balance: newStock,
      reason: `Compra a Proveedor`,
      reference: supplierName,
      unit_cost: cost,
      total_cost: totalAmount,
      staff_name: user?.name || 'Sistema',
      date: new Date().toISOString()
    });

    addToast('Compra registrada y stock actualizado 🎀', 'success');
    setIsModalOpen(false);
    setFormData({ supplier_id: '', item_id: '', quantity: '', cost: '', payment_method: 'Transferencia' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Compras" 
        subtitle="Registro de compras y abastecimiento." 
        action={<Button onClick={() => setIsModalOpen(true)}><Plus className="w-5 h-5" /> Registrar Compra</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        {loading ? <Spinner /> : purchases.length === 0 ? <EmptyState message="No hay compras registradas." /> : (
          <Table>
            <Thead>
              <Th className="pl-6">Fecha</Th>
              <Th>Proveedor</Th>
              <Th>Total</Th>
              <Th>Estado</Th>
            </Thead>
            <Tbody>
              {purchases.map((purchase, idx) => (
                <Tr key={purchase.id} index={idx}>
                  <Td className="pl-6 font-semibold text-plum/80">
                    {new Date(purchase.date).toLocaleDateString('es-PE')}
                  </Td>
                  <Td className="font-bold text-plum flex items-center gap-3">
                    <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    {getSupplierName(purchase.supplier_id)}
                  </Td>
                  <Td className="font-extrabold text-primary">S/. {purchase.total.toFixed(2)}</Td>
                  <Td>
                    <Badge variant={purchase.status === 'Completado' ? 'pink' : 'gray'}>{purchase.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Compra">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect label="Proveedor" required value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
            <option value="">Seleccionar...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FormSelect>
          <FormSelect label="Producto a Abastecer" required value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})}>
            <option value="">Seleccionar Producto...</option>
            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.stock})</option>)}
          </FormSelect>
          <div className="grid grid-cols-3 gap-4">
            <FormInput label="Cantidad" required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="Ej. 10" />
            <FormInput label="Costo Unitario (S/.)" required type="number" min="0.1" step="0.1" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
            <FormSelect label="Método de Pago" required value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})}>
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo (Caja)</option>
              <option value="Tarjeta">Tarjeta</option>
            </FormSelect>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar y Actualizar Stock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
