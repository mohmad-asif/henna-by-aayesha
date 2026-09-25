import React from 'react';
import Image from 'next/image';
import { ServicePackage } from '@/types';
import { CheckCircleIcon, ClockIcon, MapPinIcon } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { Badge } from '@/components/ui/badge';

export interface ServiceCardProps {
  service: ServicePackage;
  phoneRaw?: string;
  city?: string;
}

export function ServiceCard({ service, phoneRaw, city = 'Bengaluru' }: ServiceCardProps) {
  const whatsappBookingMessage = `Hi Aayesha, I would like to inquire and check your availability for the "${service.title}" package in ${city}.`;
  const imageSrc = service.image || '/images/hero-bride.jpg';
  const travelLabel = service.bangaloreTravel || `${city} Doorstep`;

  return (
    <div
      className={`group relative bg-white rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between h-full ${
        service.recommendedForBridal
          ? 'border-[#C29B4D] shadow-lg ring-1 ring-[#C29B4D]/30'
          : 'border-[#EADFD3] shadow-xs hover:border-[#D6C1AF] hover:shadow-md'
      }`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FAF3EE]">
        <Image
          src={imageSrc}
          alt={`${service.title} - Bridal mehndi service in ${city} by Henna by Aayesha`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Recommended Badge */}
        {service.recommendedForBridal && (
          <div className="absolute top-4 left-4">
            <Badge variant="gold" className="font-semibold tracking-wide shadow-md uppercase text-[10px] px-3 py-1">
              Most Popular Bridal Choice
            </Badge>
          </div>
        )}

        {/* Price Tag Overlay if available */}
        {service.priceText && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-[#4E2714] text-xs font-semibold px-3 py-1 rounded-full shadow-xs border border-[#EADBCE]">
            {service.priceText}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-7 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="font-serif-heading text-2xl font-semibold text-[#261B16] leading-tight group-hover:text-[#4E2714] transition-colors">
            {service.title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#703D24] font-medium">
            {service.subtitle}
          </p>

          <p className="mt-3.5 text-xs sm:text-sm text-[#58463D] leading-relaxed">
            {service.description}
          </p>

          {/* Time duration & Service Area */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#FAF6F0] p-3 rounded-xl border border-[#F0E5D8]">
            <div className="flex items-center gap-2 text-xs text-[#58463D]">
              <ClockIcon size={14} className="text-[#B95945] flex-shrink-0" />
              <span className="font-medium text-[#261B16]">Duration:</span>
              <span className="truncate">{service.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#58463D]">
              <MapPinIcon size={14} className="text-[#B95945] flex-shrink-0" />
              <span className="text-[#703D24] font-medium truncate" title={travelLabel}>
                {travelLabel}
              </span>
            </div>
          </div>

          {/* Features list */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#847269] mb-2.5">
              Package Inclusions
            </h4>
            <ul className="space-y-2">
              {service.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#4E2714]">
                  <CheckCircleIcon size={15} className="text-[#1EBE5D] flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="mt-6 pt-4 border-t border-[#F5ECE4]">
          {service.note && (
            <p className="text-[11px] text-[#847269] italic mb-3">
              * {service.note}
            </p>
          )}
          <WhatsAppButton
            message={whatsappBookingMessage}
            phoneRaw={phoneRaw}
            label="Inquire Package on WhatsApp"
            size="md"
            variant={service.recommendedForBridal ? 'whatsapp' : 'primary'}
            fullWidth
            trackEventName={`Service viewed: ${service.title}`}
          />
        </div>
      </div>
    </div>
  );
}
