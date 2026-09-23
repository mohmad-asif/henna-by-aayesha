import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';

import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Our privacy commitment regarding client information, WhatsApp communication, and photo releases for Henna by Aayesha in Bangalore.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Henna by Aayesha Bangalore',
    description:
      'Our privacy commitment regarding client information, WhatsApp communication, and photo releases for Henna by Aayesha in Bangalore.',
    url: getCanonicalUrl('/privacy'),
    type: 'website',
  },
};

export default function PrivacyPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Privacy Policy', path: '/privacy' },
  ]);

  return (
    <div className="bg-[#FCF9F4] min-h-screen py-16 sm:py-24">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex mb-4">
            <LocationBadge label="Bangalore / Bengaluru Operations" variant="accent" />
          </div>
          <SectionHeading
            as="h1"
            eyebrow="Legal & Trust"
            title="Privacy Policy"
            description="Your trust is paramount. Learn how we handle your event details, communication, and photography."
            align="center"
            showMotif
          />
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EADFD3] shadow-xs space-y-8 text-[#58463D] leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              1. WhatsApp Booking & Communication
            </h2>
            <p>
              Henna by Aayesha manages all appointment requests and customer communications directly through WhatsApp. We do not maintain an automated online booking form or collect sensitive payment information on this website. Any personal information you provide over WhatsApp (such as your name, contact phone number, event date, and Bangalore venue address) is utilized exclusively to schedule and fulfill your mehndi appointment.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              2. Data Protection & Confidentiality
            </h2>
            <p>
              We treat all client discussions, bridal itineraries, and residential locations across Bangalore with complete confidentiality. We do not sell, rent, or distribute your phone number or email address to third-party advertisers or marketers under any circumstances.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              3. Photography & Social Media Release
            </h2>
            <p>
              Photographs of henna designs hand-drawn by Aayesha may be taken during or after application for our portfolio and social media showcasing. We always respect our clients’ comfort: if you prefer that your bridal portraits, face, or names not be displayed publicly, simply notify us in advance via WhatsApp, and we will honor your request completely.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              4. Website Cookies & Analytics
            </h2>
            <p>
              This website is designed for optimal performance and does not employ intrusive tracking cookies or third-party ad profiling. Standard server logs and privacy-preserving metrics may be collected solely to maintain technical stability and ensure responsive design across devices.
            </p>
          </section>

          <section>
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16] mb-3">
              5. Contact Us
            </h2>
            <p>
              If you have any questions regarding this Privacy Policy, feel free to reach out via{' '}
              <Link href="/contact" className="text-[#B95945] font-semibold underline">
                our contact page
              </Link>{' '}
              or message us directly on WhatsApp.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
