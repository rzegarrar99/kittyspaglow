import React, { useState } from 'react';
import { Card, Button, Badge, Modal, EmptyState, PageHeader, FormInput, FormSelect, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { Receipt, Plus, TrendingDown } from 'lucide-react';
import { useOrders } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { PaymentMethod } from '../types';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

export const Gastos: React.FC = () => {
  const { movements, addMovement } = useOrders();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ description: '', amount: '', payment_method: 'Efectivo' as PaymentMethod });

  const expenses = movements.filter(m => m.type === 'Egreso');
  const totalExpenses = expenses.reduce((sum, m) => sum + m.amount, 0);

  const { paginated: paginatedExpenses, currentPage, totalPages, setCurrentPage, total } = usePagination(expenses, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMovement({
      type: 'Egreso',
      description: formData.description,
      amount: Number(formData.amount),
      payment_method: formData.payment_method
    });
    addToast('¡Gasto registrado correctamente! 💸', 'success');
    setIsModalOpen(false);
    setFormData({ description: '', amount: '', payment_method: 'Efectivo' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Control de Gastos" 
        subtitle="Registra y monitorea los egresos del spa." 
        action={<Button onClick={() => setIsModalOpen(true)}><Plus className="w-5 h-5" /> Nuevo Gasto</Button>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-red-50/80 border-red-100 flex items-center gap-4">
          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm text-red-500">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-800/60 uppercase tracking-widest">Total Egresos</p>
            <h3 className="text-2xl font-extrabold text-red-600">S/. {totalExpenses.toFixed(2)}</h3>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {paginatedExpenses.length === 0 && total === 0 ? (
          <EmptyState message="No hay gastos registrados aún." />
        ) : (
          <Table>
            <Thead>
              <Th className="pl-6">Fecha</Th>
              <Th>Descripción</Th>
              <Th>Método de Pago</Th>
              <Th>Tipo</Th>
              <Th className="text-right pr-6">Monto</Th>
            </Thead>
            <Tbody>
              {paginatedExpenses.map((expense, idx) => (
                <Tr key={expense.id} index={idx}>
                  <Td className="pl-6 font-semibold text-plum/80">
                    {new Date(expense.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </Td>
                  <Td className="font-bold text-plum flex items-center gap-3">
                    <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                      <Receipt className="w-4 h-4 text-primary" />
                    </div>
                    {expense.description}
                  </Td>
                  <Td><Badge variant="gray">{expense.payment_method}</Badge></Td>
                  <Td><Badge variant="red">Egreso</Badge></Td>
                  <Td className="pr-6 text-right font-extrabold text-red-500">
                    - S/. {expense.amount.toFixed(2)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
      <Pagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Gasto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Descripción del Gasto" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Compra de insumos, Pago de luz..." />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Monto (S/.)" required type="number" min="0.1" step="0.1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            <FormSelect label="Método de Pago" required value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})}>
              <option value="Efectivo">Efectivo (Caja)</option>
              <option value="Transferencia">Transferencia (Banco)</option>
              <option value="Tarjeta">Tarjeta (Banco)</option>
              <option value="Yape/Plin">Yape/Plin</option>
            </FormSelect>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-gradient-to-r from-red-500 to-red-400 text-white shadow-glow">Guardar Gasto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
