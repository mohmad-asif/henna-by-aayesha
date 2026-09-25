import React from 'react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { fetchSiteSettings } from '@/lib/supabase/data';
import { SectionHeading } from '@/components/ui/section-heading';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { LocationBadge } from '@/components/ui/location-badge';
import { CTASection } from '@/components/sections/cta-section';
import { BangaloreBanner } from '@/components/sections/bangalore-banner';
import {
  LeafIcon,
  SparklesIcon,
} from '@/components/ui/icons';

import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const city = settings.location?.city || settings.contact.city;

  const title = `About Aayesha | Bridal Mehndi Artist in ${city}`;
  const description = `Meet Aayesha, dedicated bridal and organic mehndi artist based in ${city}. Learn about our 100% chemical-free Sojat henna cones and personalized wedding adornments.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl('/about'),
      type: 'website',
      images: [
        {
          url: '/images/aayesha-portrait.jpg',
          width: 800,
          height: 1067,
          alt: `Aayesha - Professional Mehndi Artist in ${city}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/aayesha-portrait.jpg'],
    },
  };
}

export default async function AboutPage() {
  const settings = await fetchSiteSettings();
  const city = settings.location?.city || settings.contact.city;
  const altCity = settings.location?.altCity || settings.contact.city;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'About Aayesha', path: '/about' },
  ]);

  return (
    <div>
      <JsonLd data={breadcrumbSchema} />
      {/* Hero Header */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF3EE] to-[#FCF9F4] border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex mb-4">
            <LocationBadge
              label={`Based in ${city}${altCity && altCity !== city ? ` / ${altCity}` : ''}`}
              variant="accent"
            />
          </div>

          <SectionHeading
            as="h1"
            eyebrow="The Artist’s Journey"
            title={`About Aayesha — Bridal Mehndi Artist in ${city}`}
            description="Weaving classical Indian mehndi heritage, love, and botanical craft into deeply personal bridal adornments with 100% chemical-free organic henna."
            align="center"
            showMotif
          />
        </div>
      </section>

      {/* Main Story Grid */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Photo Collage */}
            <div className="lg:col-span-5 space-y-6">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border-4 border-[#FAF3EE]">
                <Image
                  src="/images/aayesha-portrait.jpg"
                  alt={`Aayesha holding henna cone in her ${city} studio`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-top"
                />
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md border-2 border-[#EADFD3]">
                <Image
                  src="/images/artist-at-work.jpg"
                  alt="Aayesha hand-applying intricate bridal henna"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right Story Text */}
            <div className="lg:col-span-7">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#B95945] bg-[#F9EFEA] px-3.5 py-1 rounded-full border border-[#F2D7D0]">
                Philosophy & Background
              </span>

              <h2 className="font-serif-heading text-3xl sm:text-4xl md:text-5xl font-medium text-[#261B16] mt-4 leading-tight">
                “Bridal mehndi is an unrepeatable ritual; it calls for stillness, precision, and heartfelt presence.”
              </h2>

              <div className="mt-6 space-y-4 text-base text-[#58463D] leading-relaxed">
                <p>
                  I began my artistic journey with mehndi out of a deep reverence for how a simple leaf from the arid soils of Rajasthan could transform into such intricate, fragrant lace upon the skin. For every bride across {city}, I approach each celebration as an unrepeatable canvas — honoring her unique heritage, personal narrative, and bridal aesthetic.
                </p>

                <p>
                  In a commercial beauty world often dominated by rushed chemical cones that promise instant black stains at the expense of skin health, I chose a different path: <strong>uncompromising botanical purity</strong>.
                </p>

                <p>
                  Every cone used in our appointments is freshly prepared by hand 24 hours prior. I triple-sift pure Sojat organic henna powder, blending it with steam-distilled eucalyptus and cajeput essential oils. The result is a soothing therapeutic aroma, smooth flowing consistency, and a deep rich burgundy stain that darkens naturally over 48 hours.
                </p>
              </div>

              {/* Pillars list */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF3EE] border border-[#EADBCE]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#4E2714]">
                    <LeafIcon size={18} className="text-[#1EBE5D]" />
                    <span>Zero Chemical Cones</span>
                  </div>
                  <p className="text-xs text-[#703D24] mt-1">
                    Strictly no PPD, no synthetic chemicals, and no skin irritants.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF3EE] border border-[#EADBCE]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#4E2714]">
                    <SparklesIcon size={18} className="text-[#C29B4D]" />
                    <span>Storytelling Motifs</span>
                  </div>
                  <p className="text-xs text-[#703D24] mt-1">
                    Couple portraits, proposal memories, and sacred motifs woven into jaal.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <WhatsAppButton
                  phoneRaw={settings.contact.whatsappPhoneRaw}
                  label="Message Aayesha on WhatsApp"
                  size="lg"
                  variant="whatsapp"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Experience */}
      <section className="py-16 sm:py-24 bg-[#FCF9F4] border-y border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="The Experience"
            title="How We Create Your Bridal Mehndi"
            description="From initial WhatsApp conversation to the final mahogany stain on your wedding day."
            showMotif
          />

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
              <span className="font-serif-heading text-3xl font-bold text-[#B95945]">01</span>
              <h3 className="font-serif-heading text-xl font-semibold text-[#261B16] mt-2">
                WhatsApp Consultation
              </h3>
              <p className="text-xs sm:text-sm text-[#58463D] mt-2 leading-relaxed">
                Connect directly with Aayesha to discuss dates, venue in {city}, and your desired style (Bridal couture, Arabic, or Minimalist).
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
              <span className="font-serif-heading text-3xl font-bold text-[#B95945]">02</span>
              <h3 className="font-serif-heading text-xl font-semibold text-[#261B16] mt-2">
                Fresh Botanical Prep
              </h3>
              <p className="text-xs sm:text-sm text-[#58463D] mt-2 leading-relaxed">
                Cones are hand-mixed from fresh Rajasthani crop specifically for your sitting with organic essential oils for peak dye release.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
              <span className="font-serif-heading text-3xl font-bold text-[#B95945]">03</span>
              <h3 className="font-serif-heading text-xl font-semibold text-[#261B16] mt-2">
                Unhurried Application
              </h3>
              <p className="text-xs sm:text-sm text-[#58463D] mt-2 leading-relaxed">
                Aayesha arrives at your {city} doorstep with full equipment, ensuring a calm, patient, and enjoyable sitting.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
              <span className="font-serif-heading text-3xl font-bold text-[#B95945]">04</span>
              <h3 className="font-serif-heading text-xl font-semibold text-[#261B16] mt-2">
                Sealing & Aftercare
              </h3>
              <p className="text-xs sm:text-sm text-[#58463D] mt-2 leading-relaxed">
                Includes herbal lemon-sugar sealing spray and our organic balm kit with complete instructions to achieve a dark stain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Specific Section */}
      <BangaloreBanner settings={settings} phoneRaw={settings.contact.whatsappPhoneRaw} />

      {/* WhatsApp CTA */}
      <CTASection
        phoneRaw={settings.contact.whatsappPhoneRaw}
        emailAddress={settings.contact.email}
        title="Speak with Aayesha About Your Wedding Date"
        description={`Share your ${city} venue, date, and preferred design package on WhatsApp for personal guidance and availability.`}
      />
    </div>
  );
}
