import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useUIStore } from '../stores/uiStore';
import { motion } from 'framer-motion';

export const Layout: React.FC = () => {
  const { isSidebarOpen } = useUIStore();

  // 260px (Open Sidebar) + 16px (left-4) + 14px (gap) = 290px
  // 88px (Closed Sidebar) + 16px (left-4) + 14px (gap) = 118px
  const marginLeft = isSidebarOpen ? 290 : 118;

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      
      <motion.div 
        initial={false}
        animate={{ marginLeft }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-h-screen"
      >
        <Navbar />
        <main className="flex-1 px-8 pb-8 pt-2">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </motion.div>
    </div>
  );
};
