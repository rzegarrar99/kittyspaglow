import React from 'react';
import { motion } from 'framer-motion';

interface KittyIconProps {
  className?: string;
  isSleeping?: boolean;
}

export const KittyIcon: React.FC<KittyIconProps> = ({ className = "w-24 h-24", isSleeping = false }) => {
  return (
    <motion.svg 
      viewBox="0 0 120 100" 
      className={className}
      initial={{ y: 0 }}
      animate={{ y: [-5, 5, -5] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Ear */}
      <path d="M 25 45 L 15 15 L 45 25 Z" fill="white" stroke="#2D1B2E" strokeWidth="4" strokeLinejoin="round"/>
      {/* Right Ear */}
      <path d="M 95 45 L 105 15 L 75 25 Z" fill="white" stroke="#2D1B2E" strokeWidth="4" strokeLinejoin="round"/>
      
      {/* Head Base */}
      <ellipse cx="60" cy="60" rx="50" ry="38" fill="white" stroke="#2D1B2E" strokeWidth="4"/>
      
      {/* Eyes */}
      {isSleeping ? (
        <>
          <path d="M 30 60 Q 35 65 40 60" fill="none" stroke="#2D1B2E" strokeWidth="4" strokeLinecap="round"/>
          <path d="M 80 60 Q 85 65 90 60" fill="none" stroke="#2D1B2E" strokeWidth="4" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <ellipse cx="35" cy="60" rx="4.5" ry="7" fill="#2D1B2E"/>
          <ellipse cx="85" cy="60" rx="4.5" ry="7" fill="#2D1B2E"/>
        </>
      )}
      
      {/* Nose */}
      <ellipse cx="60" cy="70" rx="6" ry="4" fill="#FFD700" stroke="#2D1B2E" strokeWidth="3"/>
      
      {/* Whiskers Left */}
      <line x1="10" y1="55" x2="25" y2="60" stroke="#2D1B2E" strokeWidth="3" strokeLinecap="round"/>
      <line x1="5" y1="65" x2="25" y2="65" stroke="#2D1B2E" strokeWidth="3" strokeLinecap="round"/>
      <line x1="10" y1="75" x2="25" y2="70" stroke="#2D1B2E" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Whiskers Right */}
      <line x1="110" y1="55" x2="95" y2="60" stroke="#2D1B2E" strokeWidth="3" strokeLinecap="round"/>
      <line x1="115" y1="65" x2="95" y2="65" stroke="#2D1B2E" strokeWidth="3" strokeLinecap="round"/>
      <line x1="110" y1="75" x2="95" y2="70" stroke="#2D1B2E" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Iconic Bow (Right Ear) */}
      <g transform="translate(80, 25) rotate(15)">
        <path d="M 0 0 L 20 -15 A 8 8 0 0 1 25 0 A 8 8 0 0 1 20 15 Z" fill="#FF2A7A" stroke="#2D1B2E" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M 0 0 L -20 -15 A 8 8 0 0 0 -25 0 A 8 8 0 0 0 -20 15 Z" fill="#FF2A7A" stroke="#2D1B2E" strokeWidth="3" strokeLinejoin="round"/>
        <circle cx="0" cy="0" r="8" fill="#FF2A7A" stroke="#2D1B2E" strokeWidth="3"/>
      </g>
    </motion.svg>
  );
};
