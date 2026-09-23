import React from 'react';
import { HennaFloralMotif } from './icons';

export interface SectionHeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left' | 'right';
  showMotif?: boolean;
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  as = 'h2',
  eyebrow,
  title,
  description,
  align = 'center',
  showMotif = false,
  className = '',
  titleClassName = '',
}: SectionHeadingProps) {
  const alignmentStyles = {
    center: 'text-center mx-auto items-center',
    left: 'text-left items-start',
    right: 'text-right items-end ml-auto',
  };

  const HeadingTag = as;

  return (
    <div className={`flex flex-col max-w-3xl ${alignmentStyles[align]} ${className}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#B95945] mb-2.5 bg-[#F9EFEA] px-3.5 py-1 rounded-full border border-[#F2D7D0]">
          {showMotif && <HennaFloralMotif size={14} className="text-[#B95945]" />}
          {eyebrow}
        </span>
      )}

      <HeadingTag
        className={`font-serif-heading text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#261B16] leading-[1.18] ${titleClassName}`}
      >
        {title}
      </HeadingTag>

      {description && (
        <p className="mt-4 text-base sm:text-lg text-[#58463D] font-normal leading-relaxed max-w-2xl">
          {description}
        </p>
      )}

      {showMotif && align === 'center' && (
        <div className="flex items-center justify-center gap-3 mt-4 text-[#C29B4D] opacity-75">
          <div className="w-12 h-px bg-[#D6C1AF]" />
          <HennaFloralMotif size={16} />
          <div className="w-12 h-px bg-[#D6C1AF]" />
        </div>
      )}
    </div>
  );
}
