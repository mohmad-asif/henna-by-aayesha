import React from 'react';
import type { Metadata } from 'next';
import { fetchGallery, fetchSiteSettings } from '@/lib/supabase/data';
import { GalleryClient } from '@/components/gallery/gallery-client';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export const metadata: Metadata = {
  title: 'Mehndi Gallery & Lookbook Bangalore',
  description:
    'A curated lookbook of exquisite bridal, Arabic, and festive henna creations by Aayesha across Bangalore / Bengaluru.',
  alternates: {
    canonical: '/gallery',
  },
  openGraph: {
    title: 'Mehndi Gallery & Lookbook Bangalore | Henna by Aayesha',
    description:
      'A curated lookbook of exquisite bridal, Arabic, and festive henna creations by Aayesha across Bangalore / Bengaluru.',
    url: getCanonicalUrl('/gallery'),
    type: 'website',
    images: [
      {
        url: '/images/hero-bride.jpg',
        width: 1200,
        height: 900,
        alt: 'Mehndi Gallery Bangalore - Henna by Aayesha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mehndi Gallery & Lookbook Bangalore | Henna by Aayesha',
    description:
      'Curated bridal and festival mehndi lookbook from real clients in Bangalore.',
    images: ['/images/hero-bride.jpg'],
  },
};

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([
    fetchGallery(),
    fetchSiteSettings(),
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Gallery', path: '/gallery' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <GalleryClient initialItems={items} settings={settings} />
    </>
  );
}
