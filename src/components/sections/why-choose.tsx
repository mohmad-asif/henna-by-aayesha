import React from 'react';
import { SectionHeading } from '@/components/ui/section-heading';
import { WhyChooseUsItem, SiteConfig } from '@/types';
import { formatLocation } from '@/lib/settings/location';

export function WhyChoose({
  items,
  settings,
}: {
  items?: WhyChooseUsItem[];
  settings?: SiteConfig;
}) {
  const displayItems =
    items && items.length > 0
      ? items.filter((i) => i.published !== false).sort((a, b) => a.displayOrder - b.displayOrder)
      : [
          {
            id: '1',
            icon: '✨',
            title: 'Personalized Designs',
            description:
              'Every bridal and festive pattern is uniquely tailored to you. From hidden couple initials and courtship storytelling to modern minimalist geometry, each piece is an original reflection of your style.',
            displayOrder: 1,
            published: true,
          },
          {
            id: '2',
            icon: '🌿',
            title: '100% Organic Henna',
            description:
              'Hand-sifted organic Sojat henna freshly prepared with pure eucalyptus, tea tree, and cajeput essential oils for rich, dark stain development without chemicals.',
            displayOrder: 2,
            published: true,
          },
          {
            id: '3',
            icon: '⏱️',
            title: 'Professional Service',
            description:
              'Punctual on-location arrival, calm unhurried sittings, and immaculate hygiene. All cones are freshly mixed for peak dye release and comfortable application.',
            displayOrder: 3,
            published: true,
          },
          {
            id: '4',
            icon: '🛡️',
            title: 'Complimentary Aftercare',
            description:
              'We supply complimentary lemon-sugar sealant spray and our nourishing botanical aftercare balm with clear guidance to ensure an enviable, deep mahogany tone.',
            displayOrder: 4,
            published: true,
          },
          {
            id: '5',
            icon: '📍',
            title: `${settings?.location?.city || 'Bengaluru'} Doorstep Travel`,
            description: `Direct artist travel to your home, resort, or hotel suite across ${settings?.location?.city || 'Bengaluru'} and nearby regions. Relax while Aayesha adorns your hands and feet.`,
            displayOrder: 5,
            published: true,
          },
        ];

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
          {displayItems.map((item, idx) => {
            const formattedDesc = formatLocation(item.description, settings);
            const formattedTitle = formatLocation(item.title, settings);

            return (
              <div
                key={item.id || idx}
                className={`bg-white rounded-3xl p-6 sm:p-7 border border-[#EADFD3] shadow-xs hover:border-[#D6C1AF] hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                  idx === 4 && displayItems.length === 5 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF3EE] border border-[#E8D9CD] flex items-center justify-center text-2xl">
                      {item.icon || '🌿'}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#847269] bg-[#F6F0E6] px-2.5 py-1 rounded-full border border-[#EADBCE]">
                      Quality Standard
                    </span>
                  </div>

                  <h3 className="font-serif-heading text-xl font-semibold text-[#261B16] leading-snug">
                    {formattedTitle}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-[#58463D] leading-relaxed">
                    {formattedDesc}
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
