import React, { useMemo } from 'react';
import { Card, Spinner, EmptyState, PageHeader, Button } from '../components/UI';
import { TrendingUp, PieChart as PieChartIcon, Clock, Download } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useOrders, useClients } from '../hooks/useQueries';
import { exportToCSV } from '../utils/exportUtils';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-coquette border border-primary/20">
        <p className="text-plum font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color || '#E91E8C' }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name.includes('Ventas') ? `S/. ${entry.value.toFixed(2)}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Reportes: React.FC = () => {
  const { orders } = useOrders();
  const { clients, loading: loadingClients } = useClients();

  const salesData = useMemo(() => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTotal = orders
        .filter(o => o.created_at.startsWith(date))
        .reduce((sum, o) => sum + o.total, 0);
      return {
        name: new Date(date).toLocaleDateString('es-PE', { weekday: 'short' }),
        Ventas: dayTotal
      };
    });
  }, [orders]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        counts[item.category || 'Otros'] = (counts[item.category || 'Otros'] || 0) + (item.price * item.quantity);
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const COLORS = ['#FF2A7A', '#FFB6C1', '#D4AF37', '#9b59b6'];

  const peakHoursData = useMemo(() => {
    const hours = Array.from({length: 12}, (_, i) => i + 9);
    const data = hours.map(h => ({ name: `${h}:00`, Clientes: 0 }));
    
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      const slot = data.find(d => d.name === `${hour}:00`);
      if (slot) slot.Clientes += 1;
    });
    return data;
  }, [orders]);

  const handleExport = () => {
    const exportData = orders.map(o => ({
      ID: o.id,
      Fecha: new Date(o.created_at).toLocaleString('es-PE'),
      Total: o.total,
      Estado: o.status
    }));
    exportToCSV('reporte_ventas_spaglowkitty.csv', exportData);
  };

  if (loadingClients) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inteligencia de Negocio" 
        subtitle="Analiza el rendimiento de tu spa." 
        action={<Button onClick={handleExport} variant="secondary"><Download className="w-4 h-4" /> Exportar CSV</Button>} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-plum mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Evolución de Ventas (Últimos 7 días)
            </h3>
            {orders.length === 0 ? <EmptyState message="Aún no hay datos para este periodo ✨" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFF0F7" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#2D1B2E', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#2D1B2E', fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Ventas" stroke="#D4AF37" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-plum mb-6 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-secondary" /> Ingresos por Categoría
            </h3>
            {categoryData.length === 0 ? <EmptyState message="Aún no hay datos para este periodo ✨" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {categoryData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-bold text-plum">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-bold text-plum mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Horas Pico de Atención
            </h3>
            {orders.length === 0 ? <EmptyState message="Aún no hay datos para este periodo ✨" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFF0F7" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#2D1B2E', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#2D1B2E', fontWeight: 600 }} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#FFF0F7'}} content={<CustomTooltip />} />
                    <Bar dataKey="Clientes" fill="#FFB6C1" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
