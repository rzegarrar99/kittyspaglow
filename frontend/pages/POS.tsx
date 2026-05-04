import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Button, Spinner, Modal, Badge, PageHeader, FormSelect } from '../components/UI';
import { ShoppingCart, User, Sparkles, Trash2, CheckCircle2, Printer, AlertTriangle, Package, MapPin, Wallet, Search, Banknote, CreditCard, Landmark, Plus, Minus, X, UserCheck, Star, Gift, Tag, Percent, ChevronDown, Filter, LayoutGrid, QrCode } from 'lucide-react';
import { useClients, useServices, useStaff, useOrders, useCashRegisters, useAreas, useInventory, useKardex } from '../hooks/useQueries'; // Asegúrate de que useStaff devuelva refetch
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuthStore } from '../stores/authStore';
import { Order, PaymentMethod, PaymentDetail, OrderItem, Client } from '../types';
import { printTicket } from '../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '../components/shared/ConfirmModal';

type CartItem = { 
  cartItemId: string; // ID único para esta línea en el carrito
  id: string; 
  name: string; 
  price: number; 
  type: 'service' | 'product'; 
  quantity: number; 
  discount?: number; 
  isGift?: boolean 
};

// 🚨 NOTA: Si hay un error en la línea de 'Yape/Plin' aquí,
// asegúrate de que tu archivo 'frontend/types.ts' esté actualizado
// y que tu compilador de TypeScript haya recargado los tipos.
// La definición de 'PaymentMethod' en 'types.ts' ya incluye 'Yape/Plin'.
const PAYMENT_METHODS: { id: PaymentMethod; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'Efectivo', icon: Banknote, color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200 hover:border-green-400' },
  { id: 'Yape/Plin', icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200 hover:border-purple-400' },
  { id: 'Tarjeta', icon: CreditCard, color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200 hover:border-blue-400' },
  { id: 'Transferencia', icon: Landmark, color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200 hover:border-orange-400' },
];

const QUICK_CASH = [10, 20, 50, 100, 200];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const POS: React.FC = () => {
  const { clients, loading: loadingClients } = useClients();
  const { services, loading: loadingServices } = useServices();
  const { data: inventory, updateItem: updateInventory } = useInventory();
  const { addItem: addKardex } = useKardex();
  const { data: areas } = useAreas();
  const { staff } = useStaff();
  const { createOrder } = useOrders();
  const { data: registers } = useCashRegisters();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const user = useAuthStore(state => state.user);

  const walkInClient = clients.find(c => c.id === 'WALK_IN') || { id: 'WALK_IN', name: 'Clienta de Paso', dni: '00000000', phone: '-', status: 'Activo', lastVisit: '', avatarUrl: '' } as Client;
  const [selectedClientObj, setSelectedClientObj] = useState<Client>(walkInClient);
  
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [searchService, setSearchService] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const debouncedSearchService = useDebounce(searchService, 300);
  const debouncedSearchProduct = useDebounce(searchProduct, 300);
  
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('Todos');
  const [selectedProductCategory, setSelectedProductCategory] = useState('Todos');

  const [isServiceCatOpen, setIsServiceCatOpen] = useState(false);
  const [isProductCatOpen, setIsProductCatOpen] = useState(false);
  const [catSearchService, setCatSearchService] = useState('');
  const [catSearchProduct, setCatSearchProduct] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmPayOpen, setIsConfirmPayOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [completedOrder, setCompletedOrder] = useState<{order: Order, clientName: string, staffName: string, items: CartItem[]} | null>(null);

  const total = cart.reduce((sum, item) => sum + (item.isGift ? 0 : (item.price * item.quantity) - (item.discount || 0)), 0);
  const activeRegister = registers.find(r => r.status === 'Abierta');

  const serviceCategories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);
  const productCategories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => i.category)))], [inventory]);

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      (selectedServiceCategory === 'Todos' || s.category === selectedServiceCategory) &&
      s.name.toLowerCase().includes(debouncedSearchService.toLowerCase())
    );
  }, [services, selectedServiceCategory, debouncedSearchService]);
  
  const filteredServiceCategories = useMemo(() => {
    return serviceCategories.filter(cat => cat.toLowerCase().includes(catSearchService.toLowerCase()));
  }, [serviceCategories, catSearchService]);

  const filteredProductCategories = useMemo(() => {
    return productCategories.filter(cat => cat.toLowerCase().includes(catSearchProduct.toLowerCase()));
  }, [productCategories, catSearchProduct]);

  const filteredProducts = useMemo(() => {
    return inventory.filter(i => 
      (selectedProductCategory === 'Todos' || i.category === selectedProductCategory) &&
      i.name.toLowerCase().includes(debouncedSearchProduct.toLowerCase())
    );
  }, [inventory, selectedProductCategory, debouncedSearchProduct]);

  const filteredClientsSearch = useMemo(() => {
    if (!clientSearchTerm) return [];
    return clients.filter(c => 
      c.id !== 'WALK_IN' && (
        c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        c.dni.includes(clientSearchTerm) ||
        c.phone.includes(clientSearchTerm)
      )
    ).slice(0, 5);
  }, [clients, clientSearchTerm]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const vuelto = Math.max(0, totalPaid - total);
  const hasCashPayment = payments.some(p => p.method === 'Efectivo');
  const canConfirmPayment = totalPaid >= total && (vuelto === 0 || hasCashPayment);

  useEffect(() => {
    if (clients.length > 0 && selectedClientObj.id === 'WALK_IN') {
      const walkIn = clients.find(c => c.id === 'WALK_IN');
      if (walkIn) setSelectedClientObj(walkIn);
    }
  }, [clients]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchingClient(false);
        setClientSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchingClient && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchingClient]);

  const handleAddToCart = (item: any, type: 'service' | 'product') => {
    // 🚀 Lógica Enterprise: Solo agrupamos si es un item "Limpio" (sin descuentos ni regalos)
    const existingIndex = cart.findIndex(c => 
      c.id === item.id && c.type === type && !c.isGift && (!c.discount || c.discount === 0)
    );
    if (existingIndex >= 0) {
      const invItem = inventory.find(i => i.id === item.id);
      if (type === 'product' && invItem && invItem.stock <= cart[existingIndex].quantity) {
        addToast('No hay suficiente stock en almacén.', 'error');
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const newItem: CartItem = { 
        cartItemId: crypto.randomUUID(), 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        type, 
        quantity: 1, 
        discount: 0, 
        isGift: false 
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }

    if (item.type === 'product' && delta > 0) {
      const invItem = inventory.find(i => i.id === item.id);
      if (invItem && invItem.stock < newQuantity) {
        addToast('No hay suficiente stock en almacén.', 'error');
        return;
      }
    }

    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  // 🎀 UX Senior: Splitting inteligente
  const handleToggleGift = (index: number) => {
    const newCart = [...cart];
    const item = { ...newCart[index] }; // Deep copy

    // Si hay más de uno, extraemos solo 1 para regalar y mantenemos el resto pagados
    if (item.quantity > 1 && !item.isGift) {
      // Reducimos la cantidad de la línea original
      newCart[index].quantity -= 1;

      // Creamos una nueva línea independiente como regalo
      const giftItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        type: item.type,
        cartItemId: crypto.randomUUID(),
        quantity: 1,
        isGift: true,
        discount: 0
      };
      setCart([...newCart, giftItem]); 
      addToast(`1 unidad de ${item.name} marcada como regalo.`, 'success');
    } else {
      // Si es solo 1, lo convertimos directamente
      newCart[index].isGift = !newCart[index].isGift;
      newCart[index].discount = 0;
      setCart(newCart);
    }
  };

  // 🎀 UX Senior: Aplicar descuento con separación de línea
  const handleApplyDiscount = (index: number, amount: number) => {
    const newCart = [...cart];
    const item = { ...newCart[index] };

    // Si tiene más de uno, separamos la unidad que recibe el descuento
    if (item.quantity > 1 && !item.isGift) {
      newCart[index].quantity -= 1;
      
      const discountedItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        type: item.type,
        cartItemId: crypto.randomUUID(),
        quantity: 1,
        discount: Math.min(amount, item.price * 1),
        isGift: false
      };
      setCart([...newCart, discountedItem]);
    } else {
      // Si solo hay uno, aplicamos directamente
      newCart[index].discount = Math.min(amount, item.price * item.quantity);
      if (newCart[index].discount > 0) newCart[index].isGift = false;
      setCart(newCart);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleInitiateCheckout = () => {
    if (!activeRegister) {
      addToast('Debes abrir una caja antes de procesar ventas.', 'error');
      return;
    }
    if (!selectedStaff || !selectedArea || cart.length === 0) {
      addToast('Faltan datos para completar la orden (Especialista o Área).', 'error');
      return;
    }
    setPayments([{ method: 'Efectivo', amount: total }]);
    setIsPaymentModalOpen(true);
  };

  const handleAddSpecificPayment = (method: PaymentMethod) => {
    const existingIndex = payments.findIndex(p => p.method === method);
    if (existingIndex >= 0) {
      const newPayments = [...payments];
      newPayments[existingIndex].amount += remaining;
      setPayments(newPayments);
    } else {
      setPayments([...payments, { method, amount: remaining }]);
    }
  };

  const handleUpdatePayment = (index: number, amount: number) => {
    const newPayments = [...payments];
    newPayments[index].amount = amount;
    setPayments(newPayments);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleQuickCash = (amount: number) => {
    const cashIndex = payments.findIndex(p => p.method === 'Efectivo');
    if (cashIndex >= 0) {
      handleUpdatePayment(cashIndex, amount);
    } else {
      setPayments([...payments, { method: 'Efectivo', amount }]);
    }
  };

  const confirmPayment = async () => {
    if (!canConfirmPayment) return;
    setIsPaymentModalOpen(false);
    setIsProcessing(true);
    
    let finalPayments = [...payments];
    if (vuelto > 0) {
      finalPayments = finalPayments.map(p => {
        if (p.method === 'Efectivo') return { ...p, amount: p.amount - vuelto };
        return p;
      });
    }
    finalPayments = finalPayments.filter(p => p.amount > 0);

    const order = await createOrder({
      client_id: selectedClientObj.id, staff_id: selectedStaff, area_id: selectedArea, total: total
    }, cart as any, finalPayments);
    
    const productsSold = cart.filter(c => c.type === 'product');
    
    // 🚀 Trazabilidad Enterprise: Agregamos stock total a restar por ID
    const totalReduction = productsSold.reduce((acc, item) => {
      acc[item.id] = (acc[item.id] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    for (const [prodId, totalQty] of Object.entries(totalReduction)) {
      const invItem = inventory.find(i => i.id === prodId);
      if (invItem) {
        const newStock = invItem.stock - totalQty;
        await updateInventory(invItem.id, { stock: newStock });
      }
    }

    // Registrar entradas en Kardex separadas por cada línea del carrito (Regalo vs Venta)
    for (const item of productsSold) {
      const invItem = inventory.find(i => i.id === item.id);
      if (invItem) {
        await addKardex({
          item_id: invItem.id, type: 'Salida', quantity: item.quantity, balance: invItem.stock - totalReduction[item.id],
          reason: item.isGift ? 'Regalo / Promoción' : `Venta POS`, reference: `Orden #${order.id.slice(-6)}`,
          unit_cost: invItem.cost, total_cost: item.quantity * invItem.cost,
          staff_name: user?.name || 'Sistema', date: new Date().toISOString()
        });
      }
    }

    setIsProcessing(false);
    addToast('¡Orden generada y pagada con éxito! 🎀', 'success');
    
    const staffName = staff.find(s => s.id === selectedStaff)?.name || 'Staff';
    
    setCompletedOrder({ order, clientName: selectedClientObj.name, staffName, items: [...cart] });
    
    setCart([]); 
    setSelectedClientObj(walkInClient);
    setSelectedStaff(''); 
    setSelectedArea('');
  };

  const handlePrint = () => {
    if (completedOrder) {
      printTicket(completedOrder.order, completedOrder.clientName, completedOrder.staffName, completedOrder.items, settings);
    }
  };

  if (loadingClients || loadingServices) return <Spinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Punto de Venta" 
        subtitle="Genera órdenes de servicio y cobra 🌸" 
        action={activeRegister && (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-primary px-5 py-2.5 rounded-full font-bold border border-white shadow-sm">
            <Wallet className="w-4 h-4" /> Caja Activa: {activeRegister.name}
          </div>
        )}
      />

      {!activeRegister && (
        <Card className="bg-red-50/80 border-red-100 flex items-center gap-4 py-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <p className="font-bold text-red-700">Atención: No hay ninguna caja abierta. Ve al módulo de Cajas para iniciar el turno.</p>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        {/* Fila 1: Datos de la Orden (Full Width) */}
        <Card className="relative z-20">
          <h3 className="text-lg font-bold text-plum mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Datos de la Orden
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1 relative" ref={searchContainerRef}>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-bold text-plum/60 ml-1 uppercase tracking-wider">Clienta</label>
                {selectedClientObj.id !== 'WALK_IN' && (
                  <button onClick={() => setSelectedClientObj(walkInClient)} className="text-[10px] font-black text-primary hover:text-plum flex items-center gap-1 transition-colors">
                    <UserCheck className="w-3 h-3" /> De Paso
                  </button>
                )}
              </div>
              {!isSearchingClient ? (
                <div 
                  onClick={() => setIsSearchingClient(true)}
                  className="w-full px-4 py-2.5 bg-white/80 border border-white rounded-2xl cursor-pointer hover:bg-white transition-all shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-secondary/20 p-1.5 rounded-xl shrink-0">
                      {selectedClientObj.id === 'WALK_IN' ? <UserCheck className="w-4 h-4 text-primary" /> : <Star className="w-4 h-4 text-accent" />}
                    </div>
                    <span className="font-bold text-plum text-sm truncate">{selectedClientObj.name}</span>
                  </div>
                  <Search className="w-4 h-4 text-plum/30 group-hover:text-primary transition-colors shrink-0" />
                </div>
              ) : (
                <div className="absolute top-6 left-0 right-0 z-50">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-primary" />
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Buscar nombre o DNI..." 
                      value={clientSearchTerm}
                      onChange={e => setClientSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-primary rounded-2xl focus:ring-0 text-plum font-bold shadow-lg"
                    />
                    <button onClick={() => { setIsSearchingClient(false); setClientSearchTerm(''); }} className="absolute right-3 top-3.5 text-plum/40 hover:text-plum">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-3xl border-2 border-white rounded-2xl shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                    {clientSearchTerm && filteredClientsSearch.map(client => (
                      <button 
                        key={client.id}
                        onClick={() => { setSelectedClientObj(client); setIsSearchingClient(false); setClientSearchTerm(''); }}
                        className="w-full p-3 border-b border-plum/5 hover:bg-secondary/20 transition-all flex items-center gap-3 text-left"
                      >
                        <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full border border-white shadow-sm" />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-plum text-sm truncate">{client.name}</p>
                          <p className="text-[10px] text-plum/50 font-semibold truncate">DNI: {client.dni} | {client.phone}</p>
                        </div>
                        {client.status === 'VIP' && <Star className="w-3 h-3 fill-accent text-accent shrink-0"/>}
                      </button>
                    ))}
                    {clientSearchTerm && filteredClientsSearch.length === 0 && (
                      <div className="p-4 text-center text-plum/50 font-bold text-sm">No se encontró a la clienta.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <FormSelect label="Especialista" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
              <option value="">Seleccionar...</option>
              {staff.map(s => {
                const mainRole = [...s.roles].sort((a, b) => b.priority - a.priority)[0]?.name || 'Sin rol';
                return <option key={s.id} value={s.id}>{s.name} - {mainRole}</option>;
              })}
            </FormSelect>
            <FormSelect label="Área / Sala" value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
              <option value="">Seleccionar...</option>
              {areas.filter(a => a.status === 'Disponible').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </FormSelect>
          </div>
        </Card>

        {/* Fila 2: Bento Grid Simétrico (3 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {/* Card de Servicios */}
          <Card className="flex flex-col h-[600px] !bg-white shadow-sm border-white">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-plum flex items-center gap-2">
                  <div className="bg-accent p-1.5 rounded-lg text-white shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div> 
                  Servicios
              </h3>
              </div>
              
              {/* 🚀 Selector de Categorías para Servicios */}
              <div className="relative mb-3 shrink-0">
                <button 
                  onClick={() => setIsServiceCatOpen(!isServiceCatOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-plum/5 rounded-xl shadow-sm hover:border-accent/30 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-plum">
                      {selectedServiceCategory === 'Todos' ? 'Todas las Categorías' : selectedServiceCategory}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-plum/30 transition-transform ${isServiceCatOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isServiceCatOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-plum/5 z-50 overflow-hidden"
                    >
                      <div className="p-2 border-b border-plum/5 bg-gray-50/50">
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-plum/30" />
                          <input 
                            type="text" 
                            placeholder="Filtrar categorías..." 
                            value={catSearchService}
                            onChange={(e) => setCatSearchService(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-[10px] font-bold bg-white border border-plum/10 rounded-lg focus:ring-0"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar min-h-0">
                        {filteredServiceCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => { setSelectedServiceCategory(cat); setIsServiceCatOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors ${selectedServiceCategory === cat ? 'bg-accent text-white shadow-sm' : 'hover:bg-accent/5 text-plum/60'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-plum/40" />
                <input type="text" placeholder="Buscar servicio..." value={searchService} onChange={e => setSearchService(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-plum/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm" />
              </div>
              
              {/* Lista de Servicios */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1.5 pb-4">
                  {filteredServices.map(service => (
                    <div 
                      key={service.id} 
                      onClick={() => handleAddToCart(service, 'service')} 
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white bg-white hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer group"
                    >
                      <div className="bg-accent/10 p-2 rounded-lg text-accent group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-plum text-xs truncate">{service.name}</p>
                        <p className="text-[10px] text-plum/40 font-bold uppercase tracking-wider">{service.duration} min</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-primary text-sm">S/. {service.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredServices.length === 0 && <p className="text-xs text-center text-plum/50 py-4">No se encontraron servicios.</p>}
              </div>
          </Card>

          <Card className="flex flex-col h-[600px] !bg-white shadow-sm border-white">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-plum flex items-center gap-2">
                  <div className="bg-primary p-1.5 rounded-lg text-white shadow-sm">
                    <Package className="w-4 h-4" />
                  </div> 
                  Productos
                </h3>
              </div>

              {/* 🚀 Selector de Categorías para Productos */}
              <div className="relative mb-3 shrink-0">
                <button 
                  onClick={() => setIsProductCatOpen(!isProductCatOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-plum/5 rounded-xl shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-plum">
                      {selectedProductCategory === 'Todos' ? 'Todas las Categorías' : selectedProductCategory}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-plum/30 transition-transform ${isProductCatOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isProductCatOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-plum/5 z-50 overflow-hidden"
                    >
                      <div className="p-2 border-b border-plum/5 bg-gray-50/50">
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-plum/30" />
                          <input 
                            type="text" 
                            placeholder="Filtrar categorías..." 
                            value={catSearchProduct}
                            onChange={(e) => setCatSearchProduct(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-[10px] font-bold bg-white border border-plum/10 rounded-lg focus:ring-0"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar min-h-0">
                        {filteredProductCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => { setSelectedProductCategory(cat); setIsProductCatOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors ${selectedProductCategory === cat ? 'bg-primary text-white shadow-sm' : 'hover:bg-primary/5 text-plum/60'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-plum/40" />
                <input type="text" placeholder="Buscar producto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-plum/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm" />
              </div>
              
              {/* 🚀 UX Senior: Lista de alta densidad para cientos de items */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1.5 pb-4">
                  {filteredProducts.map(item => {
                    const isOutOfStock = item.stock <= 0;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => !isOutOfStock && handleAddToCart(item, 'product')} 
                        className={`flex items-center gap-3 p-2.5 rounded-xl border border-white bg-white transition-all group ${
                          isOutOfStock ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-colors shrink-0 ${isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-plum text-xs truncate">{item.name}</p>
                          {isOutOfStock ? (
                            <span className="text-[9px] font-black text-red-500 uppercase">Sin Stock</span>
                          ) : (
                            <p className="text-[10px] text-plum/40 font-bold uppercase tracking-wider">Stock: {item.stock}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-plum text-sm">S/. {item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              {filteredProducts.length === 0 && <p className="text-xs text-center text-plum/50 py-4">No hay productos disponibles.</p>}
              </div>
          </Card>

          {/* Card de Resumen (Sincronizado) */}
          <Card className="flex flex-col h-[600px] !bg-white shadow-sm border-white">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/50 shrink-0">
              <h3 className="text-lg font-bold text-plum flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" /> Resumen
                <Badge variant="pink">{cart.length.toString()}</Badge>
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-white px-3 py-1 rounded-full border border-white shadow-sm">
                  Vaciar
                </button>
              )}
            </div>
            
            {/* Lista del Carrito */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {cart.length === 0 ? (
                <div className="text-center text-plum/40 font-bold py-8">No hay items en la orden.</div>
              ) : (
                <AnimatePresence>
                  {cart.map((item, idx) => (
                    <motion.div 
                      key={item.cartItemId} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, x: 20 }} 
                      className={`group relative flex flex-col gap-1.5 p-3 mb-2 rounded-2xl border transition-all ${
                        item.isGift ? 'bg-green-50/60 border-green-200' : 'bg-white/60 border-white/40 hover:bg-white/90 hover:shadow-sm'
                      }`}
                    >
                      {/* Primera Fila: Icono + Nombre + Precio */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 overflow-hidden">
                          <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${item.type === 'service' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                            {item.type === 'service' ? <Sparkles className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          </div>
                          <span className="font-bold text-xs text-plum leading-tight truncate-2-lines">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          {item.isGift ? (
                            <span className="text-[10px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-md">GRATIS</span>
                          ) : (
                            <div className="flex flex-col items-end">
                              {item.discount ? <span className="text-[9px] text-plum/30 line-through font-bold">S/. {(item.price * item.quantity).toFixed(2)}</span> : null}
                              <span className="text-xs font-black text-primary">S/. {((item.price * item.quantity) - (item.discount || 0)).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Segunda Fila: Qty + Promo + Acciones */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Qty Mini */}
                          <div className="flex items-center bg-white/50 rounded-lg p-0.5 border border-white/50">
                            <button onClick={() => handleUpdateQuantity(idx, -1)} className="w-5 h-5 flex items-center justify-center text-plum hover:text-primary transition-colors"><Minus className="w-2.5 h-2.5"/></button>
                            <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(idx, 1)} className="w-5 h-5 flex items-center justify-center text-plum hover:text-primary transition-colors"><Plus className="w-2.5 h-2.5"/></button>
                          </div>
                          <div className="h-3 w-[1px] bg-plum/10 mx-1" />
                          {/* Regalo Mini */}
                          <button 
                            onClick={() => handleToggleGift(idx)}
                            className={`p-1.5 rounded-lg transition-all ${item.isGift ? 'bg-green-500 text-white' : 'text-plum/30 hover:bg-green-100 hover:text-green-600'}`}
                            title="Marcar como regalo"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </button>
                          {/* Descuento Mini */}
                          {!item.isGift && (
                            <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-lg border border-white/50 focus-within:border-orange-200 group-hover:bg-white">
                              <Tag className="w-3 h-3 text-orange-400" />
                              <input 
                                type="number" 
                                value={item.discount || ''} 
                                onChange={(e) => handleApplyDiscount(idx, Number(e.target.value))}
                                className="w-10 bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 text-orange-600 placeholder:text-plum/20"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleRemoveFromCart(idx)} 
                          className="p-1.5 text-plum/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="pt-4 border-t border-white/50 mt-auto shrink-0">
              <div className="flex justify-between items-center mb-6">
                <span className="text-plum/60 font-bold uppercase tracking-wider text-xs">Total a Pagar</span>
                <span className="text-3xl font-extrabold text-plum">S/. {total.toFixed(2)}</span>
              </div>
              <Button className="w-full py-4 text-lg" disabled={cart.length === 0 || !selectedStaff || !selectedArea || isProcessing || !activeRegister} onClick={handleInitiateCheckout}>
                {isProcessing ? <Spinner size="sm" /> : <><CheckCircle2 className="w-6 h-6" /> Procesar Pago</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Pagos Divididos */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Procesar Pago" maxWidth="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white/60 p-6 rounded-3xl border border-white shadow-sm flex flex-col">
            <div className="text-center mb-6 pb-6 border-b border-dashed border-plum/20">
              <p className="text-xs font-bold text-plum/60 uppercase tracking-widest mb-1">Total a Cobrar</p>
              <p className="text-5xl font-black text-plum">S/. {total.toFixed(2)}</p>
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-plum/60 uppercase">Monto Recibido</span>
                <span className="text-xl font-black text-plum">S/. {totalPaid.toFixed(2)}</span>
              </div>
              {remaining > 0 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center text-red-500 bg-red-50 p-3 rounded-2xl border border-white shadow-sm">
                  <span className="text-sm font-bold uppercase">Faltante</span>
                  <span className="text-xl font-black">S/. {remaining.toFixed(2)}</span>
                </motion.div>
              )}
              {vuelto > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`flex justify-between items-center p-3 rounded-2xl border border-white shadow-sm ${hasCashPayment ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                  <span className="text-sm font-bold uppercase">Vuelto a entregar</span>
                  <span className="text-2xl font-black">S/. {vuelto.toFixed(2)}</span>
                </motion.div>
              )}
            </div>
            <Button className={`w-full mt-6 py-4 text-lg ${canConfirmPayment ? 'animate-pulse shadow-glow' : ''}`} disabled={!canConfirmPayment || isProcessing} onClick={() => {
              setIsPaymentModalOpen(false);
              setIsConfirmPayOpen(true);
            }}>
              {isProcessing ? <Spinner size="sm" /> : 'Confirmar Pago'}
            </Button>
          </div>
          
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h4 className="font-black text-plum uppercase text-xs tracking-widest mb-3">Añadir Método de Pago</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map(method => (
                  <button key={method.id} onClick={() => handleAddSpecificPayment(method.id)} className={`flex flex-col items-center justify-center gap-2 p-4 bg-white/80 border-2 hover:border-primary rounded-2xl shadow-sm hover:shadow-md transition-all group ${method.border}`}>
                    <div className={`p-3 rounded-full ${method.bg} group-hover:scale-110 transition-transform`}><method.icon className={`w-6 h-6 ${method.color}`} /></div>
                    <span className="font-black text-plum text-[10px] uppercase tracking-wide text-center leading-tight">{method.id}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-black text-plum uppercase text-xs tracking-widest mb-2">Pagos Registrados</h4>
              {payments.length === 0 ? (
                <div className="text-center py-8 bg-white/40 rounded-2xl border border-white border-dashed"><p className="text-plum/40 font-bold text-sm">Selecciona un método de pago arriba.</p></div>
              ) : (
                <AnimatePresence>
                  {payments.map((payment, idx) => {
                    const methodInfo = PAYMENT_METHODS.find(m => m.id === payment.method);
                    const Icon = methodInfo?.icon || Banknote;
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 bg-white/90 p-3 rounded-2xl border border-white shadow-sm">
                        <div className={`p-2 rounded-xl ${methodInfo?.bg || 'bg-gray-100'}`}><Icon className={`w-5 h-5 ${methodInfo?.color || 'text-gray-500'}`} /></div>
                        <span className="font-black text-plum text-sm uppercase flex-1">{payment.method}</span>
                        <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-plum/10 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                          <span className="text-plum/40 font-bold text-sm">S/.</span>
                          <input type="number" min="0" step="0.1" value={payment.amount === 0 ? '' : payment.amount} onChange={e => handleUpdatePayment(idx, Number(e.target.value))} className="w-24 bg-transparent border-none text-right font-black text-plum focus:ring-0 p-0 text-lg" placeholder="0.00" />
                        </div>
                        <button onClick={() => handleRemovePayment(idx)} className="p-2 text-plum/30 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><X className="w-5 h-5" /></button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {hasCashPayment && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-white/50">
                <h4 className="font-black text-plum uppercase text-xs tracking-widest mb-3">Billetes Rápidos (Efectivo)</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleQuickCash(remaining > 0 ? remaining : total)} className="px-4 py-2 bg-primary text-white rounded-xl font-black text-sm shadow-sm hover:-translate-y-0.5 transition-transform">Monto Exacto</button>
                  {QUICK_CASH.map(amount => (
                    <button key={amount} onClick={() => handleQuickCash(amount)} className="px-4 py-2 bg-white text-green-600 border border-green-200 rounded-xl font-black text-sm shadow-sm hover:bg-green-50 hover:-translate-y-0.5 transition-transform">S/. {amount}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!completedOrder} onClose={() => setCompletedOrder(null)} title="¡Pago Exitoso!">
        <div className="text-center space-y-6">
          <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-plum">S/. {completedOrder?.order.total.toFixed(2)}</h3>
            <p className="text-plum/60 font-bold mt-2 uppercase">Orden #{completedOrder?.order.id.slice(-6)} completada.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {completedOrder?.order.payments.map((p, i) => (
                <Badge key={i} variant="pink">{p.method}: S/. {p.amount.toFixed(2)}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <Button variant="outline" onClick={() => setCompletedOrder(null)}>Nueva Orden</Button>
            <Button onClick={handlePrint}><Printer className="w-5 h-5" /> Imprimir Ticket</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmPayOpen}
        onClose={() => {
          setIsConfirmPayOpen(false);
          setIsPaymentModalOpen(true);
        }}
        onConfirm={() => {
          setIsConfirmPayOpen(false);
          confirmPayment();
        }}
        title="Confirmar pago"
        message={`¿Confirmas el pago de S/. ${total.toFixed(2)}? Esta acción generará la orden y descontará el stock.`}
        confirmText="Sí, procesar"
        cancelText="Volver"
        isDestructive={false}
      />
    </div>
  );
};
