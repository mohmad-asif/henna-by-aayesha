import React from 'react';
import type { Metadata } from 'next';
import { fetchSiteSettings } from '@/lib/supabase/data';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { EmailButton } from '@/components/ui/email-button';
import { BangaloreBanner } from '@/components/sections/bangalore-banner';
import {
  WhatsAppIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  InstagramIcon,
  ExternalLinkIcon,
} from '@/components/ui/icons';
import { CTASection } from '@/components/sections/cta-section';

import { JsonLd, generateBreadcrumbSchema, generateLocalBusinessSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export const metadata: Metadata = {
  title: 'Contact & WhatsApp Appointments in Bangalore',
  description:
    'Book your mehndi appointment with Aayesha in Bangalore exclusively via WhatsApp. Check availability, on-location travel details, and contact information.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact & WhatsApp Appointments | Henna by Aayesha Bangalore',
    description:
      'Book your mehndi appointment with Aayesha in Bangalore exclusively via WhatsApp. Check availability, on-location travel details, and contact information.',
    url: getCanonicalUrl('/contact'),
    type: 'website',
    images: [
      {
        url: '/images/hero-bride.jpg',
        width: 1200,
        height: 900,
        alt: 'Contact Henna by Aayesha - Mehndi Artist in Bangalore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Henna by Aayesha Bangalore',
    description:
      'Reserve your bridal or festive henna session in Bangalore directly via WhatsApp.',
    images: ['/images/hero-bride.jpg'],
  },
};

export default async function ContactPage() {
  const settings = await fetchSiteSettings();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact' },
  ]);
  const businessSchema = generateLocalBusinessSchema(settings);

  return (
    <div>
      <JsonLd data={[breadcrumbSchema, businessSchema]} />
      {/* Page Header */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF3EE] to-[#FCF9F4] border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex mb-4">
            <LocationBadge label="Bangalore / Bengaluru Service Area Only" variant="accent" />
          </div>

          <SectionHeading
            as="h1"
            eyebrow="Connect With Aayesha"
            title="Book Mehndi Appointments in Bangalore"
            description="To ensure personal attention and immediate coordination, all appointments across Bengaluru are managed directly via WhatsApp."
            align="center"
            showMotif
          />
        </div>
      </section>

      {/* Main Contact Grid */}
      <section className="py-16 sm:py-24 bg-[#FCF9F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Channel: WhatsApp Card (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border-2 border-[#25D366]/40 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#25D366] text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                Fastest Response
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#EAFBF0] flex items-center justify-center text-[#25D366] flex-shrink-0">
                  <WhatsAppIcon size={32} />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#1EBE5D]">
                    Official Booking Channel
                  </span>
                  <h2 className="font-serif-heading text-2xl sm:text-3xl font-semibold text-[#261B16]">
                    WhatsApp Direct Chat
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#58463D] leading-relaxed">
                Connect directly with Aayesha on WhatsApp. Whether you need a quick quote for bridal henna or want to check date availability, this is the quickest way to get in touch.
              </p>

              {/* Centralized Number Callout */}
              <div className="mt-6 p-4 rounded-2xl bg-[#FAF6F0] border border-[#EADBCE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#847269] block">WhatsApp Number:</span>
                  <span className="font-semibold text-lg text-[#4E2714]">
                    {settings.contact.whatsappDisplayNumber}
                  </span>
                </div>
                <div className="text-xs text-[#703D24]">
                  Response within a few hours
                </div>
              </div>

              {/* What to include list */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#847269] mb-3">
                  What to include when you message us:
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#4E2714]">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-[#1EBE5D] flex-shrink-0" />
                    <span>Your preferred event / wedding date and approximate time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-[#1EBE5D] flex-shrink-0" />
                    <span>Service required (Bridal, Sangeet group, Engagement, or Studio)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-[#1EBE5D] flex-shrink-0" />
                    <span>Location / venue neighborhood in Bangalore</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#F0E5D8]">
                <WhatsAppButton
                  phoneRaw={settings.contact.whatsappPhoneRaw}
                  label="Start WhatsApp Chat Now"
                  size="lg"
                  variant="whatsapp"
                  fullWidth
                />
              </div>
            </div>

            {/* Secondary Channel & Information (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Email Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF3EE] flex items-center justify-center text-[#B95945]">
                    <MailIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                      Email Inquiries
                    </h3>
                    <p className="text-xs text-[#847269]">
                      For bridal event planners, media, & formal quotes
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#58463D] leading-relaxed mb-4">
                  Send us an email with detailed event timelines, vendor requirements, or collaboration inquiries.
                </p>

                <div className="mb-5 p-3 rounded-xl bg-[#FAF6F0] border border-[#EADBCE] text-xs font-semibold text-[#4E2714] truncate">
                  {settings.contact.email}
                </div>

                <EmailButton
                  emailAddress={settings.contact.email}
                  label="Compose Email"
                  size="md"
                  variant="outline"
                  fullWidth
                />
              </div>

              {/* Social Channels Card */}
              {settings.contact.instagramUrl && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FDF2F4] flex items-center justify-center text-[#E1306C]">
                      <InstagramIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                        Instagram Portfolio
                      </h3>
                      <p className="text-xs text-[#847269]">
                        Real wedding videos & latest Bangalore client work
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#58463D] leading-relaxed mb-4">
                    Follow along for behind-the-scenes cone mixing, stain evolution reels, and live Bangalore bride transformations.
                  </p>
                  <a
                    href={settings.contact.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full p-3.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE4] border border-[#EADBCE] text-xs font-semibold text-[#4E2714] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <InstagramIcon size={16} className="text-[#E1306C]" />
                      <span>{settings.contact.instagramHandle || '@hennabyaayesha'}</span>
                    </span>
                    <ExternalLinkIcon size={14} className="text-[#847269]" />
                  </a>
                </div>
              )}

              {/* Operating Info Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-4">
                <div className="flex items-start gap-3.5">
                  <ClockIcon size={20} className="text-[#C29B4D] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
                      Operating Hours
                    </h3>
                    <p className="text-sm font-medium text-[#261B16] mt-0.5">
                      {settings.contact.operatingHours}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 border-t border-[#F5ECE4] pt-4">
                  <MapPinIcon size={20} className="text-[#B95945] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
                      Bangalore Exclusive Policy
                    </h3>
                    <p className="text-xs text-[#58463D] mt-0.5 leading-relaxed">
                      {settings.contact.serviceNotice} Direct on-location artist travel across all zones in Bengaluru.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bangalore Neighborhoods Banner */}
      <BangaloreBanner phoneRaw={settings.contact.whatsappPhoneRaw} />

      {/* WhatsApp & Email CTA Section */}
      <CTASection
        phoneRaw={settings.contact.whatsappPhoneRaw}
        emailAddress={settings.contact.email}
        title="Ready to Reserve Your Bangalore Mehndi Date?"
        description="Reach out directly on WhatsApp with your date and venue to check artist availability."
      />
    </div>
  );
}

