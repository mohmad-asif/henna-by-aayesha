import React from 'react';
import { SectionHeading } from '@/components/ui/section-heading';
import {
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  LeafIcon,
  MapPinIcon,
} from '@/components/ui/icons';

const pillars = [
  {
    icon: SparklesIcon,
    title: 'Personalized Designs',
    description:
      'Every bridal and festive pattern is uniquely tailored to you. From hidden couple initials and courtship storytelling to modern minimalist geometry, each piece is an original reflection of your style.',
    badge: 'Custom Tailored',
  },
  {
    icon: LeafIcon,
    title: 'Attention to Detail',
    description:
      'Known for ultra-fine needle-cone line work, immaculate symmetry, and delicate lace net borders. Every leaf, jaal, and lotus petal is executed with patient precision and focus.',
    badge: 'Fine Precision',
  },
  {
    icon: ClockIcon,
    title: 'Professional Service',
    description:
      'Punctual on-location arrival, calm unhurried sittings, and immaculate hygiene. All cones are freshly hand-mixed 24 hours prior to your event for peak dye release.',
    badge: 'Reliable & Serene',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Elegant Finishing',
    description:
      'We supply complimentary lemon-sugar herbal sealant spray and our nourishing aftercare balm with clear instructions to ensure an enviable, deep mahogany stain.',
    badge: 'Aftercare Included',
  },
  {
    icon: MapPinIcon,
    title: 'Bangalore Availability',
    description:
      'Direct doorstep travel to your home, resort, or hotel suite across all zones in Bengaluru. Relax in your personal space while Aayesha creates your henna adornment.',
    badge: 'Bangalore Exclusive',
  },
];

export function WhyChoose() {
  return (
    <section className="py-16 sm:py-24 bg-[#FCF9F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Aayesha Standard"
          title="Why Choose Henna by Aayesha"
          description="Crafted with pure organic botanicals, meticulous devotion, and unhurried artistry — designed to leave you with cherished memories and a rich mahogany stain."
          align="center"
          showMotif
        />

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-6 sm:p-7 border border-[#EADFD3] shadow-xs hover:border-[#D6C1AF] hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                  idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF3EE] border border-[#E8D9CD] flex items-center justify-center text-[#B95945]">
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#847269] bg-[#F6F0E6] px-2.5 py-1 rounded-full border border-[#EADBCE]">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="font-serif-heading text-xl font-semibold text-[#261B16] leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-[#58463D] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F5ECE4] text-[11px] font-medium text-[#703D24]">
                  Personal Attention Guaranteed
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
