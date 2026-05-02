import React from 'react';
import { Modal, Button } from '../UI';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center space-y-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-sm ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-accent/10 text-accent'}`}>
          <AlertTriangle className="w-10 h-10" />
        </div>
        <p className="text-plum/80 font-bold text-lg">{message}</p>
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="outline" onClick={onClose}>{cancelText}</Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={isDestructive ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
