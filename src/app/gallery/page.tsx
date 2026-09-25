import React from 'react';
import type { Metadata } from 'next';
import { fetchGallery, fetchSiteSettings } from '@/lib/supabase/data';
import { GalleryClient } from '@/components/gallery/gallery-client';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/schema';
import { getCanonicalUrl } from '@/config/site';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const city = settings.location?.city || settings.contact.city;

  const title = `Mehndi Gallery & Lookbook in ${city} | ${settings.name}`;
  const description = `A curated lookbook of exquisite bridal, Arabic, and festive henna creations by Aayesha across ${city}.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/gallery',
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl('/gallery'),
      type: 'website',
      images: [
        {
          url: '/images/hero-bride.jpg',
          width: 1200,
          height: 900,
          alt: `Mehndi Gallery ${city} - ${settings.name}`,
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
