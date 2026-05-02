import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Button, Spinner, Modal, Badge, PageHeader, FormSelect } from '../components/UI';
import { ShoppingCart, User, Sparkles, Trash2, CheckCircle2, Printer, AlertTriangle, Package, MapPin, Wallet, Search, Banknote, CreditCard, Landmark, Plus, Minus, X, UserCheck, Star } from 'lucide-react';
import { useClients, useServices, useStaff, useOrders, useCashRegisters, useAreas, useInventory, useKardex } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuthStore } from '../stores/authStore';
import { Order, PaymentMethod, PaymentDetail, OrderItem, Client } from '../types';
import { printTicket } from '../utils/exportUtils';
import { YapeIcon, PlinIcon } from '../components/PaymentIcons';
import { motion, AnimatePresence } from 'framer-motion';

type CartItem = { id: string; name: string; price: number; type: 'service' | 'product'; quantity: number };

const PAYMENT_METHODS: { id: PaymentMethod; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'Efectivo', icon: Banknote, color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200 hover:border-green-400' },
  { id: 'Yape', icon: YapeIcon, color: 'text-[#742284]', bg: 'bg-[#742284]/10', border: 'border-[#742284]/20 hover:border-[#742284]' },
  { id: 'Plin', icon: PlinIcon, color: 'text-[#00D8D6]', bg: 'bg-[#00D8D6]/10', border: 'border-[#00D8D6]/20 hover:border-[#00D8D6]' },
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

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [completedOrder, setCompletedOrder] = useState<{order: Order, clientName: string, staffName: string, items: CartItem[]} | null>(null);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeRegister = registers.find(r => r.status === 'Abierta');

  const serviceCategories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);
  const productCategories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => i.category)))], [inventory]);

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      (selectedServiceCategory === 'Todos' || s.category === selectedServiceCategory) &&
      s.name.toLowerCase().includes(debouncedSearchService.toLowerCase())
    );
  }, [services, selectedServiceCategory, debouncedSearchService]);
  
  const filteredProducts = useMemo(() => {
    return inventory.filter(i => 
      i.stock > 0 && 
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
    const existingIndex = cart.findIndex(c => c.id === item.id && c.type === type);
    if (existingIndex >= 0) {
      if (type === 'product') {
        const invItem = inventory.find(i => i.id === item.id);
        if (invItem && invItem.stock <= cart[existingIndex].quantity) {
          addToast('No hay suficiente stock en almacén.', 'error');
          return;
        }
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, type, quantity: 1 }]);
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
    const productCounts = productsSold.reduce((acc, prod) => {
      acc[prod.id] = (acc[prod.id] || 0) + prod.quantity;
      return acc;
    }, {} as Record<string, number>);

    for (const [prodId, qty] of Object.entries(productCounts)) {
      const invItem = inventory.find(i => i.id === prodId);
      if (invItem) {
        const newStock = invItem.stock - qty;
        await updateInventory(invItem.id, { stock: newStock });
        await addKardex({
          item_id: invItem.id, type: 'Salida', quantity: qty, balance: newStock,
          reason: `Venta POS`, reference: `Orden #${order.id.slice(-6)}`,
          unit_cost: invItem.cost, total_cost: qty * invItem.cost,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                        <div className="p-4 text-center text-plum/50 font-bold text-sm">
                          No se encontró a la clienta.
                        </div>
                      )}
                      {!clientSearchTerm && (
                        <div className="p-4 text-center text-plum/40 font-bold text-xs uppercase tracking-wider">
                          Escribe para buscar...
                        </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <Card className="flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-plum flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" /> Servicios
                </h3>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide shrink-0">
                {serviceCategories.map(cat => (
                  <button key={cat} onClick={() => setSelectedServiceCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedServiceCategory === cat ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white/50 text-plum/60 border-white hover:border-primary/30'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-plum/40" />
                <input type="text" placeholder="Buscar servicio..." value={searchService} onChange={e => setSearchService(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white/50 border border-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm" />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {filteredServices.map(service => (
                    <div key={service.id} onClick={() => handleAddToCart(service, 'service')} className="p-3 rounded-2xl border border-white bg-white/50 hover:bg-white cursor-pointer transition-all shadow-sm hover:shadow-md flex flex-col justify-between group">
                      <p className="font-bold text-plum text-sm leading-tight mb-1">{service.name}</p>
                      <div className="flex justify-between items-end w-full">
                        <span className="text-[10px] text-plum/50 font-bold bg-white px-2 py-0.5 rounded-md border border-white">{service.duration} min</span>
                        <span className="font-black text-primary text-sm">S/. {service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredServices.length === 0 && <p className="text-xs text-center text-plum/50 py-4">No se encontraron servicios.</p>}
              </div>
            </Card>

            <Card className="flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-plum flex items-center gap-2">
                  <Package className="w-5 h-5 text-secondary" /> Productos
                </h3>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide shrink-0">
                {productCategories.map(cat => (
                  <button key={cat} onClick={() => setSelectedProductCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedProductCategory === cat ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-white/50 text-plum/60 border-white hover:border-secondary/30'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-plum/40" />
                <input type="text" placeholder="Buscar producto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white/50 border border-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm" />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {filteredProducts.map(item => {
                    const isOutOfStock = item.stock <= 0;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => !isOutOfStock && handleAddToCart(item, 'product')} 
                        className={`p-3 rounded-2xl border border-white bg-white/50 transition-all shadow-sm flex flex-col justify-between group ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-white hover:-translate-y-0.5 hover:shadow-md cursor-pointer'}`}
                      >
                        <p className="font-bold text-plum text-sm leading-tight mb-1">{item.name}</p>
                        <div className="flex justify-between items-end w-full">
                          {isOutOfStock ? (
                            <Badge variant="red">Agotado</Badge>
                          ) : (
                            <span className="text-[10px] text-plum/50 font-bold bg-white px-2 py-0.5 rounded-md border border-white">Stock: {item.stock}</span>
                          )}
                          <span className="font-black text-plum text-sm">S/. {item.price}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredProducts.length === 0 && <p className="text-xs text-center text-plum/50 py-4">No hay productos disponibles.</p>}
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1 relative z-10">
          <Card className="sticky top-24 flex flex-col h-[calc(100vh-8rem)] bg-white/40">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/50 shrink-0">
              <h3 className="text-lg font-bold text-plum flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" /> Resumen
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-white px-3 py-1 rounded-full border border-white shadow-sm">
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
              {cart.length === 0 ? (
                <div className="text-center text-plum/40 font-bold py-8">No hay items en la orden.</div>
              ) : (
                <AnimatePresence>
                  {cart.map((item, idx) => (
                    <motion.div key={`${item.id}-${item.type}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col gap-2 p-3 bg-white/80 border border-white rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-plum flex items-center gap-1 leading-tight">
                          {item.type === 'service' ? <Sparkles className="w-3 h-3 text-accent shrink-0" /> : <Package className="w-3 h-3 text-primary shrink-0" />}
                          {item.name}
                        </p>
                        <button onClick={() => handleRemoveFromCart(idx)} className="p-1 text-plum/30 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2 bg-white/50 rounded-lg p-1 border border-white">
                          <button onClick={() => handleUpdateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-plum font-bold hover:bg-primary hover:text-white transition-colors shadow-sm"><Minus className="w-3 h-3"/></button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-plum font-bold hover:bg-primary hover:text-white transition-colors shadow-sm"><Plus className="w-3 h-3"/></button>
                        </div>
                        <p className="text-sm text-primary font-extrabold">S/. {(item.price * item.quantity).toFixed(2)}</p>
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
            <Button className={`w-full mt-6 py-4 text-lg ${canConfirmPayment ? 'animate-pulse shadow-glow' : ''}`} disabled={!canConfirmPayment || isProcessing} onClick={confirmPayment}>
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
    </div>
  );
};
