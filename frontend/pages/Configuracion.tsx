import React, { useState, useEffect } from 'react';
import { Card, Button, PageHeader, FormInput, FormSelect, Spinner } from '../components/UI';
import { Save, Store, ReceiptText, Database } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { categoryService, brandService, unitService } from '../services/inventory.service';
import { areaService } from '../services/operations.service';
import { motion } from 'framer-motion';
import { ConfirmModal } from '../components/shared/ConfirmModal';
import { runFullSeed } from '../lib/seedData';

export const Configuracion: React.FC = () => {
  const { addToast } = useToast();
  const { settings, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false);

  const [formData, setFormData] = useState({
    spaName: '',
    ruc: '',
    address: '',
    phone: '',
    taxRate: '',
    currency: ''
  });

  useEffect(() => {
    setFormData({
      spaName: settings.spaName,
      ruc: settings.ruc,
      address: settings.address,
      phone: settings.phone,
      taxRate: settings.taxRate.toString(),
      currency: settings.currency
    });
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      updateSettings({
        ...formData,
        taxRate: Number(formData.taxRate)
      });
      setIsSaving(false);
      addToast('Configuración guardada exitosamente 🎀', 'success');
    }, 800);
  };

  const handleSeedDatabase = () => {
    setConfirmSeedOpen(true);
  };

  const handleConfirmSeed = async () => {
    setIsSeeding(true);
    try {
      await runFullSeed();
      addToast('✅ ¡800 registros creados! 100 por cada colección. Recarga la página 🎀', 'success');
    } catch (error) {
      console.error('Error al poblar:', error);
      addToast('Error al poblar la base de datos.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <PageHeader 
        title="Configuración del Sistema" 
        subtitle="Ajusta los parámetros generales de tu negocio." 
      />

      <form onSubmit={handleSave} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h3 className="text-lg font-bold text-plum mb-6 flex items-center gap-2 border-b border-white/50 pb-4">
              <Store className="w-5 h-5 text-primary" /> Datos del Negocio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="Nombre Comercial" value={formData.spaName} onChange={e => setFormData({...formData, spaName: e.target.value})} />
              <FormInput label="RUC" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} />
              <FormInput className="md:col-span-2" label="Dirección Principal" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <FormInput label="Teléfono de Contacto" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <h3 className="text-lg font-bold text-plum mb-6 flex items-center gap-2 border-b border-white/50 pb-4">
              <ReceiptText className="w-5 h-5 text-accent" /> Facturación y Moneda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect label="Moneda Principal" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                <option value="PEN (S/.)">Soles (PEN)</option>
                <option value="USD ($)">Dólares (USD)</option>
              </FormSelect>
              <FormInput label="Impuesto (IGV %)" type="number" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} />
            </div>
          </Card>
        </motion.div>

        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={handleSeedDatabase} disabled={isSeeding} className="border-orange-300 text-orange-600 hover:bg-orange-50">
            {isSeeding ? <Spinner size="sm" /> : <><Database className="w-5 h-5" /> Poblar Base de Datos Inicial</>}
          </Button>

          <Button type="submit" disabled={isSaving} className="px-8 py-3 text-lg">
            {isSaving ? <Spinner size="sm" /> : <><Save className="w-5 h-5" /> Guardar Configuración</>}
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={confirmSeedOpen}
        onClose={() => setConfirmSeedOpen(false)}
        onConfirm={handleConfirmSeed}
        title="Inyectar datos de prueba"
        message="¿Estás segura de inyectar datos de prueba? Solo hazlo si tu base de datos está vacía."
        confirmText="Sí, inyectar"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
};
