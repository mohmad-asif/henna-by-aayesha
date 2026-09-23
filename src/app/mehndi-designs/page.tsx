import React from 'react';
import type { Metadata } from 'next';
import { fetchDesigns, fetchSiteSettings } from '@/lib/supabase/data';
import { DesignsCatalog } from '@/components/designs/designs-catalog';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export const metadata: Metadata = {
  title: 'Mehndi Designs Bangalore | Bridal, Arabic & Lotus Henna',
  description:
    'Browse our curated collection of bridal mehndi couture, modern Arabic trails, and intricate lotus mandalas in Bangalore. 100% natural organic henna.',
  alternates: {
    canonical: '/mehndi-designs',
  },
  openGraph: {
    title: 'Mehndi Designs Bangalore | Bridal, Arabic & Lotus Henna',
    description:
      'Browse our curated collection of bridal mehndi couture, modern Arabic trails, and intricate lotus mandalas in Bangalore. 100% natural organic henna.',
    url: getCanonicalUrl('/mehndi-designs'),
    type: 'website',
    images: [
      {
        url: '/images/hero-bride.jpg',
        width: 1200,
        height: 900,
        alt: 'Mehndi Designs Bangalore - Henna by Aayesha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mehndi Designs Bangalore | Henna by Aayesha',
    description:
      'Explore bridal, Arabic, and traditional mehndi patterns in Bangalore. Handcrafted with organic henna.',
    images: ['/images/hero-bride.jpg'],
  },
};

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
