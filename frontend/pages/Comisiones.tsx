import React, { useMemo } from 'react';
import { Card, Badge, EmptyState } from '../components/UI';
import { Trophy, Percent, Download } from 'lucide-react';
import { useOrders, useStaff } from '../hooks/useQueries';
import { exportToCSV } from '../utils/exportUtils';
import { KittyIcon } from '../components/KittyIcon';
import { motion } from 'framer-motion';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/shared/Pagination';

export const Comisiones: React.FC = () => {
  const { orders } = useOrders();
  const { staff } = useStaff();

  const commissionsData = useMemo(() => {
    return staff.map(member => {
      const memberOrders = orders.filter(o => o.staff_id === member.id);
      const totalSales = memberOrders.reduce((sum, o) => sum + o.total, 0);
      const commission = totalSales * member.commission_rate;
      const mainRole = [...member.roles].sort((a, b) => b.priority - a.priority)[0]?.name || 'Sin rol';
      
      return {
        ...member,
        mainRole,
        totalSales,
        commission,
        orderCount: memberOrders.length
      };
    }).sort((a, b) => b.commission - a.commission);
  }, [orders, staff]);

  const { paginated: paginatedCommissions, currentPage, totalPages, setCurrentPage, total } = usePagination(commissionsData, 10);

  const topStaff = commissionsData.length > 0 && commissionsData[0].commission > 0 ? commissionsData[0] : null;

  const handleExport = () => {
    const exportData = commissionsData.map(s => ({
      Staff: s.name,
      Rol: s.mainRole,
      'Tasa Comisión': `${(s.commission_rate * 100).toFixed(0)}%`,
      'Ventas Totales': s.totalSales.toFixed(2),
      'Comisión a Pagar': s.commission.toFixed(2)
    }));
    exportToCSV('comisiones_mes_spaglowkitty.csv', exportData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-full border border-white p-2 shadow-sm">
            <KittyIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-plum">Cálculo de Comisiones</h1>
            <p className="text-plum/60 font-bold mt-1">Reporte de rendimiento del equipo.</p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-white rounded-full text-plum font-bold hover:bg-white hover:text-primary transition-all shadow-sm">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {topStaff && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="bg-gradient-to-r from-accent/10 to-white/50 border-accent/20 flex items-center gap-6">
            <div className="bg-white/80 p-4 rounded-full text-accent shadow-sm border border-white">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Top Esteticista del Mes</h2>
              <p className="text-2xl font-extrabold text-plum">{topStaff.name}</p>
              <p className="text-plum/70 font-bold mt-1">Generó S/. {topStaff.totalSales.toFixed(2)} en ventas.</p>
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="p-0 overflow-hidden">
        {total === 0 ? (
          <EmptyState message="No hay datos de staff registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-plum/50 text-xs uppercase tracking-widest font-bold border-b border-pink-100">
                  <th className="p-4 pl-6">Especialista</th>
                  <th className="p-4">Rol Principal</th>
                  <th className="p-4">Servicios Realizados</th>
                  <th className="p-4">Ventas Totales</th>
                  <th className="p-4">% Comisión</th>
                  <th className="p-4 text-right pr-6">Total a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {paginatedCommissions.map((s, idx) => (
                  <motion.tr 
                    key={s.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.1 }}
                    className="hover:bg-white/40 transition-colors group"
                  >
                    <td className="p-4 pl-6 font-bold text-plum">{s.name}</td>
                    <td className="p-4"><Badge variant="pink">{s.mainRole}</Badge></td>
                    <td className="p-4 font-semibold text-plum/80">{s.orderCount}</td>
                    <td className="p-4 font-semibold text-plum/80">S/. {s.totalSales.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-plum/60 font-bold">
                        <Percent className="w-3 h-3" /> {(s.commission_rate * 100).toFixed(0)}
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right font-extrabold text-primary text-lg">
                      S/. {s.commission.toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="p-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} total={total} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};
