import React from 'react';
import type { Metadata } from 'next';
import { fetchDesigns, fetchSiteSettings } from '@/lib/supabase/data';
import { DesignsCatalog } from '@/components/designs/designs-catalog';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';
import { formatLocation } from '@/lib/settings/location';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const city = settings.location?.city || settings.contact.city;

  const title = settings.seo?.designsTitle
    ? formatLocation(settings.seo.designsTitle, settings)
    : `Mehndi Designs in ${city} | Bridal, Arabic & Lotus Henna`;

  const description = settings.seo?.designsDescription
    ? formatLocation(settings.seo.designsDescription, settings)
    : `Browse our curated collection of bridal mehndi couture, modern Arabic trails, and intricate lotus mandalas in ${city}. 100% natural organic henna.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/mehndi-designs',
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl('/mehndi-designs'),
      type: 'website',
      images: [
        {
          url: '/images/hero-bride.jpg',
          width: 1200,
          height: 900,
          alt: `Mehndi Designs in ${city} - ${settings.name}`,
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

export default async function MehndiDesignsPage() {
  const [designs, settings] = await Promise.all([
    fetchDesigns(),
    fetchSiteSettings(),
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Mehndi Designs', path: '/mehndi-designs' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <DesignsCatalog initialDesigns={designs} settings={settings} />
    </>
  );
}
