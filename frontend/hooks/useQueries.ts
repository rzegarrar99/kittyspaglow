import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, categoryService, brandService, unitService } from '../services/inventory.service';
import { areaService, supplierService, purchaseService } from '../services/operations.service';
import { orderService, movementService, cashRegisterService, kardexService } from '../services/finance.service';
import { staffService, roleService } from '../services/staff.service';
import { serviceService } from '../services/service.service';
import { clientService } from '../services/client.service';
import { Client, Service, Staff, Order, Movement, InventoryItem, Role, SimpleDictionary, Brand, Unit, Area, Supplier, Purchase, CashRegister, KardexEntry, PaymentDetail } from '../types';

export const useGenericMutation = <T extends { id: string }>(queryKey: string, service: any) => {
  const queryClient = useQueryClient();
  
  const addMutation = useMutation<T, Error, any>({
    mutationFn: (data: any) => service.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  const updateMutation = useMutation<void, Error, { id: string; updates: Partial<T> }>({
    mutationFn: ({ id, updates }) => service.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  return { addMutation, updateMutation, deleteMutation };
};

export const useCrud = <T extends { id: string }>(queryKey: string, service: any) => {
  const { data, isLoading: loading } = useQuery<T[]>({ queryKey: [queryKey], queryFn: service.getAll });
  const { addMutation, updateMutation, deleteMutation } = useGenericMutation<T>(queryKey, service);

  return {
    data: data || [],
    loading,
    addItem: addMutation.mutateAsync,
    updateItem: (id: string, updates: Partial<T>) => updateMutation.mutateAsync({ id, updates }),
    deleteItem: deleteMutation.mutateAsync,
  };
};

export const useCategories = () => useCrud<SimpleDictionary>('categories', categoryService);
export const useBrands = () => useCrud<Brand>('brands', brandService);
export const useUnits = () => useCrud<Unit>('units', unitService);
export const useAreas = () => useCrud<Area>('areas', areaService);
export const useSuppliers = () => useCrud<Supplier>('suppliers', supplierService);
export const usePurchases = () => useCrud<Purchase>('purchases', purchaseService);
export const useCashRegisters = () => useCrud<CashRegister>('cashRegisters', cashRegisterService);
export const useKardex = () => useCrud<KardexEntry>('kardex', kardexService);
export const useRoles = () => useCrud<Role>('roles', roleService);
export const useInventory = () => useCrud<InventoryItem>('inventory', inventoryService);

export const useServices = () => {
  const crud = useCrud<Service>('services', serviceService);
  return {
    services: crud.data,
    loading: crud.loading,
    addService: crud.addItem,
    updateService: crud.updateItem,
    deleteService: crud.deleteItem,
  };
};

export const useStaff = () => {
  const crud = useCrud<Staff>('staff', staffService);
  return {
    staff: crud.data,
    loading: crud.loading,
    addStaff: crud.addItem,
    updateStaff: crud.updateItem,
    deleteStaff: crud.deleteItem,
  };
};

export const useClients = () => {
  const crud = useCrud<Client>('clients', clientService);
  return {
    clients: crud.data,
    loading: crud.loading,
    addClient: crud.addItem,
    updateClient: crud.updateItem,
    deleteClient: crud.deleteItem,
  };
};

export const useOrders = () => {
  const ordersCrud = useCrud<Order>('orders', orderService);
  const movementsCrud = useCrud<Movement>('movements', movementService);
  
  const createOrder = async (orderData: Partial<Order>, items: any[], payments: PaymentDetail[]): Promise<Order> => {
    const newOrder: Omit<Order, 'id'> = {
      ...orderData,
      status: 'Completado',
      payments,
      created_at: new Date().toISOString(),
      items
    } as Omit<Order, 'id'>;

    const created = await ordersCrud.addItem(newOrder as any);
    
    for (const p of payments) {
      await movementsCrud.addItem({
        type: 'Ingreso',
        amount: p.amount,
        payment_method: p.method,
        description: `Venta POS - Orden #${created.id.slice(-4)}`,
        created_at: new Date().toISOString()
      } as any);
    }
    return created;
  };

  return {
    orders: ordersCrud.data,
    movements: movementsCrud.data,
    createOrder,
    addMovement: movementsCrud.addItem,
  };

};
