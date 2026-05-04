import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Spinner, Button, EmptyState, PageHeader, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Package, Calendar, User, DollarSign, ShoppingCart, Receipt, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useInventory, useKardex } from '../hooks/useQueries';
import { exportToCSV } from '../utils/exportUtils';
import { motion } from 'framer-motion';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

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

  const { paginated: paginatedKardex, currentPage, totalPages, setCurrentPage, total } = usePagination(filteredKardex, 15);

  const totalIngresos = filteredKardex.filter(k => k.type === 'Ingreso').reduce((sum, k) => sum + k.quantity, 0);
  const totalSalidas = filteredKardex.filter(k => k.type === 'Salida').reduce((sum, k) => sum + k.quantity, 0);
  const valorizacionActual = item ? item.stock * item.cost : 0;
  const rotationRatio = (totalSalidas / (item?.stock || 1)).toFixed(1);

  const handleExport = () => {
    const exportData = filteredKardex.map(k => ({
      ID_Operacion: k.id.slice(-8).toUpperCase(),
      Fecha: new Date(k.date).toLocaleString('es-PE'),
      Usuario: k.staff_name,
      Motivo: k.reason,
      Referencia: k.reference,
      Tipo: k.type,
      'Cant. Entrada': k.type === 'Ingreso' ? k.quantity : 0,
      'Cant. Salida': k.type === 'Salida' ? k.quantity : 0,
      'C.Unit.': k.unit_cost,
      'Total Entrada': k.type === 'Ingreso' ? k.total_cost : 0,
      'Total Salida': k.type === 'Salida' ? k.total_cost : 0,
      'Saldo Físico': k.balance,
      'Valor Stock': k.balance * k.unit_cost,
      Salud: k.balance === 0 ? 'AGOTADO' : k.balance <= 10 ? 'BAJO' : 'SUFICIENTE'
    }));
    exportToCSV(`kardex_valorizado_${item?.name?.replace(/\s+/g, '_') || 'producto'}.csv`, exportData);
  };

  // Helper para identificar el origen del movimiento
  const getSourceIcon = (reason: string) => {
    const r = reason.toLowerCase();
    if (r.includes('venta')) return <Receipt className="w-3 h-3 text-primary" />;
    if (r.includes('compra') || r.includes('proveedor')) return <ShoppingCart className="w-3 h-3 text-green-500" />;
    if (r.includes('inicial')) return <ShieldCheck className="w-3 h-3 text-accent" />;
    return <Package className="w-3 h-3 text-plum/40" />;
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
        <Card className="bg-orange-50/80 border-orange-100 flex items-center gap-4">
          <div className="bg-white/80 p-3 rounded-2xl border border-white shadow-sm text-orange-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-orange-800/60 uppercase tracking-widest">Rotación</p>
            <h3 className="text-xl font-extrabold text-orange-600">{rotationRatio}x</h3>
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

        {paginatedKardex.length === 0 && total === 0 ? (
          <EmptyState message="No hay movimientos para los filtros seleccionados." />
        ) : (
          <div className="overflow-x-auto bg-white/30">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="text-plum/50 text-[10px] uppercase tracking-widest font-bold bg-white/50">
                  <th className="p-4 pl-6 border-b border-pink-100" rowSpan={2}># Operación</th>
                  <th className="p-4 border-b border-pink-100" rowSpan={2}>Fecha / Hora</th>
                  <th className="p-4 border-b border-pink-100" rowSpan={2}>Usuario</th>
                  <th className="p-4 border-b border-pink-100" rowSpan={2}>Motivo / Documento</th>
                  <th className="p-4 border-b border-pink-100" rowSpan={2}>Tipo</th>
                  <th className="text-center text-[10px] font-black tracking-widest text-green-500 pb-1 border-b-2 border-green-200" colSpan={3}>ENTRADA</th>
                  <th className="text-center text-[10px] font-black tracking-widest text-red-400 pb-1 border-b-2 border-red-200" colSpan={3}>SALIDA</th>
                  <th className="text-center text-[10px] font-black tracking-widest text-primary pb-1 border-b-2 border-primary/40" colSpan={3}>EXISTENCIAS</th>
                  <th className="p-4 text-center border-b border-pink-100" rowSpan={2}>Salud Stock</th>
                </tr>
                <tr className="text-plum/50 text-[9px] uppercase tracking-widest font-bold border-b border-pink-100 bg-white/50">
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">Cant.</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">C. Unit.</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">Total</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">Cant.</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">C. Unit.</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">Total</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">Cant.</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">C. Unit.</th>
                  <th className="text-center text-[9px] font-bold tracking-widest text-plum/30 pt-1 pb-3">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {paginatedKardex.map((k, idx) => (
                  <Tr 
                    key={k.id} 
                    index={idx}
                    className="group border-b border-pink-50/80 hover:bg-white/70 transition-all duration-200"
                  >
                    <Td className="pl-6">
                      <span className="font-mono text-[10px] bg-pink-50 text-plum/40 px-2 py-1 rounded-lg border border-pink-100">
                        {k.id.slice(0, 8).toUpperCase()}
                      </span>
                    </Td>
                    <Td className="text-xs font-semibold text-plum/80">
                      {new Date(k.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-xs font-bold text-plum">
                        <User className="w-3 h-3 text-primary/50" /> {k.staff_name}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          {getSourceIcon(k.reason)}
                          <span className="text-xs font-bold text-plum">{k.reason}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-plum/50">{k.reference}</span>
                      </div>
                    </Td>
                    <Td className="text-center">
                      {k.type === 'Ingreso' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-green-50 text-green-600 border border-green-100">↑ INGRESO</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-red-50 text-red-400 border border-red-100">↓ SALIDA</span>
                      )}
                    </Td>
                    {/* ENTRADA */}
                    <Td className="text-center text-xs font-black text-green-500">
                      {k.type === 'Ingreso' ? `+${k.quantity}` : <span className="text-plum/20 text-xs select-none">—</span>}
                    </Td>
                    <Td className="text-center text-xs font-black text-green-500">
                      {k.type === 'Ingreso' ? `S/. ${k.unit_cost.toFixed(2)}` : <span className="text-plum/20 text-xs select-none">—</span>}
                    </Td>
                    <Td className="text-center text-xs font-black text-green-500">
                      {k.type === 'Ingreso' ? `S/. ${k.total_cost.toFixed(2)}` : <span className="text-plum/20 text-xs select-none">—</span>}
                    </Td>
                    {/* SALIDA */}
                    <Td className="text-center text-xs font-black text-red-400">
                      {k.type === 'Salida' ? `-${k.quantity}` : <span className="text-plum/20 text-xs select-none">—</span>}
                    </Td>
                    <Td className="text-center text-xs font-black text-red-400">
                      {k.type === 'Salida' ? `S/. ${k.unit_cost.toFixed(2)}` : <span className="text-plum/20 text-xs select-none">—</span>}
                    </Td>
                    <Td className="text-center text-xs font-black text-red-400">
                      {k.type === 'Salida' ? `S/. ${k.total_cost.toFixed(2)}` : <span className="text-plum/20 text-xs select-none">—</span>}
                    </Td>
                    {/* EXISTENCIAS */}
                    <Td className="text-center text-sm font-black text-plum">
                      {k.balance}
                    </Td>
                    <Td className="text-center text-xs font-bold text-primary">
                      S/. {k.unit_cost.toFixed(2)}
                    </Td>
                    <Td className="text-center text-xs font-bold text-primary">
                      S/. {(k.balance * k.unit_cost).toFixed(2)}
                    </Td>
                    <Td className="text-center">
                      {k.balance === 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-red-100 text-red-500 border border-red-200">
                          AGOTADO
                        </span>
                      ) : k.balance <= 10 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-orange-100 text-orange-700 border border-orange-200">
                          BAJO
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-green-100 text-green-700 border border-green-200">
                          SUFICIENTE
                        </span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Pagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />
    </div>
  );
};
