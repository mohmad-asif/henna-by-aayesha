'use client';

import React from 'react';
import { buildWhatsAppUrl } from '@/config/site';
import { WhatsAppIcon } from './icons';
import { useSiteSettings } from '@/components/providers/site-settings-provider';
import { trackEvent } from '@/lib/analytics/events';

export interface WhatsAppButtonProps {
  /** Optional contextual pre-filled message. Defaults to centralized default */
  message?: string;
  /** Optional raw phone number override */
  phoneRaw?: string;
  /** Label inside the button */
  label?: string;
  /** Visual variant */
  variant?: 'primary' | 'whatsapp' | 'outline' | 'gold';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show the WhatsApp icon */
  showIcon?: boolean;
  /** Full width on container */
  fullWidth?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Optional click handler callback */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Optional analytics event name to fire on click */
  trackEventName?: string;
}

/**
 * Reusable WhatsApp CTA Component
 *
 * Ensures all WhatsApp interactions across the entire website use the centralized
 * contact architecture, dynamically generate proper URLs, encode messages cleanly,
 * and open WhatsApp on mobile or web.
 */
export function WhatsAppButton({
  message,
  phoneRaw,
  label = 'Book Appointment on WhatsApp',
  variant = 'whatsapp',
  size = 'md',
  showIcon = true,
  fullWidth = false,
  className = '',
  onClick,
  trackEventName,
}: WhatsAppButtonProps) {
  const contextSettings = useSiteSettings();
  const effectivePhoneRaw =
    phoneRaw !== undefined
      ? phoneRaw
      : contextSettings?.contact.whatsappPhoneRaw;
  const url = buildWhatsAppUrl(message, effectivePhoneRaw);

  if (!url) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (trackEventName) {
      trackEvent(trackEventName, { label });
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] select-none text-decoration-none group';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-sm',
  };

  const variantStyles = {
    whatsapp:
      'bg-[#25D366] text-white hover:bg-[#1EBE5D] focus-visible:ring-[#25D366] whatsapp-glow font-semibold',
    primary:
      'bg-[#4E2714] text-[#FCF9F4] hover:bg-[#381A0E] focus-visible:ring-[#4E2714] shadow-sm hover:shadow',
    outline:
      'border border-[#25D366] text-[#1EBE5D] hover:bg-[#EAFBF0] focus-visible:ring-[#25D366] font-semibold',
    gold:
      'bg-[#C29B4D] text-[#FCF9F4] hover:bg-[#A98336] focus-visible:ring-[#C29B4D] shadow-sm',
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
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`.trim()}
      aria-label={`${label} (opens WhatsApp chat)`}
    >
      {showIcon && (
        <WhatsAppIcon
          size={iconSizes[size]}
          className="transition-transform group-hover:scale-110 flex-shrink-0"
        />
      )}
      <span>{label}</span>
    </a>
  );
}
