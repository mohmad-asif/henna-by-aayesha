'use client';

import React, { useState } from 'react';
import { SectionHeading } from '@/components/ui/section-heading';
import { FaqItem, SiteConfig } from '@/types';
import { formatLocation } from '@/lib/settings/location';

export function FaqSection({
  faqs,
  settings,
}: {
  faqs: FaqItem[];
  settings?: SiteConfig;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const publishedFaqs = faqs.filter((f) => f.published !== false);

  if (publishedFaqs.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-[#FCF9F4] border-t border-[#EADBCE]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Help & Clarifications"
          title="Frequently Asked Questions"
          description="Everything you need to know about bridal bookings, organic henna cones, and artist visits."
          align="center"
          showMotif
        />

        <div className="mt-12 space-y-4">
          {publishedFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const question = formatLocation(faq.question, settings);
            const answer = formatLocation(faq.answer, settings);

            return (
              <div
                key={faq.id || idx}
                className="bg-white rounded-2xl border border-[#EADFD3] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif-heading text-base sm:text-lg font-semibold text-[#261B16]">
                    {question}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full bg-[#FAF3EE] flex items-center justify-center text-[#B95945] font-bold text-base transition-transform flex-shrink-0 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#58463D] leading-relaxed border-t border-[#FAF3EE] whitespace-pre-line">
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
