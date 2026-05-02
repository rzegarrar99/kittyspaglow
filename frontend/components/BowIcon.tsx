import React from 'react';

export const BowIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" 
      fill="currentColor"
    />
    <path 
      d="M10.5 11.5C8 8 3 7 3 12C3 17 8 16 10.5 12.5L12 14L13.5 12.5C16 16 21 17 21 12C21 7 16 8 13.5 11.5L12 10L10.5 11.5Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M11 13.5L8 21L10.5 19L12 21L13.5 19L16 21L13 13.5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
