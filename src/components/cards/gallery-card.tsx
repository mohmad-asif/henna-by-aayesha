'use client';

import React from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { WhatsAppIcon } from '@/components/ui/icons';
import { buildWhatsAppUrl } from '@/config/site';

export interface GalleryCardProps {
  item: GalleryItem;
  priority?: boolean;
  onClick?: () => void;
}

export function GalleryCard({ item, priority = false, onClick }: GalleryCardProps) {
  const whatsappUrl = buildWhatsAppUrl(
    `Hi Aayesha, I saw the photo "${item.title}" in your gallery and would like to ask about a similar mehndi design in Bangalore.`
  );

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View full image for ${item.title}` : undefined}
      className={`group relative bg-[#F6F0E6] rounded-3xl overflow-hidden border border-[#EADFD3] shadow-xs hover:shadow-xl transition-all duration-300 ${
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4E2714] focus:ring-offset-2' : ''
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={item.image}
          alt={`${item.title} - ${item.categoryLabel} mehndi art in Bangalore by Aayesha`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5" />

        {/* Category Pill */}
        <div className="absolute top-3.5 left-3.5">
          <Badge variant="neutral" className="shadow-xs font-medium text-xs">
            {item.categoryLabel}
          </Badge>
        </div>

        {/* Hover overlay content */}
        <div className="absolute bottom-0 inset-x-0 p-5 transform translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="font-serif-heading text-xl font-semibold text-white">
            {item.title}
          </h3>
          <p className="text-xs text-white/80 mt-1 line-clamp-2">
            {item.caption}
          </p>

          <div className="mt-3.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#F5ECE4] underline underline-offset-2">
              Click to view large
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#25D366] text-white px-3 py-1.5 rounded-full hover:bg-[#1EBE5D] transition-colors shadow-xs"
            >
              <WhatsAppIcon size={14} />
              <span>Inquire</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
