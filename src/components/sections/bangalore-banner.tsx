import React from 'react';
import { SectionHeading } from '@/components/ui/section-heading';
import { MapPinIcon, CheckCircleIcon } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { LocationBadge } from '@/components/ui/location-badge';

const bangaloreAreas = [
  'Indiranagar',
  'Koramangala',
  'Whitefield',
  'Jayanagar',
  'Sadashivanagar',
  'HSR Layout',
  'Malleshwaram',
  'Hebbal & North Bangalore',
  'JP Nagar',
  'Electronic City',
  'Richmond Town / CBD',
  'Yelahanka',
];

export function BangaloreBanner({ phoneRaw }: { phoneRaw?: string }) {
  return (
    <section className="py-16 sm:py-24 bg-[#F9F5EA] border-y border-[#E9DFCE] relative overflow-hidden">
      {/* Decorative backdrop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7">
            <div className="mb-4">
              <LocationBadge
                label="Bangalore / Bengaluru Service Area Only"
                variant="accent"
                size="md"
              />
            </div>

            <SectionHeading
              align="left"
              title="Looking for a Mehndi Artist in Bangalore?"
              description="To ensure the highest standard of personalized care, unhurried precision, and on-time arrival, Aayesha’s on-location mehndi services are dedicated exclusively to Bangalore / Bengaluru city limits."
              titleClassName="text-3xl sm:text-4xl"
            />

            <div className="mt-6 p-4 rounded-xl bg-white/70 border border-[#E6DBCB] text-xs sm:text-sm text-[#4E2714] leading-relaxed">
              <strong className="font-semibold text-[#B95945]">Please Note:</strong> Mehndi services are available exclusively in Bangalore / Bengaluru. Direct on-location artist travel across all zones in Bengaluru.
            </div>

            {/* Neighborhoods tags */}
            <div className="mt-7">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#847269] mb-3">
                Key Neighborhoods & Venues Served (Citywide Coverage)
              </h3>
              <div className="flex flex-wrap gap-2">
                {bangaloreAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-full border border-[#DFD3C2] text-[#4E2714] shadow-2xs font-medium"
                  >
                    <MapPinIcon size={12} className="text-[#C29B4D]" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Travel card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E0D4C2] shadow-md relative">
              <div className="w-12 h-12 rounded-2xl bg-[#F5ECE4] flex items-center justify-center text-[#B95945] mb-5">
                <MapPinIcon size={26} />
              </div>

              <h3 className="font-serif-heading text-2xl font-semibold text-[#261B16]">
                Direct Doorstep Artist Travel
              </h3>

              <ul className="mt-5 space-y-3.5 text-xs sm:text-sm text-[#58463D]">
                <li className="flex items-start gap-2.5">
                  <CheckCircleIcon size={16} className="text-[#1EBE5D] flex-shrink-0 mt-0.5" />
                  <span>Direct artist arrival with full organic henna setup & equipment.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircleIcon size={16} className="text-[#1EBE5D] flex-shrink-0 mt-0.5" />
                  <span>Available for homes, hotel suites, resorts, and banquet halls citywide.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircleIcon size={16} className="text-[#1EBE5D] flex-shrink-0 mt-0.5" />
                  <span>All appointments confirmed smoothly and promptly via WhatsApp.</span>
                </li>
              </ul>

              <div className="mt-8 pt-5 border-t border-[#F5ECE4]">
                <WhatsAppButton
                  message="Hi Aayesha, I would like to book a mehndi appointment in Bangalore. Please share your availability and details."
                  label="Book Appointment on WhatsApp"
                  phoneRaw={phoneRaw}
                  variant="whatsapp"
                  fullWidth
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
