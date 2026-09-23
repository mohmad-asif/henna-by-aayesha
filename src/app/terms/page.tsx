import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';

import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Service terms, appointment guidelines, organic henna advisories, and Bangalore travel policies for Henna by Aayesha.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Service | Henna by Aayesha Bangalore',
    description:
      'Service terms, appointment guidelines, organic henna advisories, and Bangalore travel policies for Henna by Aayesha.',
    url: getCanonicalUrl('/terms'),
    type: 'website',
  },
};

export default function TermsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Terms of Service', path: '/terms' },
  ]);

  return (
    <div className="bg-[#FCF9F4] min-h-screen py-16 sm:py-24">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex mb-4">
            <LocationBadge label="Bangalore / Bengaluru Exclusive Service" variant="accent" />
          </div>
          <SectionHeading
            as="h1"
            eyebrow="Service Guidelines"
            title="Terms of Service"
            description="Clear expectations regarding booking, Bangalore travel, appointment logistics, and natural henna care."
            align="center"
            showMotif
          />
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EADFD3] shadow-xs space-y-8 text-[#58463D] leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              1. Bangalore Geographic Availability
            </h2>
            <p>
              Henna by Aayesha provides direct, on-location bridal and event mehndi services strictly within the Bangalore (Bengaluru) metropolitan region. Travel to wedding venues, residences, or hotels outside Bangalore requires special mutual agreement coordinated well in advance on WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              2. WhatsApp Appointment Scheduling
            </h2>
            <p>
              All bookings, date reserves, and package customisations must be finalized directly via WhatsApp communication with Aayesha. An inquiry does not constitute a guaranteed date reservation until mutually confirmed via chat.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              3. 100% Organic Henna & Skin Safety
            </h2>
            <p>
              We formulate all cones exclusively using triple-sifted organic Sojat henna leaves, essential oils (eucalyptus, cajeput, lavender), and sugar. We strictly refuse the use of chemical black cones, PPD, or toxic dyes. While pure natural henna is gentle, individuals with severe citrus or botanical essential oil allergies should request a patch test prior to their bridal appointment.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              4. Stain Results & Aftercare
            </h2>
            <p>
              Natural organic henna requires 24 to 48 hours to oxidize into its full, rich mahogany stain. Proper stain development depends upon client compliance with recommended aftercare protocols (keeping the paste dry for 6–8 hours, avoiding immediate soapy water contact, and applying aftercare balm). We provide complimentary aftercare instructions with every appointment.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              5. Questions & Consultation
            </h2>
            <p>
              For any questions regarding dates, packages, or specific bridal styling requirements, please visit our{' '}
              <Link href="/contact" className="text-[#B95945] font-semibold underline">
                contact page
              </Link>{' '}
              or chat directly with Aayesha on WhatsApp.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
