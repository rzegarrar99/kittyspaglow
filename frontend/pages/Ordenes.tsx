import React, { useState } from 'react';
import { Card, Badge, EmptyState, Modal, Button, PageHeader, SearchBar, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { ClipboardList, MapPin, Eye, Printer, Banknote, CreditCard, Landmark, QrCode } from 'lucide-react';
import { useOrders, useClients, useStaff, useAreas } from '../hooks/useQueries';
import { useSettings } from '../contexts/SettingsContext';
import { Order } from '../types';
import { printTicket } from '../utils/exportUtils';
import { YapeIcon, PlinIcon } from '../components/PaymentIcons';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

export const Ordenes: React.FC = () => {
  const { orders } = useOrders();
  const { clients } = useClients();
  const { staff } = useStaff();
  const { data: areas } = useAreas();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconocido';
  const getStaffName = (id: string) => staff.find(s => s.id === id)?.name || 'Desconocido';
  const getAreaName = (id?: string) => areas.find(a => a.id === id)?.name || 'No asignada';

  const filteredOrders = orders.filter(order => {
    const clientName = getClientName(order.client_id).toLowerCase();
    const orderId = order.id.toLowerCase();
    const search = searchTerm.toLowerCase();
    return clientName.includes(search) || orderId.includes(search);
  });

  const { paginated: paginatedOrders, currentPage, totalPages, setCurrentPage, total } = usePagination(filteredOrders, 10);

  const handlePrint = () => {
    if (viewingOrder) {
      printTicket(
        viewingOrder, 
        getClientName(viewingOrder.client_id), 
        getStaffName(viewingOrder.staff_id), 
        viewingOrder.items || [], 
        settings
      );
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Efectivo': return <Banknote className="w-3 h-3" />;
      case 'Yape/Plin':
      case 'Yape':
      case 'Plin': return <QrCode className="w-3 h-3 text-primary" />;
      case 'Tarjeta': return <CreditCard className="w-3 h-3" />;
      case 'Transferencia': return <Landmark className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Órdenes de Servicio" 
        subtitle="Historial de atenciones y ventas realizadas." 
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/50 flex items-center gap-4 bg-white/40">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por clienta o ID de orden..." />
        </div>

        {paginatedOrders.length === 0 && total === 0 ? (
          <EmptyState message="No se encontraron órdenes." />
        ) : (
          <Table>
            <Thead>
              <Th className="pl-6">ID Orden</Th>
              <Th>Fecha</Th>
              <Th>Clienta</Th>
              <Th>Especialista</Th>
              <Th>Pago</Th>
              <Th>Total</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {paginatedOrders.map((order, idx) => (
                <Tr key={order.id} index={idx}>
                  <Td className="pl-6 font-bold text-plum/70">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                        <ClipboardList className="w-4 h-4 text-primary" />
                      </div>
                      #{order.id.slice(-6)}
                    </div>
                  </Td>
                  <Td className="font-semibold text-plum/80">
                    {new Date(order.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </Td>
                  <Td className="font-bold text-plum">{getClientName(order.client_id)}</Td>
                  <Td className="font-semibold text-plum/80">{getStaffName(order.staff_id)}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      {order.payments.map((p, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] font-bold text-plum/70 bg-white/50 px-2 py-0.5 rounded-lg border border-white w-max">
                          {getPaymentIcon(p.method)} {p.method}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td className="font-extrabold text-primary">S/. {order.total.toFixed(2)}</Td>
                  <Td className="pr-6 text-right">
                    <button onClick={() => setViewingOrder(order)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all">
                      <Eye className="w-5 h-5" />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
      <Pagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />

      <Modal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} title={`Detalles de Orden #${viewingOrder?.id.slice(-6)}`}>
        {viewingOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-plum/50 font-bold uppercase tracking-wider text-xs">Clienta</p>
                <p className="font-extrabold text-plum">{getClientName(viewingOrder.client_id)}</p>
              </div>
              <div>
                <p className="text-plum/50 font-bold uppercase tracking-wider text-xs">Especialista</p>
                <p className="font-extrabold text-plum">{getStaffName(viewingOrder.staff_id)}</p>
              </div>
              <div>
                <p className="text-plum/50 font-bold uppercase tracking-wider text-xs">Fecha</p>
                <p className="font-bold text-plum">{new Date(viewingOrder.created_at).toLocaleString('es-PE')}</p>
              </div>
              <div>
                <p className="text-plum/50 font-bold uppercase tracking-wider text-xs">Área</p>
                <p className="font-bold text-plum">{getAreaName(viewingOrder.area_id)}</p>
              </div>
            </div>

            <div className="border-t border-pink-100 pt-4">
              <h4 className="font-bold text-plum mb-3">Servicios y Productos</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {viewingOrder.items && viewingOrder.items.length > 0 ? (
                  viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white/80 border border-white rounded-xl shadow-sm">
                      <span className="font-bold text-sm text-plum">{item.quantity}x {item.name}</span>
                      <span className="text-sm text-primary font-extrabold">S/. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-plum/50 italic">No hay detalles de items para esta orden antigua.</p>
                )}
              </div>
            </div>

            <div className="border-t border-pink-100 pt-4 flex justify-between items-start">
              <div>
                <span className="text-plum/60 font-bold uppercase tracking-wider text-xs block mb-2">Métodos de Pago</span>
                <div className="space-y-1">
                  {viewingOrder.payments.map((p, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs font-bold text-plum/70">
                      {getPaymentIcon(p.method)} {p.method}: S/. {p.amount.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-plum/60 font-bold uppercase tracking-wider text-xs block mb-1">Total Pagado</span>
                <span className="text-2xl font-extrabold text-plum">S/. {viewingOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingOrder(null)}>Cerrar</Button>
              <Button onClick={handlePrint}><Printer className="w-5 h-5" /> Imprimir Ticket</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
