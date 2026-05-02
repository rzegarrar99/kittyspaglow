import React, { useState } from 'react';
import { Card, Badge, Spinner, Button, Modal, EmptyState, PageHeader, SearchBar, FormSelect, FormInput, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { AlertTriangle, Archive, ArrowRightLeft, FileText } from 'lucide-react';
import { useInventory, useKardex } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../stores/authStore';
import { InventoryItem } from '../types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Almacen: React.FC = () => {
  const { data: inventory, loading, updateItem } = useInventory();
  const { addItem: addKardex } = useKardex();
  const { addToast } = useToast();
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'Ingreso', quantity: '', reason: 'Inventario Inicial' });

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.stock <= item.minStock);

  const openAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustForm({ type: 'Ingreso', quantity: '', reason: 'Inventario Inicial' });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    
    const qty = Number(adjustForm.quantity);
    const newStock = adjustForm.type === 'Ingreso' 
      ? adjustingItem.stock + qty 
      : adjustingItem.stock - qty;

    if (newStock < 0) {
      addToast('El stock no puede ser negativo.', 'error');
      return;
    }

    await updateItem(adjustingItem.id, { stock: newStock, lastUpdated: new Date().toISOString() });
    
    await addKardex({
      item_id: adjustingItem.id,
      type: adjustForm.type as 'Ingreso' | 'Salida',
      quantity: qty,
      balance: newStock,
      reason: adjustForm.reason,
      reference: 'Ajuste Manual',
      unit_cost: adjustingItem.cost,
      total_cost: qty * adjustingItem.cost,
      staff_name: user?.name || 'Sistema',
      date: new Date().toISOString()
    });

    addToast(`Stock actualizado: ${newStock} unidades.`, 'success');
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Control de Almacén" 
        subtitle="Monitorea el stock y revisa el Kardex de movimientos." 
      />

      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-red-50/80 border-red-100 flex items-start gap-4">
            <div className="bg-white/80 p-3 rounded-full text-red-500 shrink-0 border border-white shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-red-800 font-extrabold text-lg">¡Alerta de Stock Bajo!</h3>
              <p className="text-red-600/80 font-bold text-sm mt-1">
                Hay {lowStockItems.length} producto(s) por debajo del nivel mínimo. Por favor, ajusta el stock o abastece los productos.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/50 flex items-center gap-4 bg-white/40">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar producto o categoría..." />
        </div>

        {loading ? <Spinner /> : filteredInventory.length === 0 ? <EmptyState message="No hay productos en el almacén." /> : (
          <Table>
            <Thead>
              <Th className="pl-6">Producto</Th>
              <Th>Stock Actual</Th>
              <Th>Stock Mínimo</Th>
              <Th>Estado</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {filteredInventory.map((item, idx) => {
                const isLowStock = item.stock <= item.minStock;
                
                return (
                  <Tr key={item.id} index={idx}>
                    <Td className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                          <Archive className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-plum">{item.name}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className={`font-extrabold text-lg ${isLowStock ? 'text-red-500' : 'text-plum'}`}>
                        {item.stock} <span className="text-sm font-bold text-plum/50">{item.unit ? item.unit.split(' ')[0] : 'und'}</span>
                      </span>
                    </Td>
                    <Td className="font-bold text-plum/70">{item.minStock}</Td>
                    <Td>
                      {isLowStock ? <Badge variant="red">Bajo</Badge> : <Badge variant="pink">Normal</Badge>}
                    </Td>
                    <Td className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/almacen/kardex/${item.id}`)} className="py-1.5 px-3 text-sm">
                          <FileText className="w-4 h-4" /> Kardex
                        </Button>
                        <Button variant="outline" onClick={() => openAdjustModal(item)} className="py-1.5 px-3 text-sm">
                          <ArrowRightLeft className="w-4 h-4" /> Ajustar
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Ajustar Stock Manualmente">
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div className="bg-white/50 p-4 rounded-2xl border border-white mb-4">
            <p className="text-sm font-bold text-plum/60 uppercase tracking-wider">Producto Seleccionado</p>
            <p className="font-extrabold text-plum text-lg">{adjustingItem?.name}</p>
            <p className="text-sm font-bold text-primary mt-1">Stock Actual: {adjustingItem?.stock}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormSelect 
              label="Tipo de Ajuste" 
              required 
              value={adjustForm.type} 
              onChange={e => {
                const newType = e.target.value;
                setAdjustForm({
                  ...adjustForm, 
                  type: newType,
                  reason: newType === 'Ingreso' ? 'Inventario Inicial' : 'Uso interno (Spa)'
                });
              }}
            >
              <option value="Ingreso">Ingreso (+)</option>
              <option value="Salida">Salida (-)</option>
            </FormSelect>
            <FormInput label="Cantidad" required type="number" min="1" value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})} />
          </div>
          <FormSelect label="Motivo del Ajuste" required value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}>
            {adjustForm.type === 'Ingreso' ? (
              <>
                <option value="Inventario Inicial">Inventario Inicial</option>
                <option value="Devolución de Cliente">Devolución de Cliente</option>
                <option value="Ajuste por Sobrante">Ajuste por Sobrante</option>
                <option value="Muestra Gratis / Regalo">Muestra Gratis / Regalo</option>
                <option value="Otro (Ingreso)">Otro (Ingreso)</option>
              </>
            ) : (
              <>
                <option value="Uso interno (Spa)">Uso interno (Spa)</option>
                <option value="Merma / Vencimiento">Merma / Vencimiento</option>
                <option value="Producto Dañado">Producto Dañado</option>
                <option value="Ajuste por Faltante">Ajuste por Faltante</option>
                <option value="Otro (Salida)">Otro (Salida)</option>
              </>
            )}
          </FormSelect>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Confirmar Ajuste</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
