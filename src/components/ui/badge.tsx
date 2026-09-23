import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'henna' | 'gold' | 'terracotta' | 'subtle' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'henna',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  const variantStyles = {
    henna: 'bg-[#F5ECE4] text-[#4E2714] border border-[#E4D2C3]',
    gold: 'bg-[#F9F5EA] text-[#7E5E1C] border border-[#ECDDBF]',
    terracotta: 'bg-[#F9EFEA] text-[#9B4230] border border-[#EFCFC7]',
    subtle: 'bg-[#F6F0E6] text-[#58463D] border border-[#E6DBCF]',
    neutral: 'bg-white text-[#58463D] border border-[#EADFD3] shadow-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
