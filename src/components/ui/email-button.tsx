import React from 'react';
import { buildEmailUrl } from '@/config/site';
import { MailIcon } from './icons';

export interface EmailButtonProps {
  subject?: string;
  body?: string;
  emailAddress?: string;
  label?: string;
  variant?: 'outline' | 'secondary' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Reusable Email CTA Component
 *
 * Ensures all email interactions across the website strictly utilize the
 * centralized contact configuration without hardcoding email strings.
 */
export function EmailButton({
  subject = 'Inquiry: Henna by Aayesha Mehndi Services',
  body,
  emailAddress,
  label = 'Send an Email',
  variant = 'outline',
  size = 'md',
  showIcon = true,
  fullWidth = false,
  className = '',
}: EmailButtonProps) {
  const url = buildEmailUrl(subject, body, emailAddress);

  if (!url) {
    return null;
  }

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] select-none text-decoration-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-sm',
  };

  const variantStyles = {
    outline:
      'border border-[#D4C3B3] text-[#4E2714] hover:bg-[#F5ECE4] hover:border-[#4E2714] focus-visible:ring-[#4E2714]',
    secondary:
      'bg-[#F5ECE4] text-[#4E2714] hover:bg-[#EBDDCF] focus-visible:ring-[#4E2714]',
    primary:
      'bg-[#4E2714] text-[#FCF9F4] hover:bg-[#381A0E] focus-visible:ring-[#4E2714] shadow-sm',
    ghost:
      'text-[#4E2714] hover:bg-[#F5ECE4] hover:text-[#381A0E] focus-visible:ring-[#4E2714]',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <a
      href={url}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`.trim()}
      aria-label={`${label} (opens default email client)`}
    >
      {showIcon && (
        <MailIcon size={iconSizes[size]} className="flex-shrink-0" />
      )}
      <span>{label}</span>
    </a>
  );
}
