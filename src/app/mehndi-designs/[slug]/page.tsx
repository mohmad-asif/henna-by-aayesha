import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getRelatedDesigns,
} from '@/data/designs';
import { fetchDesignBySlug, fetchDesigns, fetchSiteSettings } from '@/lib/supabase/data';
import { Badge } from '@/components/ui/badge';
import { LocationBadge } from '@/components/ui/location-badge';
import { DesignCard } from '@/components/cards/design-card';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { EmailButton } from '@/components/ui/email-button';
import {
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MapPinIcon,
} from '@/components/ui/icons';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';
import { TrackItemView } from '@/components/analytics/track-item-view';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const designs = await fetchDesigns();
  return designs.map((design) => ({
    slug: design.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [design, settings] = await Promise.all([
    fetchDesignBySlug(slug),
    fetchSiteSettings(),
  ]);

  const city = settings.location?.city || settings.contact.city;

  if (!design) {
    return {
      title: 'Design Not Found',
    };
  }

  const canonicalPath = `/mehndi-designs/${design.slug}`;
  const absoluteUrl = getCanonicalUrl(canonicalPath);
  const imageUrl = design.image.startsWith('http')
    ? design.image
    : `${getCanonicalUrl()}${design.image}`;

  return {
    title: `${design.title} | Bridal Mehndi in ${city}`,
    description: `${design.shortDescription} Handcrafted in ${city} using 100% natural organic henna cones. Doorstep appointments via WhatsApp.`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${design.title} | Bridal Mehndi in ${city}`,
      description: design.shortDescription,
      url: absoluteUrl,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 900,
          alt: `${design.title} - Bridal Mehndi in ${city} by ${settings.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${design.title} | ${settings.name} ${city}`,
      description: design.shortDescription,
      images: [imageUrl],
    },
  };
}

export default async function DesignDetailPage({ params }: Props) {
  const { slug } = await params;
  const [design, settings] = await Promise.all([
    fetchDesignBySlug(slug),
    fetchSiteSettings(),
  ]);

  if (!design) {
    notFound();
  }

  const city = settings.location?.city || settings.contact.city;
  const serviceAvailability =
    settings.location?.serviceAvailability ||
    settings.location?.availability ||
    `Available in ${city} Only`;

  const relatedDesigns = getRelatedDesigns(design.slug, 3);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Mehndi Designs', path: '/mehndi-designs' },
    { name: design.title, path: `/mehndi-designs/${design.slug}` },
  ]);

  return (
    <div className="bg-[#FCF9F4] min-h-screen pb-20">
      <TrackItemView type="design" slug={design.slug} title={design.title} category={design.category} />
      <JsonLd data={breadcrumbSchema} />
      {/* Breadcrumbs & Location Bar */}
      <div className="bg-[#FAF3EE] border-b border-[#EADFD3] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#847269]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#4E2714] transition-colors">
              Home
            </Link>
            <ChevronRightIcon size={12} />
            <Link href="/mehndi-designs" className="hover:text-[#4E2714] transition-colors">
              Mehndi Designs
            </Link>
            <ChevronRightIcon size={12} />
            <span className="text-[#4E2714] font-medium truncate max-w-xs">
              {design.title}
            </span>
          </nav>

          <LocationBadge label={serviceAvailability} size="sm" variant="accent" />
        </div>
      </div>

      {/* Main Showcase Section */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Column: Image (6 cols) */}
            <div className="lg:col-span-6">
              <div className="sticky top-28 space-y-4">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-[#F5ECE4]">
                  <Image
                    src={design.image}
                    alt={`${design.title} - ${design.categoryLabel} bridal mehndi design in ${city} by Aayesha`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                </div>

                {/* Guarantee Banner */}
                <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#EAFBF0] text-[#1EBE5D] flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon size={22} />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#261B16]">
                      100% Organic Henna Guarantee
                    </p>
                    <p className="text-[#847269]">
                      Chemical-free Rajasthani Sojat leaf paste • Rich mahogany stain within 48 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Design Info (6 cols) */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                {/* Category & Status */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="henna" size="md">
                    {design.categoryLabel}
                  </Badge>
                  {design.featured && (
                    <Badge variant="gold" size="md">
                      Signature Favorite
                    </Badge>
                  )}
                </div>

                {/* H1 Title */}
                <h1 className="font-serif-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-[#261B16] leading-tight">
                  {design.title}
                </h1>

                {/* Quick Spec Bar */}
                <div className="mt-5 p-4 rounded-2xl bg-white border border-[#EADBCE] grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5">
                    <ClockIcon size={18} className="text-[#B95945] flex-shrink-0" />
                    <div>
                      <div className="text-[11px] text-[#847269] uppercase font-medium">Estimated Time</div>
                      <div className="text-xs sm:text-sm font-semibold text-[#4E2714]">{design.estimatedDuration}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPinIcon size={18} className="text-[#C29B4D] flex-shrink-0" />
                    <div>
                      <div className="text-[11px] text-[#847269] uppercase font-medium">Service Location</div>
                      <div className="text-xs sm:text-sm font-semibold text-[#4E2714]">{city} Doorstep</div>
                    </div>
                  </div>
                </div>

                {/* Coverage description */}
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-[#FAF3EE] border border-[#EADBCE] text-xs text-[#703D24]">
                  <strong>Coverage:</strong> {design.coverage}
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#847269] mb-2">
                    Artistic Overview
                  </h2>
                  <p className="text-sm sm:text-base text-[#58463D] leading-relaxed">
                    {design.fullDescription}
                  </p>
                </div>

                {/* Ideal For */}
                <div className="mt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#847269] mb-3">
                    Ideal Occasions
                  </h2>
                  <ul className="space-y-2">
                    {design.idealFor.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#4E2714]">
                        <CheckCircleIcon size={15} className="text-[#C29B4D] flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {design.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#F5ECE4] text-[#703D24] px-3 py-1 rounded-full border border-[#E8D9CD]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Booking Action Box */}
              <div className="mt-10 p-6 rounded-3xl bg-white border border-[#E0D4C2] shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B95945]">
                    Appointments via WhatsApp Only
                  </span>
                  <span className="text-xs text-[#847269]">
                    {city} Service Coverage
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#58463D] mb-5">
                  Ready to book this design for your upcoming celebration? Connect directly with Aayesha on WhatsApp to confirm date availability and obtain package pricing.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <WhatsAppButton
                    message={`Hi Aayesha, I would like to book this mehndi design.\n\nDesign: ${design.title}\n\nPlease let me know the availability and details.`}
                    phoneRaw={settings.contact.whatsappPhoneRaw}
                    label="Book This Design on WhatsApp"
                    size="lg"
                    variant="whatsapp"
                    fullWidth
                  />
                  <WhatsAppButton
                    message={`Hi Aayesha, I found this mehndi design on your website and would like to know more about it.\n\nDesign: ${design.title}`}
                    phoneRaw={settings.contact.whatsappPhoneRaw}
                    label="Ask About Design"
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  />
                  <EmailButton
                    emailAddress={settings.contact.email}
                    subject={`Inquiry: ${design.title} (${city})`}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Designs */}
      {relatedDesigns.length > 0 && (
        <section className="py-14 sm:py-20 border-t border-[#EADBCE] bg-[#FAF6F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B95945]">
                  More Inspiration
                </span>
                <h2 className="font-serif-heading text-2xl sm:text-3xl font-semibold text-[#261B16] mt-1">
                  You May Also Like
                </h2>
              </div>
              <Link
                href="/mehndi-designs"
                className="text-xs font-semibold text-[#4E2714] hover:text-[#B95945] transition-colors"
              >
                View Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedDesigns.map((related) => (
                <DesignCard
                  key={related.id}
                  design={related}
                  phoneRaw={settings.contact.whatsappPhoneRaw}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


