import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Spinner, Button, EmptyState, PageHeader, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Package, Calendar, User, DollarSign } from 'lucide-react';
import { useInventory, useKardex } from '../hooks/useQueries';
import { exportToCSV } from '../utils/exportUtils';
import { motion } from 'framer-motion';

export const KardexView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: inventory, loading: loadingInv } = useInventory();
  const { data: kardex, loading: loadingKardex } = useKardex();

  const [filterType, setFilterType] = useState<'Todos' | 'Ingreso' | 'Salida'>('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const item = inventory.find(i => i.id === id);
  
  const itemKardex = kardex
    .filter(k => k.item_id === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredKardex = itemKardex.filter(k => {
    if (filterType !== 'Todos' && k.type !== filterType) return false;
    if (startDate && new Date(k.date) < new Date(startDate)) return false;
    if (endDate && new Date(k.date) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const totalIngresos = filteredKardex.filter(k => k.type === 'Ingreso').reduce((sum, k) => sum + k.quantity, 0);
  const totalSalidas = filteredKardex.filter(k => k.type === 'Salida').reduce((sum, k) => sum + k.quantity, 0);
  const valorizacionActual = item ? item.stock * item.cost : 0;

  const handleExport = () => {
    const exportData = filteredKardex.map(k => ({
      Fecha: new Date(k.date).toLocaleString('es-PE'),
      Usuario: k.staff_name,
      Motivo: k.reason,
      Referencia: k.reference,
      Tipo: k.type,
      Cantidad: k.quantity,
      'Costo Unit.': k.unit_cost,
      'Costo Total': k.total_cost,
      'Saldo Físico': k.balance,
      'Valor Saldo': k.balance * k.unit_cost
    }));
    exportToCSV(`kardex_valorizado_${item?.name?.replace(/\s+/g, '_') || 'producto'}.csv`, exportData);
  };

  if (loadingInv || loadingKardex) return <Spinner />;

  if (!item) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/almacen')} className="mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al Almacén
        </Button>
        <EmptyState message="Producto no encontrado." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate('/almacen')} className="mb-2 -ml-4">
            <ArrowLeft className="w-4 h-4" /> Volver al Almacén
          </Button>
          <h1 className="text-3xl font-extrabold text-plum">Kardex Valorizado: {item.name}</h1>
          <p className="text-plum/60 font-bold mt-1">Historial detallado y auditoría de inventario.</p>
        </div>
        <Button onClick={handleExport} variant="secondary" className="shrink-0">
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      {/* KPIs del Kardex */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-50/80 border-green-100 flex items-center gap-4">
          <div className="bg-white/80 p-3 rounded-2xl border border-white shadow-sm text-green-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-green-800/60 uppercase tracking-widest">Ingresos</p>
            <h3 className="text-xl font-extrabold text-green-600">+{totalIngresos}</h3>
          </div>
        </Card>
        <Card className="bg-red-50/80 border-red-100 flex items-center gap-4">
          <div className="bg-white/80 p-3 rounded-2xl border border-white shadow-sm text-red-500">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-800/60 uppercase tracking-widest">Salidas</p>
            <h3 className="text-xl font-extrabold text-red-600">-{totalSalidas}</h3>
          </div>
        </Card>
        <Card className="bg-primary/5 border-primary/20 flex items-center gap-4">
          <div className="bg-white/80 p-3 rounded-2xl border border-white shadow-sm text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-plum/50 uppercase tracking-widest">Saldo Físico</p>
            <h3 className="text-xl font-extrabold text-primary">{item.stock} <span className="text-xs">{item.unit?.split(' ')[0] || 'und'}</span></h3>
          </div>
        </Card>
        <Card className="bg-accent/10 border-accent/30 flex items-center gap-4">
          <div className="bg-white/80 p-3 rounded-2xl border border-white shadow-sm text-yellow-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-yellow-800/60 uppercase tracking-widest">Valorización</p>
            <h3 className="text-xl font-extrabold text-yellow-700">S/. {valorizacionActual.toFixed(2)}</h3>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Filtros */}
        <div className="p-6 border-b border-white/50 bg-white/40 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-plum/60 uppercase tracking-wider mb-1 ml-1">Tipo de Movimiento</label>
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value as any)} 
              className="w-full px-4 py-2.5 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm"
            >
              <option value="Todos">Todos los movimientos</option>
              <option value="Ingreso">Solo Ingresos</option>
              <option value="Salida">Solo Salidas</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-plum/60 uppercase tracking-wider mb-1 ml-1">Desde</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-plum/40" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm" 
              />
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-plum/60 uppercase tracking-wider mb-1 ml-1">Hasta</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-plum/40" />
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm" 
              />
            </div>
          </div>
        </div>

        {filteredKardex.length === 0 ? (
          <EmptyState message="No hay movimientos para los filtros seleccionados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-plum/50 text-[10px] uppercase tracking-widest font-bold border-b border-pink-100 bg-white/50">
                  <th className="p-4 pl-6">Fecha</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Detalle (Motivo / Ref)</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 text-right">Cant.</th>
                  <th className="p-4 text-right">C. Unit.</th>
                  <th className="p-4 text-right">C. Total</th>
                  <th className="p-4 text-right">Saldo Físico</th>
                  <th className="p-4 text-right pr-6">Valor Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {filteredKardex.map((k, idx) => (
                  <Tr key={k.id} index={idx}>
                    <Td className="pl-6 text-xs font-semibold text-plum/80">
                      {new Date(k.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-xs font-bold text-plum">
                        <User className="w-3 h-3 text-primary/50" /> {k.staff_name}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-plum">{k.reason}</span>
                        <span className="text-[10px] font-semibold text-plum/50">{k.reference}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={k.type === 'Ingreso' ? 'pink' : 'gray'}>{k.type}</Badge>
                    </Td>
                    <Td className={`text-right font-extrabold text-sm ${k.type === 'Ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                      {k.type === 'Ingreso' ? '+' : '-'}{k.quantity}
                    </Td>
                    <Td className="text-right text-xs font-bold text-plum/70">S/. {k.unit_cost.toFixed(2)}</Td>
                    <Td className="text-right text-xs font-bold text-plum/70">S/. {k.total_cost.toFixed(2)}</Td>
                    <Td className="text-right font-black text-plum text-sm">{k.balance}</Td>
                    <Td className="pr-6 text-right font-black text-primary text-sm">S/. {(k.balance * k.unit_cost).toFixed(2)}</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
