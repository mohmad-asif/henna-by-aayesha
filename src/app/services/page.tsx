import React from 'react';
import type { Metadata } from 'next';
import { fetchServices, fetchSiteSettings, fetchFaqs } from '@/lib/supabase/data';
import { ServiceCard } from '@/components/cards/service-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';
import { CTASection } from '@/components/sections/cta-section';
import { BangaloreBanner } from '@/components/sections/bangalore-banner';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';

import { JsonLd, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';
import { formatLocation } from '@/lib/settings/location';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const city = settings.location?.city || settings.contact.city;

  const title = settings.seo?.servicesTitle
    ? formatLocation(settings.seo.servicesTitle, settings)
    : `Bridal Mehndi Services & Packages in ${city}`;

  const description = settings.seo?.servicesDescription
    ? formatLocation(settings.seo.servicesDescription, settings)
    : `Comprehensive bridal, sangeet, and festive mehndi packages in ${city}. On-location doorstep service across ${city} with 100% natural organic henna.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/services',
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl('/services'),
      type: 'website',
      images: [
        {
          url: '/images/hero-bride.jpg',
          width: 1200,
          height: 900,
          alt: `Bridal Mehndi Services in ${city} by ${settings.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/hero-bride.jpg'],
    },
  };
}

export default async function ServicesPage() {
  const [services, settings, faqs] = await Promise.all([
    fetchServices(),
    fetchSiteSettings(),
    fetchFaqs(),
  ]);

  const city = settings.location?.city || settings.contact.city;
  const serviceAvailability =
    settings.location?.serviceAvailability ||
    settings.location?.availability ||
    `Direct On-Location Visits in ${city} Only`;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
  ]);
  const serviceSchemas = services.map((s) => generateServiceSchema(s, settings));

  return (
    <div>
      <JsonLd data={[breadcrumbSchema, ...serviceSchemas]} />
      {/* Page Header */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF3EE] to-[#FCF9F4] border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex mb-4">
            <LocationBadge label={serviceAvailability} variant="accent" />
          </div>

          <SectionHeading
            as="h1"
            eyebrow="Bespoke Offerings"
            title={`Bridal & Festive Mehndi Services in ${city}`}
            description="Whether celebrating your wedding day, engagement, or festive milestone, our packages are thoughtfully structured with organic cones, personalized storytelling, and complimentary aftercare."
            align="center"
            showMotif
          />
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24 bg-[#FCF9F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                phoneRaw={settings.contact.whatsappPhoneRaw}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Booking Process Steps */}
      <section className="py-16 sm:py-20 bg-white border-y border-[#EADBCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Simple 4-Step Process"
            title="How Booking Works"
            description="All appointments are arranged seamlessly on WhatsApp with direct communication."
            showMotif
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF3EE] border border-[#EADBCE] text-center">
              <span className="w-10 h-10 rounded-full bg-[#4E2714] text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">
                1
              </span>
              <h3 className="font-serif-heading text-lg font-semibold text-[#261B16]">
                WhatsApp Inquiry
              </h3>
              <p className="mt-2 text-xs text-[#58463D]">
                Message Aayesha with your wedding/event date, time, and {city} location area.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF3EE] border border-[#EADBCE] text-center">
              <span className="w-10 h-10 rounded-full bg-[#4E2714] text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">
                2
              </span>
              <h3 className="font-serif-heading text-lg font-semibold text-[#261B16]">
                Date & Package Lock
              </h3>
              <p className="mt-2 text-xs text-[#58463D]">
                Receive availability confirmation and package details tailored to your requirements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF3EE] border border-[#EADBCE] text-center">
              <span className="w-10 h-10 rounded-full bg-[#4E2714] text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">
                3
              </span>
              <h3 className="font-serif-heading text-lg font-semibold text-[#261B16]">
                Design Consultation
              </h3>
              <p className="mt-2 text-xs text-[#58463D]">
                Share inspiration photos, couple initials, and personalization wishes before the day.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF3EE] border border-[#EADBCE] text-center">
              <span className="w-10 h-10 rounded-full bg-[#4E2714] text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">
                4
              </span>
              <h3 className="font-serif-heading text-lg font-semibold text-[#261B16]">
                On-Location Artistry
              </h3>
              <p className="mt-2 text-xs text-[#58463D]">
                Aayesha arrives at your venue with fresh organic cones and aftercare balm kit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 sm:py-24 bg-[#FCF9F4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Helpful Information"
            title="Frequently Asked Questions"
            description={`Common questions about our organic henna, appointments, and ${city} coverage.`}
            showMotif
          />

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs"
              >
                <h3 className="font-serif-heading text-lg sm:text-xl font-semibold text-[#261B16] leading-snug">
                  {formatLocation(faq.question, settings)}
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-[#58463D] leading-relaxed whitespace-pre-line">
                  {formatLocation(faq.answer, settings)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs text-[#847269] mb-3">
              Have another question? Aayesha is happy to answer on WhatsApp.
            </p>
            <WhatsAppButton
              phoneRaw={settings.contact.whatsappPhoneRaw}
              message={`Hi Aayesha, I have a question about your mehndi services in ${city}.`}
              label="Ask a Question on WhatsApp"
              variant="outline"
              size="md"
            />
          </div>
        </div>
      </section>

      {/* Service-area Notice */}
      <BangaloreBanner settings={settings} phoneRaw={settings.contact.whatsappPhoneRaw} />

      {/* Bottom CTA */}
      <CTASection
        title="Check Availability for Your Wedding or Event"
        description={`Share your ${city} venue and preferred package with Aayesha directly on WhatsApp.`}
        phoneRaw={settings.contact.whatsappPhoneRaw}
      />
    </div>
  );
}
