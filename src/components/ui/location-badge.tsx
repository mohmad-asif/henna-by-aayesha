import React from 'react';
import { MapPinIcon } from './icons';

export interface LocationBadgeProps {
  label?: string;
  className?: string;
  variant?: 'subtle' | 'accent' | 'outlined';
  size?: 'sm' | 'md';
}

/**
 * Dedicated Location Badge highlighting Bangalore/Bengaluru exclusive availability
 */
export function LocationBadge({
  label = 'Bangalore / Bengaluru Only',
  className = '',
  variant = 'accent',
  size = 'md',
}: LocationBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const variantClasses = {
    subtle: 'bg-[#F5ECE4] text-[#4E2714] border border-[#E8D9CD]',
    accent: 'bg-[#F9EFEA] text-[#9B4230] border border-[#EFCFC7] font-medium',
    outlined: 'border border-[#C29B4D] text-[#7E5E1C] bg-[#FDFBF7]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
    >
      <MapPinIcon size={size === 'sm' ? 12 : 14} className="flex-shrink-0" />
      <span>{label}</span>
    </span>
  );
}
