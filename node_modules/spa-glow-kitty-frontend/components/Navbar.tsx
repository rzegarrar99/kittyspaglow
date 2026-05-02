import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Navbar: React.FC = () => {
  const { user, logout, getHighestRole } = useAuthStore();
  const highestRole = getHighestRole();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greetingTime = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.name.split(' ')[0] || 'Administradora';

  const formattedDate = currentTime.toLocaleDateString('es-PE', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString('es-PE', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });

  return (
    <header className="h-24 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left side: Floating Greeting & Clock */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-black text-plum tracking-tight">{greetingTime}, {firstName} ✨</h2>
        <div className="flex items-center gap-2 text-plum/60 font-bold text-xs mt-1">
          <span className="capitalize">{formattedDate}</span>
          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full"></span>
          <span className="flex items-center gap-1 text-primary"><Clock className="w-3.5 h-3.5" /> {formattedTime}</span>
        </div>
      </div>

      {/* Right side: Floating User Profile Pill */}
      {user && (
        <div className="relative group cursor-pointer">
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border-2 border-white shadow-sm rounded-full pr-2 pl-4 py-1.5 hover:bg-white/90 transition-all">
            <div className="text-right hidden sm:block">
              <p className="font-black text-sm text-plum leading-tight">{user.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: highestRole?.color || '#FF2A7A' }}>
                {highestRole?.name || 'Sin Rol'}
              </p>
            </div>
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-10 h-10 rounded-full border-2 shadow-sm" 
              style={{ borderColor: highestRole?.color || '#FF2A7A' }} 
            />
          </div>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border-2 border-white rounded-2xl shadow-glass opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100">
            <div className="p-3 border-b border-pink-50 sm:hidden">
              <p className="font-black text-sm text-plum truncate">{user.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: highestRole?.color || '#FF2A7A' }}>
                {highestRole?.name || 'Sin Rol'}
              </p>
            </div>
            <div className="p-2">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-wide"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
