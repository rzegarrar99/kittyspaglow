import React from 'react';
import { Card, Badge, EmptyState, PageHeader, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { ArrowRightLeft, TrendingUp, TrendingDown, Wallet, Banknote, CreditCard, Landmark } from 'lucide-react';
import { useOrders } from '../hooks/useQueries';
import { YapeIcon, PlinIcon } from '../components/PaymentIcons';

export const Movimientos: React.FC = () => {
  const { movements = [] } = useOrders();

  const totalIngresos = movements.filter(m => m.type === 'Ingreso').reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalEgresos = movements.filter(m => m.type === 'Egreso').reduce((sum, m) => sum + (m.amount || 0), 0);
  const balance = totalIngresos - totalEgresos;

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Efectivo': return <Banknote className="w-3 h-3" />;
      case 'Yape': return <YapeIcon className="w-3 h-3" />;
      case 'Plin': return <PlinIcon className="w-3 h-3" />;
      case 'Tarjeta': return <CreditCard className="w-3 h-3" />;
      case 'Transferencia': return <Landmark className="w-3 h-3" />;
      default: return <Wallet className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Movimientos de Caja" 
        subtitle="Historial completo de ingresos y egresos." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50/80 border-green-100 flex items-center gap-4">
          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm text-green-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-green-800/60 uppercase tracking-widest">Ingresos</p>
            <h3 className="text-2xl font-extrabold text-green-600">S/. {totalIngresos.toFixed(2)}</h3>
          </div>
        </Card>
        <Card className="bg-red-50/80 border-red-100 flex items-center gap-4">
          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm text-red-500">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-800/60 uppercase tracking-widest">Egresos</p>
            <h3 className="text-2xl font-extrabold text-red-600">S/. {totalEgresos.toFixed(2)}</h3>
          </div>
        </Card>
        <Card className="bg-primary/5 border-primary/20 flex items-center gap-4">
          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm text-primary">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Balance Actual</p>
            <h3 className="text-2xl font-extrabold text-primary">S/. {balance.toFixed(2)}</h3>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {movements.length === 0 ? (
          <EmptyState message="No hay movimientos registrados." />
        ) : (
          <Table>
            <Thead>
              <Th className="pl-6">Fecha</Th>
              <Th>Descripción</Th>
              <Th>Método</Th>
              <Th>Tipo</Th>
              <Th className="text-right pr-6">Monto</Th>
            </Thead>
            <Tbody>
              {movements.map((mov, idx) => (
                <Tr key={mov.id} index={idx}>
                  <Td className="pl-6 font-semibold text-plum/80">
                    {new Date(mov.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </Td>
                  <Td className="font-bold text-plum flex items-center gap-3">
                    <div className="bg-white/80 p-2 rounded-xl border border-white shadow-sm">
                      <ArrowRightLeft className="w-4 h-4 text-primary" />
                    </div>
                    {mov.description}
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1 text-xs font-bold text-plum/70 bg-white/50 px-2 py-1 rounded-lg border border-white w-max">
                      {getPaymentIcon(mov.payment_method)} {mov.payment_method}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={mov.type === 'Ingreso' ? 'pink' : 'red'}>{mov.type}</Badge>
                  </Td>
                  <Td className={`pr-6 text-right font-extrabold ${mov.type === 'Ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                    {mov.type === 'Ingreso' ? '+' : '-'} S/. {mov.amount.toFixed(2)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
