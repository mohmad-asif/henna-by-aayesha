import React from 'react';
import { SiteConfig, ServicePackage, Testimonial } from '@/types';
import { getCanonicalUrl } from '@/config/site';

/**
 * Renders a script tag with JSON-LD structured data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Builds standard WebSite structured data
 */
export function generateWebSiteSchema(settings: SiteConfig) {
  const baseUrl = getCanonicalUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: settings.name,
    url: baseUrl,
    description: settings.description,
    inLanguage: 'en-IN',
  };
}

/**
 * Builds LocalBusiness structured data strictly using real information available from Supabase/config.
 * Does not invent street addresses, opening hours, or fake reviews.
 */
export function generateLocalBusinessSchema(
  settings: SiteConfig,
  testimonials?: Testimonial[]
) {
  const baseUrl = getCanonicalUrl();

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${baseUrl}/#localbusiness`,
    name: settings.name,
    alternateName: 'Henna by Aayesha Bangalore',
    url: baseUrl,
    image: `${baseUrl}/images/hero-bride.jpg`,
    description: settings.description,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Bangalore',
      },
      {
        '@type': 'City',
        name: 'Bengaluru',
      },
    ],
    knowsAbout: [
      'Bridal Mehndi',
      'Arabic Mehndi',
      'Henna Art',
      'Traditional Rajasthani Henna',
      'Organic Henna',
    ],
  };

  // Only include phone/WhatsApp if provided
  if (settings.contact?.whatsappDisplayNumber) {
    schema.telephone = settings.contact.whatsappDisplayNumber;
  }

  // Only include email if provided
  if (settings.contact?.email) {
    schema.email = settings.contact.email;
  }

  // Only include verified social links if provided
  const sameAs: string[] = [];
  if (settings.contact?.instagramUrl) {
    sameAs.push(settings.contact.instagramUrl);
  }
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  // Include reviews ONLY if genuine testimonials exist in Supabase
  if (testimonials && testimonials.length > 0) {
    schema.review = testimonials.map((t) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: t.clientName,
      },
      reviewBody: t.quote,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: t.rating || 5,
        bestRating: 5,
        worstRating: 1,
      },
    }));

    const avgRating = (
      testimonials.reduce((acc, t) => acc + (t.rating || 5), 0) / testimonials.length
    ).toFixed(1);

    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: testimonials.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Builds BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

/**
 * Builds Service structured data for bridal & mehndi packages
 */
export function generateServiceSchema(service: ServicePackage, settings: SiteConfig) {
  const baseUrl = getCanonicalUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'ProfessionalService',
      name: settings.name,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'City',
      name: 'Bangalore',
      alternateName: 'Bengaluru',
    },
    serviceType: 'Mehndi & Bridal Henna',
    termsOfService: `${baseUrl}/terms`,
  };
}
