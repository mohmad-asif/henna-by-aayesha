import React from 'react';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  fetchSiteSettings,
  fetchDesigns,
  fetchServices,
  fetchTestimonials,
  fetchGallery,
  fetchWhyChooseUs,
  fetchFaqs,
} from '@/lib/supabase/data';

import { DesignCard } from '@/components/cards/design-card';
import { ServiceCard } from '@/components/cards/service-card';
import { TestimonialCard } from '@/components/cards/testimonial-card';
import { GalleryCard } from '@/components/cards/gallery-card';

import { SectionHeading } from '@/components/ui/section-heading';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { Button } from '@/components/ui/button';
import { LocationBadge } from '@/components/ui/location-badge';
import { WhyChoose } from '@/components/sections/why-choose';
import { BangaloreBanner } from '@/components/sections/bangalore-banner';
import { FaqSection } from '@/components/sections/faq-section';
import { CTASection } from '@/components/sections/cta-section';
import {
  LeafIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@/components/ui/icons';
import { JsonLd, generateLocalBusinessSchema, generateWebSiteSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';
import { formatLocation } from '@/lib/settings/location';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const city = settings.location?.city || settings.contact.city;
  const altCity = settings.location?.altCity || settings.contact.city;

  const title = settings.seo?.homepageTitle
    ? formatLocation(settings.seo.homepageTitle, settings)
    : `Henna by Aayesha | Mehndi Artist in ${city}`;

  const description = settings.seo?.homepageDescription
    ? formatLocation(settings.seo.homepageDescription, settings)
    : `Exquisite bridal, Arabic, and bespoke mehndi designs in ${city}${altCity && altCity !== city ? ` / ${altCity}` : ''}. 100% natural organic henna, personalized consultations, and appointments via WhatsApp.`;

  const ogImage = settings.seo?.ogImage || '/images/hero-bride.jpg';

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(),
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 900,
          alt: `${settings.name} - Mehndi Artist in ${city}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const [
    siteSettings,
    allDesigns,
    allServices,
    allTestimonials,
    allGallery,
    whyChooseItems,
    faqs,
  ] = await Promise.all([
    fetchSiteSettings(),
    fetchDesigns(),
    fetchServices(),
    fetchTestimonials(),
    fetchGallery(),
    fetchWhyChooseUs(),
    fetchFaqs(),
  ]);

  const city = siteSettings.location?.city || siteSettings.contact.city;
  const sections = siteSettings.sections || {
    hero: true,
    services: true,
    designs: true,
    about: true,
    whyChooseUs: true,
    testimonials: true,
    faq: true,
    instagram: true,
    contactCta: true,
  };

  const hero = siteSettings.hero || {
    badge: `Available in ${city} • WhatsApp Only`,
    title: 'Henna by Aayesha',
    highlightedTitle: `Professional Mehndi Artist in ${city}`,
    description: `Handcrafting elegant mehndi designs and personalized patterns tailored to your celebration. We provide doorstep bridal and event service with ${city} availability exclusively, scheduling every session conveniently via WhatsApp appointments.`,
    primaryCtaText: 'Book Appointment',
    secondaryCtaText: 'Explore Designs',
    imageUrl: '/images/hero-bride.jpg',
    imageAlt: `Signature bridal mehndi in ${city}`,
  };

  const featuredDesigns = allDesigns.filter((d) => d.featured).slice(0, 3);
  const featuredServices = allServices.slice(0, 3);
  const featuredReviews = allTestimonials.filter((t) => t.featured).slice(0, 3);
  const previewGallery = allGallery.slice(0, 4);

  const localBusinessSchema = generateLocalBusinessSchema(siteSettings, allTestimonials);
  const webSiteSchema = generateWebSiteSchema(siteSettings);

  return (
    <div>
      {/* Structured Data: LocalBusiness & WebSite */}
      <JsonLd data={[localBusinessSchema, webSiteSchema]} />

      {/* ========================================================
          1. HERO SECTION
          ======================================================== */}
      {sections.hero !== false && (
        <section className="relative overflow-hidden pt-8 pb-16 sm:py-20 lg:py-24 bg-gradient-to-b from-[#FAF3EE] via-[#FCF9F4] to-[#FCF9F4]">
          {/* Soft background ambient glow */}
          <div className="absolute -top-24 right-0 w-96 h-96 bg-[#EBDDCF]/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-0 -ml-24 w-72 h-72 bg-[#C29B4D]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Content Column (7 cols) */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                {/* Location and Authority Pill */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <LocationBadge
                    label={formatLocation(
                      hero.badge || siteSettings.location?.serviceAvailability || `Available in {city} only`,
                      siteSettings
                    )}
                    variant="accent"
                    size="md"
                  />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#703D24] bg-[#F5ECE4] px-3 py-1 rounded-full border border-[#E8D9CD]">
                    <LeafIcon size={13} className="text-[#1EBE5D]" />
                    100% Organic Henna
                  </span>
                </div>

                {/* H1 Heading */}
                <h1 className="font-serif-heading text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-[#261B16] leading-[1.12]">
                  {formatLocation(hero.title || siteSettings.name, siteSettings)}
                  <span className="block text-2xl sm:text-3xl md:text-4xl text-[#703D24] font-normal mt-2.5">
                    {formatLocation(
                      hero.highlightedTitle || `Professional Mehndi Artist in {city}`,
                      siteSettings
                    )}
                  </span>
                </h1>

                {/* Supporting text */}
                <p className="mt-5 text-base sm:text-lg text-[#58463D] leading-relaxed max-w-2xl font-normal">
                  {formatLocation(
                    hero.description ||
                      `Handcrafting elegant mehndi designs and personalized patterns tailored to your celebration across {city}.`,
                    siteSettings
                  )}
                </p>

                {/* Primary Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                  <WhatsAppButton
                    label={hero.primaryCtaText || 'Book Appointment'}
                    size="lg"
                    variant="whatsapp"
                    className="w-full sm:w-auto text-base"
                    phoneRaw={siteSettings.contact.whatsappPhoneRaw}
                  />
                  <Button
                    href="/mehndi-designs"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-base"
                  >
                    <span>{hero.secondaryCtaText || 'Explore Designs'}</span>
                    <ArrowRightIcon size={16} />
                  </Button>
                </div>

                {/* Location Callout */}
                <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-[#EADFD3] text-xs text-[#58463D] max-w-xl">
                  <span className="text-[#B95945] font-bold mt-0.5">•</span>
                  <p>
                    <strong>Available in {city}:</strong> Direct on-location artist travel across {city} and surrounding areas. Reserve your date directly via WhatsApp.
                  </p>
                </div>

                {/* Value Highlights */}
                <div className="mt-8 pt-6 border-t border-[#EADBCE] grid grid-cols-3 gap-4 w-full max-w-lg">
                  <div>
                    <div className="font-serif-heading text-xl sm:text-2xl font-bold text-[#4E2714]">
                      100%
                    </div>
                    <div className="text-xs text-[#847269] mt-0.5">Organic Henna</div>
                  </div>
                  <div>
                    <div className="font-serif-heading text-xl sm:text-2xl font-bold text-[#4E2714]">
                      Doorstep
                    </div>
                    <div className="text-xs text-[#847269] mt-0.5">Across {city}</div>
                  </div>
                  <div>
                    <div className="font-serif-heading text-xl sm:text-2xl font-bold text-[#4E2714]">
                      WhatsApp
                    </div>
                    <div className="text-xs text-[#847269] mt-0.5">Direct Booking</div>
                  </div>
                </div>
              </div>

              {/* Right Visual Column (5 cols) */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Main Hero Photo Card */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-[#F5ECE4]">
                    <Image
                      src={hero.imageUrl || '/images/hero-bride.jpg'}
                      alt={formatLocation(hero.imageAlt || `Bridal mehndi in {city}`, siteSettings)}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Caption Overlay */}
                    <div className="absolute bottom-6 inset-x-6 text-white">
                      <p className="text-[11px] uppercase tracking-widest text-[#F9F5EA] font-semibold">
                        Signature Bridal Couture
                      </p>
                      <p className="font-serif-heading text-xl sm:text-2xl font-medium mt-1">
                        Intricate Royal Palms & Lotus Motifs
                      </p>
                      <p className="text-xs text-white/80 mt-1">
                        Pure Rajasthani Sojat Stain • {city}
                      </p>
                    </div>
                  </div>

                  {/* Floating Experience Badge */}
                  <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-white rounded-2xl p-4 shadow-xl border border-[#EADFD3] max-w-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAFBF0] flex items-center justify-center text-[#1EBE5D] flex-shrink-0">
                      <ShieldCheckIcon size={22} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#261B16]">
                        Guaranteed Rich Dark Stain
                      </div>
                      <div className="text-[11px] text-[#847269]">
                        Chemical-free natural formula with aftercare balm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          2. SHORT INTRODUCTION SECTION
          ======================================================== */}
      {sections.about !== false && (
        <section className="py-16 sm:py-20 bg-white border-y border-[#EADFD3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Artist portrait */}
              <div className="lg:col-span-5 relative order-2 lg:order-1">
                <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-[#FAF3EE]">
                  <Image
                    src="/images/aayesha-portrait.jpg"
                    alt={`Aayesha - Professional Mehndi Artist in ${city}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Intro text */}
              <div className="lg:col-span-7 order-1 lg:order-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#B95945] mb-2 bg-[#F9EFEA] px-3 py-1 rounded-full border border-[#F2D7D0] inline-block">
                  Meet the Artist
                </span>

                <h2 className="font-serif-heading text-3xl sm:text-4xl md:text-5xl font-medium text-[#261B16] leading-tight mt-3">
                  “Every bride carries a story; I translate that romance into timeless henna.”
                </h2>

                <p className="mt-5 text-base text-[#58463D] leading-relaxed">
                  Hello, I am <strong>Aayesha</strong>, a dedicated professional mehndi artist based in {city}. To me, henna is not just a wedding ritual; it is a sacred botanical art form that celebrates new chapters, heritage, and feminine beauty.
                </p>

                <p className="mt-3.5 text-base text-[#58463D] leading-relaxed">
                  I formulate every batch of paste myself using 100% certified organic Rajasthani henna and therapeutic essential oils, guaranteeing safe skin contact and an unforgettable deep mahogany tone. Whether you are looking for royal heritage bridal sleeves or modern minimalist vines, I bring my art directly to your doorstep across {city}.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button href="/about" variant="primary" size="md">
                    Read My Journey
                  </Button>
                  <WhatsAppButton
                    phoneRaw={siteSettings.contact.whatsappPhoneRaw}
                    label="Chat with Aayesha"
                    size="md"
                    variant="outline"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          3. FEATURED MEHNDI DESIGNS
          ======================================================== */}
      {sections.designs !== false && (
        <section className="py-16 sm:py-24 bg-[#FCF9F4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <SectionHeading
                align="left"
                eyebrow="Curated Portfolio"
                title="Signature Mehndi Designs"
                description={`A glimpse of our most requested bridal, Arabic, and mandala collections crafted for ${city} celebrations.`}
              />
              <Button
                href="/mehndi-designs"
                variant="outline"
                size="md"
                className="self-start md:self-end"
              >
                <span>View All Designs</span>
                <ArrowRightIcon size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDesigns.map((design, idx) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  priority={idx === 0}
                  phoneRaw={siteSettings.contact.whatsappPhoneRaw}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          4. SERVICES OVERVIEW
          ======================================================== */}
      {sections.services !== false && (
        <section className="py-16 sm:py-24 bg-[#FAF6F0] border-y border-[#EADBCE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              eyebrow="Bespoke Packages"
              title={`Mehndi Services Tailored for ${city}`}
              description="From comprehensive full-arm bridal couture to lively sangeet parties, each package includes direct artist travel, organic cones, and complimentary aftercare."
              showMotif
            />

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  phoneRaw={siteSettings.contact.whatsappPhoneRaw}
                />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button href="/services" variant="primary" size="lg">
                Explore All Service Packages & Pricing Details
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          5. WHY CHOOSE AAYESHA
          ======================================================== */}
      {sections.whyChooseUs !== false && (
        <WhyChoose items={whyChooseItems} settings={siteSettings} />
      )}

      {/* ========================================================
          6. GALLERY PREVIEW
          ======================================================== */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <SectionHeading
              align="left"
              eyebrow="Visual Lookbook"
              title="Recent Henna Creations"
              description={`Moments captured from real brides and ceremonies across ${city}.`}
            />
            <Button
              href="/gallery"
              variant="outline"
              size="md"
              className="self-start md:self-end"
            >
              <span>View Full Gallery</span>
              <ArrowRightIcon size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewGallery.map((item, idx) => (
              <GalleryCard key={item.id} item={item} priority={idx < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          7. TESTIMONIALS PREVIEW
          ======================================================== */}
      {sections.testimonials !== false && (
        <section className="py-16 sm:py-24 bg-[#FCF9F4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              align="center"
              eyebrow="Bride Love"
              title={`Words from Our ${city} Brides`}
              description={`Genuine stories from brides and event hosts across ${city}.`}
              showMotif
            />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredReviews.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button href="/testimonials" variant="outline" size="md">
                Read More Client Stories
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          8. SERVICE-AREA SECTION
          ======================================================== */}
      <BangaloreBanner settings={siteSettings} phoneRaw={siteSettings.contact.whatsappPhoneRaw} />

      {/* ========================================================
          9. FAQ SECTION
          ======================================================== */}
      {sections.faq !== false && (
        <FaqSection faqs={faqs} settings={siteSettings} />
      )}

      {/* ========================================================
          10. STRONG WHATSAPP APPOINTMENT CTA
          ======================================================== */}
      {sections.contactCta !== false && (
        <CTASection
          phoneRaw={siteSettings.contact.whatsappPhoneRaw}
          emailAddress={siteSettings.contact.email}
        />
      )}
    </div>
  );
}
