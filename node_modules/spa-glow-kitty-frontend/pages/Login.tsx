import React, { useState } from 'react';
import { KittyIcon } from '../components/KittyIcon';
import { Button, Spinner } from '../components/UI';
import { Lock, User, UserPlus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 41.939 C -8.804 40.009 -11.514 38.989 -14.754 38.989 C -19.444 38.989 -23.494 41.689 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
    </g>
  </svg>
);

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithGoogle, registerAdmin } = useAuthStore();
  const { addToast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isRegistering) {
        const success = await registerAdmin(identifier, password);
        if (success) {
          addToast('¡Cuenta de Administradora creada con éxito! ✨', 'success');
        }
      } else {
        const success = await login(identifier, password);
        if (success) {
          addToast('¡Bienvenida al sistema! ✨', 'success');
        } else {
          addToast('Credenciales incorrectas.', 'error');
        }
      }
    } catch (error: any) {
      addToast(error.message || 'Ocurrió un error inesperado.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const result = await loginWithGoogle();
    setIsLoading(false);
    
    if (result.success) {
      addToast('¡Bienvenida al sistema! ✨', 'success');
    } else {
      addToast(`Error: ${result.error}`, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl"></div>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-10 rounded-[3rem] bg-white/60 backdrop-blur-2xl shadow-glass border border-white text-center"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 bg-white/80 rounded-full p-4 shadow-sm border border-white">
            <KittyIcon className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-black text-plum tracking-tight uppercase">
            Spa Glow <span className="text-primary">Kitty</span>
          </h1>
          <p className="text-plum/60 font-bold mt-2 text-xs tracking-widest uppercase">
            {isRegistering ? 'Crear Cuenta Inicial 🎀' : 'Acceso Administrativo'}
          </p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-plum/60 mb-1.5 ml-2 uppercase tracking-widest">
              {isRegistering ? 'Correo Electrónico' : 'Usuario o Correo'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/50">
                <User className="h-5 w-5" />
              </div>
              <input
                type={isRegistering ? "email" : "text"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-plum font-bold placeholder-plum/30 shadow-sm"
                placeholder={isRegistering ? "admin@spaglowkitty.pe" : "maria123 o maria@spa.pe"}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-plum/60 mb-1.5 ml-2 uppercase tracking-widest">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/50">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-plum font-bold placeholder-plum/30 shadow-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-3.5 text-base mt-6 shadow-glow">
            {isLoading ? <Spinner size="sm" /> : (isRegistering ? 'Crear Cuenta' : 'Ingresar')}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-white flex-1"></div>
          <span className="text-[10px] font-black text-plum/40 uppercase tracking-widest">O ingresa con</span>
          <div className="h-px bg-white flex-1"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white border border-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          <span className="font-black text-plum text-sm uppercase tracking-wider">Google</span>
        </button>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] font-black text-plum/50 hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
          >
            {isRegistering ? 'Ya tengo cuenta, iniciar sesión' : <><UserPlus className="w-3 h-3"/> Crear cuenta inicial (Solo primera vez)</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
