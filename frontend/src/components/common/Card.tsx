import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border-subtle rounded-xl p-5 shadow-card ${onClick ? 'cursor-pointer hover:border-slate-300 transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
