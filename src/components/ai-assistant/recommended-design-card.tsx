'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RecommendedDesign } from '@/lib/ai/design/types';
import { buildWhatsAppUrl } from '@/config/site';
import { WhatsAppIcon, ArrowRightIcon, ClockIcon } from '@/components/ui/icons';

interface RecommendedDesignCardProps {
  item: RecommendedDesign;
  whatsappRaw?: string;
  isCompact?: boolean;
}

export function RecommendedDesignCard({
  item,
  whatsappRaw,
  isCompact = false,
}: RecommendedDesignCardProps) {
  // Build dynamic pre-filled WhatsApp URLs for this specific verified design
  const askMessage = `Hi Aayesha, I found this mehndi design on your website and would like to know more about it.\n\nDesign: ${item.title}`;
  const bookMessage = `Hi Aayesha, I would like to book this mehndi design.\n\nDesign: ${item.title}\n\nPlease let me know the availability and details.`;

  const askUrl = buildWhatsAppUrl(askMessage, whatsappRaw);
  const bookUrl = buildWhatsAppUrl(bookMessage, whatsappRaw);

  return (
    <div
      className={`rounded-2xl border border-[#EADBCE] bg-white overflow-hidden shadow-xs hover:border-[#B95945] hover:shadow-md transition-all duration-300 flex flex-col ${
        isCompact ? 'w-full max-w-[320px] flex-shrink-0' : 'w-full'
      }`}
    >
      {/* Image & Category Overlay */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F5ECE4]">
        <Image
          src={item.image || '/images/hero-bride.jpg'}
          alt={`${item.title} - ${item.categoryLabel || item.category} mehndi design by Aayesha`}
          fill
          sizes="(max-width: 640px) 280px, 340px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#4E2714] shadow-xs">
            {item.categoryLabel || item.category}
          </span>
        </div>

        {item.estimatedDuration && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] text-white/95 font-medium bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
            <ClockIcon size={11} className="text-[#F9F5EA]" />
            <span>{item.estimatedDuration}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
        <div>
          <h4 className="font-serif-heading text-base font-bold text-[#261B16] leading-snug line-clamp-1 hover:text-[#B95945] transition-colors">
            <Link href={`/mehndi-designs/${item.slug}`}>
              {item.title}
            </Link>
          </h4>

          {item.coverage && (
            <p className="text-[11px] text-[#703D24] mt-0.5 line-clamp-1">
              <strong>Coverage:</strong> {item.coverage}
            </p>
          )}

          {/* AI Match Explanation Grounded in Attributes */}
          {item.reason && (
            <div className="mt-2 p-2 rounded-xl bg-[#FAF6F0] border border-[#EADBCE] text-[11px] text-[#58463D] leading-relaxed">
              <span className="font-semibold text-[#B95945] block mb-0.5">
                ✨ Why this matches:
              </span>
              <span>{item.reason}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#F5ECE4] space-y-2">
          {/* View Design Detail Page */}
          <Link
            href={`/mehndi-designs/${item.slug}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-[#4E2714] hover:text-[#B95945] bg-[#F5ECE4] hover:bg-[#EBDDCF] transition-colors"
          >
            <span>View Design Details</span>
            <ArrowRightIcon size={12} />
          </Link>

          {/* Dual WhatsApp Actions */}
          {askUrl && bookUrl && (
            <div className="grid grid-cols-2 gap-1.5">
              <a
                href={askUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-[#25D366] text-[#1E7E34] hover:bg-[#EAFBF0] text-[11px] font-semibold transition-colors"
                aria-label={`Ask about ${item.title} on WhatsApp`}
              >
                <WhatsAppIcon size={13} />
                <span>Ask About</span>
              </a>

              <a
                href={bookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-semibold shadow-2xs transition-colors"
                aria-label={`Book ${item.title} on WhatsApp`}
              >
                <WhatsAppIcon size={13} />
                <span>Book Design</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
