import React from 'react';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { EmailButton } from '@/components/ui/email-button';
import { LocationBadge } from '@/components/ui/location-badge';
import { HennaFloralMotif, ShieldCheckIcon } from '@/components/ui/icons';

export interface CTASectionProps {
  title?: string;
  description?: string;
  customMessage?: string;
  phoneRaw?: string;
  emailAddress?: string;
  showEmail?: boolean;
}

export function CTASection({
  title = 'Ready for Timeless Bridal Mehndi in Bangalore?',
  description = 'Book your personalized appointment directly on WhatsApp with Aayesha. Share your event date, location in Bangalore, and design preferences for immediate availability.',
  customMessage,
  phoneRaw,
  emailAddress,
  showEmail = true,
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-[#FAF3EE] border-y border-[#EADFD3]">
      {/* Decorative background motifs */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#EBDDCF]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#C29B4D]/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center mb-5">
          <LocationBadge label="Available in Bangalore / Bengaluru Only" variant="accent" size="md" />
        </div>

        <h2 className="font-serif-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-[#261B16] tracking-tight max-w-3xl mx-auto leading-tight">
          {title}
        </h2>

        <p className="mt-4 text-base sm:text-lg text-[#58463D] max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>

        {/* Badges row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#703D24]">
          <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-[#E8D9CD]">
            <ShieldCheckIcon size={15} className="text-[#1EBE5D]" />
            <span>100% Organic Rajasthani Henna</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-[#E8D9CD]">
            <HennaFloralMotif size={14} className="text-[#C29B4D]" />
            <span>On-Location Bridal Visits Citywide</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <WhatsAppButton
            message={customMessage}
            phoneRaw={phoneRaw}
            label="Book Appointment on WhatsApp"
            size="lg"
            variant="whatsapp"
            className="w-full sm:w-auto"
          />

          {showEmail && (
            <EmailButton
              emailAddress={emailAddress}
              label="Email Inquiry"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            />
          )}
        </div>

        <p className="mt-4 text-xs text-[#847269]">
          Appointments are handled directly by Aayesha • Fast response within a few hours
        </p>
      </div>
    </section>
  );
}
