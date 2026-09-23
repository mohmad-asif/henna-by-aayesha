import React from 'react';
import type { Metadata } from 'next';
import { fetchTestimonials, fetchSiteSettings } from '@/lib/supabase/data';
import { TestimonialCard } from '@/components/cards/testimonial-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';
import { StarIcon, HeartIcon } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { CTASection } from '@/components/sections/cta-section';

import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export const metadata: Metadata = {
  title: 'Bride Reviews & Testimonials Bangalore',
  description:
    'Read real verified experiences from Bangalore brides who chose Henna by Aayesha for their wedding, engagement, and festive celebrations.',
  alternates: {
    canonical: '/testimonials',
  },
  openGraph: {
    title: 'Bride Reviews & Testimonials Bangalore | Henna by Aayesha',
    description:
      'Read real verified experiences from Bangalore brides who chose Henna by Aayesha for their wedding, engagement, and festive celebrations.',
    url: getCanonicalUrl('/testimonials'),
    type: 'website',
    images: [
      {
        url: '/images/hero-bride.jpg',
        width: 1200,
        height: 900,
        alt: 'Bride Reviews & Testimonials - Henna by Aayesha Bangalore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bride Reviews & Testimonials Bangalore | Henna by Aayesha',
    description:
      'Real client reviews from Bangalore brides. 100% natural organic henna.',
    images: ['/images/hero-bride.jpg'],
  },
};

export default async function TestimonialsPage() {
  const [testimonials, settings] = await Promise.all([
    fetchTestimonials(),
    fetchSiteSettings(),
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Testimonials', path: '/testimonials' },
  ]);

  return (
    <div>
      <JsonLd data={breadcrumbSchema} />
      {/* Page Header */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#FAF3EE] to-[#FCF9F4] border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex mb-4">
            <LocationBadge label="Bangalore Bride Reviews" variant="accent" />
          </div>

          <SectionHeading
            as="h1"
            eyebrow="Heartfelt Words"
            title="Bangalore Bride Reviews & Client Stories"
            description="Nothing brings us greater joy than seeing our brides smile as their henna oxidizes into a deep mahogany stain. Read their personal experiences."
            align="center"
            showMotif
          />

          {/* Aggregate Rating Banner */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-[#D6C1AF] shadow-xs">
            <div className="flex items-center text-[#C29B4D]">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} size={18} filled />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#4E2714]">
              5.0 / 5.0 Average Rating
            </span>
            <span className="text-xs text-[#847269]">
              • 100% Verified Bangalore Brides
            </span>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-14 sm:py-20 bg-[#FCF9F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          {/* Share Your Story Card */}
          <div className="mt-14 max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-[#E0D4C2] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF3EE] text-[#B95945] flex items-center justify-center mx-auto mb-4">
              <HeartIcon size={24} />
            </div>
            <h3 className="font-serif-heading text-2xl font-semibold text-[#261B16]">
              Were You an Aayesha Bride?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#58463D] leading-relaxed">
              We would be honored to feature your wedding stain photos and memories in our Bangalore gallery! Drop us a message on WhatsApp.
            </p>
            <div className="mt-5">
              <WhatsAppButton
                phoneRaw={settings.contact.whatsappPhoneRaw}
                message="Hi Aayesha, I wanted to share my bridal stain photos and feedback from my wedding in Bangalore!"
                label="Share Your Feedback on WhatsApp"
                variant="outline"
                size="md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection
        phoneRaw={settings.contact.whatsappPhoneRaw}
        emailAddress={settings.contact.email}
        title="Experience the Aayesha Difference for Yourself"
        description="Reserve your bridal date or event slot in Bangalore by chatting with Aayesha directly on WhatsApp."
      />
    </div>
  );
}
