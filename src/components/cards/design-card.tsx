import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MehndiDesign } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, ArrowRightIcon } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';

export interface DesignCardProps {
  design: MehndiDesign;
  priority?: boolean;
}

export function DesignCard({ design, priority = false }: DesignCardProps) {
  const whatsappInquiryMessage = `Hi Aayesha, I love your "${design.title}" (${design.categoryLabel}) design and would like to inquire about booking this for an event in Bangalore.`;

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-[#EADFD3] shadow-xs hover:border-[#D6C1AF] hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6F0E6]">
        <Image
          src={design.image}
          alt={`${design.title} - ${design.categoryLabel} mehndi design by Aayesha in Bangalore`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category tag */}
        <div className="absolute top-3.5 left-3.5">
          <Badge variant="neutral" className="backdrop-blur-xs font-semibold text-[#4E2714] shadow-xs">
            {design.categoryLabel}
          </Badge>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 text-xs text-white/95 font-medium bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
          <ClockIcon size={13} className="text-[#F9F5EA]" />
          <span>{design.estimatedDuration}</span>
        </div>
      </div>

      {/* Body content */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-serif-heading text-xl sm:text-2xl font-semibold text-[#261B16] leading-snug group-hover:text-[#B95945] transition-colors">
            <Link href={`/mehndi-designs/${design.slug}`}>
              {design.title}
            </Link>
          </h3>

          <p className="mt-2 text-sm text-[#58463D] leading-relaxed line-clamp-2">
            {design.shortDescription}
          </p>

          <div className="mt-3.5 text-xs text-[#847269] flex items-center gap-2 border-t border-[#F5ECE4] pt-3">
            <span className="font-medium text-[#4E2714]">Coverage:</span>
            <span className="truncate">{design.coverage}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-4 border-t border-[#F5ECE4] flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href={`/mehndi-designs/${design.slug}`}
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-semibold text-[#4E2714] hover:text-[#B95945] transition-colors py-2 px-3 gap-1.5"
          >
            <span>View Design</span>
            <ArrowRightIcon size={14} />
          </Link>

          <WhatsAppButton
            message={whatsappInquiryMessage}
            label="Inquire Design"
            size="sm"
            variant="whatsapp"
            className="w-full sm:w-auto sm:ml-auto"
          />
        </div>
      </div>
    </article>
  );
}
