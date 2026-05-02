import React from 'react';
import { X, Search } from 'lucide-react';
import { KittyIcon } from './KittyIcon';
import { motion } from 'framer-motion';

// --- CONTENEDORES ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/70 backdrop-blur-xl rounded-4xl p-6 border border-white shadow-coquette ${className}`}>
      {children}
    </div>
  );
};

// --- BOTONES Y BADGES ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-6 py-3 rounded-full font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-[#FF5E99] text-white shadow-glow hover:shadow-lg",
    secondary: "bg-white text-primary border border-primary/20 hover:bg-primary/5 shadow-sm",
    outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-plum/60 hover:text-primary hover:bg-white/50"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'gold' | 'pink' | 'gray' | 'red' | 'purple' | 'blue' | 'orange' | 'green' }> = ({ children, variant = 'pink' }) => {
  const variants = {
    gold: "bg-accent/10 text-yellow-700 border border-accent/30",
    pink: "bg-primary/10 text-primary border border-primary/20",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    red: "bg-red-50 text-red-500 border border-red-200",
    purple: "bg-purple-50 text-purple-600 border border-purple-200",
    blue: "bg-blue-50 text-blue-600 border border-blue-200",
    orange: "bg-orange-50 text-orange-600 border border-orange-200",
    green: "bg-green-50 text-green-600 border border-green-200"
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- ESTADOS Y MODALES ---
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string }> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };
  
  const containerClasses = size === 'sm' ? 'p-0' : 'p-12';

  return (
    <div className={`flex justify-center items-center ${containerClasses} ${className}`}>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className={`${sizeClasses[size]} border-secondary/30 border-t-primary rounded-full`}
      />
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum/20 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className={`bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-glass w-full ${maxWidth} overflow-hidden border border-white max-h-[95vh] flex flex-col`}
      >
        <div className="px-6 py-5 border-b border-pink-100 flex justify-between items-center bg-white/50 shrink-0">
          <h2 className="text-xl font-extrabold text-plum flex items-center gap-3">
            <KittyIcon className="w-8 h-8" /> {title}
          </h2>
          <button onClick={onClose} className="p-2 text-plum/40 hover:text-primary hover:bg-primary/10 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const EmptyState: React.FC<{ message: string; action?: React.ReactNode }> = ({ message, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white/40 border border-white rounded-4xl">
    <KittyIcon isSleeping={true} className="w-28 h-28 mb-4 opacity-70" />
    <p className="text-plum/60 font-bold text-lg mb-4">{message}</p>
    {action && <div>{action}</div>}
  </div>
);

// --- COMPONENTES REUTILIZABLES (DRY) ---

export const PageHeader: React.FC<{ title: string; subtitle: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div className="flex items-center gap-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-full border border-white p-2 shadow-sm">
        <KittyIcon className="w-10 h-10" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-plum">{title}</h1>
        <p className="text-plum/60 font-bold mt-1">{subtitle}</p>
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const SearchBar: React.FC<{ value: string; onChange: (val: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = "Buscar..." }) => (
  <div className="relative flex-1 max-w-md">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-plum/40">
      <Search className="h-5 w-5" />
    </div>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full pl-11 pr-4 py-2.5 bg-white/80 border border-white rounded-full focus:ring-2 focus:ring-primary/20 transition-all text-plum font-bold placeholder-plum/40 shadow-sm"
    />
  </div>
);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-plum/60 mb-1 ml-1 uppercase tracking-wider">{label}</label>
    <input 
      className="w-full px-4 py-3 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 text-plum font-bold placeholder-plum/40 shadow-sm transition-all" 
      {...props} 
    />
  </div>
);

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, children, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-plum/60 mb-1 ml-1 uppercase tracking-wider">{label}</label>
    <select 
      className="w-full px-4 py-3 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 text-plum font-bold shadow-sm transition-all" 
      {...props}
    >
      {children}
    </select>
  </div>
);

// --- TABLAS REUTILIZABLES (DRY) ---

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">{children}</table>
  </div>
);

export const Thead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>
    <tr className="text-plum/50 text-xs uppercase tracking-widest font-bold border-b border-pink-100">
      {children}
    </tr>
  </thead>
);

export const Tbody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-pink-50">{children}</tbody>
);

export const Tr: React.FC<{ children: React.ReactNode; index?: number; className?: string }> = ({ children, index = 0, className = '' }) => (
  <motion.tr 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay: index * 0.05 }} 
    className={`hover:bg-white/40 transition-colors group ${className}`}
  >
    {children}
  </motion.tr>
);

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`p-4 ${className}`}>{children}</th>
);

export const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`p-4 ${className}`}>{children}</td>
);
