import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Modal, EmptyState, PageHeader, SearchBar, FormInput, Table, Thead, Tbody, Tr, Th, Td } from '../components/UI';
import { Plus, Trash2, Phone, Mail, Star, Edit } from 'lucide-react';
import { useClients, useOrders } from '../hooks/useQueries';
import { useToast } from '../contexts/ToastContext';
import { Client } from '../types';
import { motion } from 'framer-motion';

export const Clientes: React.FC = () => {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const { orders } = useOrders();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({ name: '', dni: '', phone: '', email: '', status: 'Activo' as const });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.dni.includes(searchTerm)
  );

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        dni: client.dni,
        phone: client.phone,
        email: client.email || '',
        status: client.status
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', dni: '', phone: '', email: '', status: 'Activo' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await updateClient(editingClient.id, formData);
      addToast('¡Clienta actualizada con éxito! 🎀', 'success');
    } else {
      await addClient(formData);
      addToast('¡Clienta guardada con éxito! 🎀', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás segura de eliminar a esta clienta?')) {
      await deleteClient(id);
      addToast('Clienta eliminada.', 'success');
    }
  };

  const getClientCRMData = (clientId: string, defaultLastVisit: string) => {
    const clientOrders = orders.filter(o => o.client_id === clientId);
    const totalSpent = clientOrders.reduce((sum, o) => sum + o.total, 0);
    const isVip = totalSpent >= 500;
    
    let lastVisit = defaultLastVisit;
    if (clientOrders.length > 0) {
      clientOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      lastVisit = clientOrders[0].created_at;
    }

    return { isVip, lastVisit, totalSpent };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Directorio de Clientes" 
        subtitle="CRM Inteligente: El estado VIP se calcula automáticamente." 
        action={<Button onClick={() => openModal()}><Plus className="w-5 h-5" /> Nueva Clienta</Button>} 
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/50 flex items-center gap-4 bg-white/40">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por nombre o DNI..." />
        </div>

        {loading ? (
          <Spinner />
        ) : filteredClients.length === 0 ? (
          <EmptyState message="No se encontraron clientas." />
        ) : (
          <Table>
            <Thead>
              <Th className="pl-6">Clienta</Th>
              <Th>DNI</Th>
              <Th>Contacto</Th>
              <Th>Estado</Th>
              <Th>Última Visita</Th>
              <Th>Total Gastado</Th>
              <Th className="text-right pr-6">Acciones</Th>
            </Thead>
            <Tbody>
              {filteredClients.map((client, idx) => {
                const crmData = getClientCRMData(client.id, client.lastVisit);
                
                return (
                  <Tr key={client.id} index={idx}>
                    <Td className="pl-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src={client.avatarUrl} 
                          alt={client.name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <span className="font-bold text-plum">{client.name}</span>
                      </div>
                    </Td>
                    <Td className="font-semibold text-plum/80">{client.dni}</Td>
                    <Td>
                      <div className="flex flex-col gap-1 text-sm text-plum/80 font-semibold">
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-primary/60" /> {client.phone}</div>
                        {client.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-accent/60" /> {client.email}</div>}
                      </div>
                    </Td>
                    <Td>
                      {crmData.isVip ? (
                        <Badge variant="gold"><span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent" /> VIP</span></Badge>
                      ) : (
                        <Badge variant="pink">Activo</Badge>
                      )}
                    </Td>
                    <Td className="font-semibold text-plum/70">
                      {new Date(crmData.lastVisit).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Td>
                    <Td className="font-extrabold text-primary">
                      S/. {crmData.totalSpent.toFixed(2)}
                    </Td>
                    <Td className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(client)} className="p-2 text-plum/40 hover:text-primary hover:bg-white rounded-full transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-full transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Clienta" : "Nueva Clienta"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Nombre Completo" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Valeria Rojas" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="DNI" required maxLength={8} value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} placeholder="8 dígitos" />
            <FormInput label="Teléfono" required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+51..." />
          </div>
          <FormInput label="Correo Electrónico (Opcional)" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@ejemplo.com" />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingClient ? "Actualizar" : "Guardar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
