import React from 'react';

export const YapeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Yape Purple Background */}
    <rect width="24" height="24" rx="6" fill="#742284"/>
    {/* Yape Pin/Drop Shape */}
    <path d="M12 5C9.23858 5 7 7.23858 7 10C7 13.5 12 19 12 19C12 19 17 13.5 17 10C17 7.23858 14.7614 5 12 5Z" fill="white"/>
    {/* Yape Inner Cyan Circle */}
    <circle cx="12" cy="10" r="2.5" fill="#00E4CC"/>
  </svg>
);

export const PlinIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Plin Cyan Background */}
    <rect width="24" height="24" rx="6" fill="#00D8D6"/>
    {/* Plin "P" and Smile/Arrow */}
    <path d="M8 7H12.5C14.433 7 16 8.567 16 10.5C16 12.433 14.433 14 12.5 14H10V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 16.5L15.5 19L18 16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
