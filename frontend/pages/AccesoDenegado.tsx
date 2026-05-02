import React from 'react';
import { Card, Button } from '../components/UI';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AccesoDenegado: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[80vh] flex items-center justify-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card className="text-center max-w-md w-full py-12 border-red-100 shadow-[0_8px_30px_rgb(220,38,38,0.1)]">
          <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-plum mb-2">Acceso Denegado 🎀</h2>
          <p className="text-plum/60 font-semibold mb-8">
            Lo sentimos, tu rol actual no tiene los permisos necesarios para ver esta sección del spa.
          </p>
          <Button onClick={() => navigate('/')} className="mx-auto">
            <ArrowLeft className="w-5 h-5" /> Volver al Inicio
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};
