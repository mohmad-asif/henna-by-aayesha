import React from 'react';
import Link from 'next/link';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  external?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  external,
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-sm',
  };

  const variantStyles = {
    primary:
      'bg-[#4E2714] text-[#FCF9F4] hover:bg-[#381A0E] focus-visible:ring-[#4E2714] shadow-sm hover:shadow',
    secondary:
      'bg-[#F5ECE4] text-[#4E2714] hover:bg-[#EBDDCF] focus-visible:ring-[#4E2714]',
    outline:
      'border border-[#D4C3B3] text-[#4E2714] hover:bg-[#F5ECE4] hover:border-[#4E2714] focus-visible:ring-[#4E2714]',
    gold:
      'bg-[#C29B4D] text-[#FCF9F4] hover:bg-[#A98336] focus-visible:ring-[#C29B4D] shadow-sm',
    ghost:
      'text-[#4E2714] hover:bg-[#F5ECE4] hover:text-[#381A0E] focus-visible:ring-[#4E2714]',
    whatsapp:
      'bg-[#25D366] text-white hover:bg-[#1EBE5D] focus-visible:ring-[#25D366] whatsapp-glow font-semibold',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`.trim();

  if (href) {
    if (external || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('https://wa.me')) {
      return (
        <a
          href={href}
          className={combinedClasses}
          target={external || !href.startsWith('mailto:') ? '_blank' : undefined}
          rel={external || !href.startsWith('mailto:') ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
