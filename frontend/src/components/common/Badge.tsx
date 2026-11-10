import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'navy';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-[#DFF3E7] text-[#166534] border border-[#bbf0cf]',
    amber: 'bg-[#FFF0D6] text-[#9A3412] border border-[#fde2b4]',
    red: 'bg-[#FCE5E5] text-[#991B1B] border border-[#fad2d2]',
    blue: 'bg-[#EBF2FA] text-[#22487A] border border-[#d2e3f5]',
    slate: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
    navy: 'bg-[#17243A] text-white border border-[#17243A]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-full',
    md: 'text-[12px] px-2.5 py-1 font-medium rounded-md',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};
