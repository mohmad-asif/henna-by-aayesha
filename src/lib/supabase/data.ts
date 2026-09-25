import { createClient as createServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/config/site';
import { normalizeWhatsAppPhone, normalizeInstagram } from '@/lib/settings/contact';
import { formatLocation } from '@/lib/settings/location';
import {
  getExtendedSiteSettings,
  getFaqs,
  getWhyChooseUs,
} from '@/lib/supabase/extended-settings';
import { mehndiDesigns } from '@/data/designs';
import { servicesData } from '@/data/services';
import { galleryItems } from '@/data/gallery';
import { testimonialsData } from '@/data/testimonials';
import {
  DbSiteSettings,
  DbDesign,
  DbService,
  DbGallery,
  DbTestimonial,
} from '@/types/database';
import {
  MehndiDesign,
  ServicePackage,
  GalleryItem,
  Testimonial,
  SiteConfig,
  DesignCategory,
  FaqItem,
  WhyChooseUsItem,
} from '@/types';

/**
 * Fetch complete dynamic site settings, combining core site_settings
 * with extended settings (location, hero, section toggles, SEO, social, promo, maintenance).
 */
export async function fetchSiteSettings(): Promise<SiteConfig> {
  try {
    const supabase = await createServerClient();
    const [coreRes, extended] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      getExtendedSiteSettings(),
    ]);

    const s = (coreRes.data as DbSiteSettings) || null;
    const phone = s
      ? normalizeWhatsAppPhone(s.whatsapp_raw || s.whatsapp_number)
      : normalizeWhatsAppPhone(siteConfig.contact.whatsappPhoneRaw);
    const insta = s ? normalizeInstagram(s.instagram_url) : normalizeInstagram(siteConfig.contact.instagramUrl);

    const activeNavLinks =
      extended.navigation && extended.navigation.length > 0
        ? extended.navigation
            .filter((n) => n.enabled)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((n) => ({ name: n.label, href: n.url }))
        : siteConfig.navLinks;

    return {
      name: s?.business_name || siteConfig.name,
      tagline: s?.tagline || siteConfig.tagline,
      description: s?.short_description || siteConfig.description,
      url: s?.website_url || siteConfig.url,
      contact: {
        whatsappDisplayNumber: phone.display,
        whatsappPhoneRaw: phone.raw,
        whatsappDefaultMessage: s?.whatsapp_message || siteConfig.contact.whatsappDefaultMessage,
        email: s?.email || siteConfig.contact.email,
        instagramHandle: insta.displayHandle,
        instagramUrl: insta.url,
        city: extended.location.city,
        state: extended.location.state,
        country: extended.location.country,
        serviceNotice: extended.location.serviceAvailability,
        operatingHours: extended.location.operatingHours,
      },
      navLinks: activeNavLinks,
      location: extended.location,
      hero: extended.hero,
      sections: extended.sections,
      socialLinks: extended.socialLinks,
      navigation: extended.navigation,
      footer: extended.footer,
      promo: extended.promo,
      seo: extended.seo,
      maintenanceMode: extended.maintenanceMode,
    };
  } catch {
    const extended = await getExtendedSiteSettings();
    return {
      ...siteConfig,
      location: extended.location,
      hero: extended.hero,
      sections: extended.sections,
      socialLinks: extended.socialLinks,
      navigation: extended.navigation,
      footer: extended.footer,
      promo: extended.promo,
      seo: extended.seo,
      maintenanceMode: extended.maintenanceMode,
    };
  }
}

/**
 * Fetch all active mehndi designs from Supabase, falling back to default designs.
 */
export async function fetchDesigns(): Promise<MehndiDesign[]> {
  try {
    const supabase = await createServerClient();
    const [designsRes, extended] = await Promise.all([
      supabase
        .from('mehndi_designs')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true }),
      getExtendedSiteSettings(),
    ]);

    if (designsRes.error || !designsRes.data || designsRes.data.length === 0) {
      return mehndiDesigns.map((d) => ({
        ...d,
        idealFor: d.idealFor.map((item) => formatLocation(item, { location: extended.location })),
        tags: d.tags.map((tag) => formatLocation(tag, { location: extended.location })),
      }));
    }

    return (designsRes.data as DbDesign[]).map((d) => {
      const categoryLower = d.category.toLowerCase() as DesignCategory;
      return {
        id: d.id,
        slug: d.slug,
        title: d.title,
        category: categoryLower,
        categoryLabel: d.category,
        shortDescription: d.description || '',
        fullDescription: d.description || '',
        idealFor: ['Bridal Ceremonies', `Celebrations in ${extended.location.city}`],
        estimatedDuration: '2 - 5 hours',
        coverage: 'Full Palms & Wrists',
        tags: [d.category, `${extended.location.city} Henna`],
        image: d.image,
        featured: d.featured,
      };
    });
  } catch {
    return mehndiDesigns;
  }
}

/**
 * Fetch single design by slug with slug sanitization and unpublished protection
 */
export async function fetchDesignBySlug(slug: string): Promise<MehndiDesign | undefined> {
  // Slug security: strictly validate format to prevent path traversal or malformed input
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9_-]+$/i.test(slug)) {
    return undefined;
  }

  try {
    const supabase = await createServerClient();
    const [designRes, extended] = await Promise.all([
      supabase
        .from('mehndi_designs')
        .select('*')
        .eq('slug', slug)
        .maybeSingle(),
      getExtendedSiteSettings(),
    ]);

    if (!designRes.error) {
      if (designRes.data) {
        // If explicitly inactive/unpublished, reject access (triggers proper 404)
        if (!designRes.data.active) {
          return undefined;
        }

        const d = designRes.data as DbDesign;
        const categoryLower = d.category.toLowerCase() as DesignCategory;
        return {
          id: d.id,
          slug: d.slug,
          title: d.title,
          category: categoryLower,
          categoryLabel: d.category,
          shortDescription: d.description || '',
          fullDescription: d.description || '',
          idealFor: ['Bridal Ceremonies', `${extended.location.city} Celebrations`],
          estimatedDuration: '2 - 5 hours',
          coverage: 'Full Palms & Wrists',
          tags: [d.category, `${extended.location.city} Henna`],
          image: d.image,
          featured: d.featured,
        };
      } else {
        return undefined;
      }
    }

    const staticMatch = mehndiDesigns.find((d) => d.slug === slug);
    if (staticMatch) {
      return {
        ...staticMatch,
        idealFor: staticMatch.idealFor.map((item) => formatLocation(item, { location: extended.location })),
        tags: staticMatch.tags.map((tag) => formatLocation(tag, { location: extended.location })),
      };
    }
    return undefined;
  } catch {
    return mehndiDesigns.find((d) => d.slug === slug);
  }
}

/**
 * Fetch active services from Supabase with dynamic location
 */
export async function fetchServices(): Promise<ServicePackage[]> {
  try {
    const supabase = await createServerClient();
    const [servicesRes, extended] = await Promise.all([
      supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true }),
      getExtendedSiteSettings(),
    ]);

    if (servicesRes.error || !servicesRes.data || servicesRes.data.length === 0) {
      return servicesData.map((s) => ({
        ...s,
        subtitle: formatLocation(s.subtitle, { location: extended.location }),
        idealFor: formatLocation(s.idealFor, { location: extended.location }),
        features: s.features.map((f) => formatLocation(f, { location: extended.location })),
        bangaloreTravel: `Direct artist travel anywhere in ${extended.location.city}`,
      }));
    }

    return (servicesRes.data as DbService[]).map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      subtitle: s.short_description || s.duration_text || `Bespoke ${extended.location.city} Package`,
      category: 'bridal',
      description: s.description || s.short_description || '',
      duration: s.duration_text || '3 - 6 hours',
      idealFor: `${extended.location.city} brides & festive events`,
      features: [
        '100% natural organic Sojat henna cones',
        `Direct on-location travel across ${extended.location.city}`,
        'Complimentary lemon-sugar seal & herbal aftercare kit',
      ],
      bangaloreTravel: `Direct artist travel anywhere in ${extended.location.city}`,
      recommendedForBridal: s.featured,
      image: s.image || '/images/hero-bride.jpg',
      priceText: s.price_text || undefined,
    }));
  } catch {
    return servicesData;
  }
}

/**
 * Fetch active gallery items from Supabase
 */
export async function fetchGallery(): Promise<GalleryItem[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return galleryItems;
    }

    return (data as DbGallery[]).map((g) => ({
      id: g.id,
      title: g.title,
      category: 'bridal',
      categoryLabel: g.category || 'Henna Art',
      image: g.image,
      caption: g.alt_text || g.title,
    }));
  } catch {
    return galleryItems;
  }
}

/**
 * Fetch active testimonials from Supabase with dynamic location
 */
export async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createServerClient();
    const [testRes, extended] = await Promise.all([
      supabase
        .from('testimonials')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true }),
      getExtendedSiteSettings(),
    ]);

    if (testRes.error || !testRes.data || testRes.data.length === 0) {
      return testimonialsData.map((t) => ({
        ...t,
        bangaloreArea: formatLocation(t.bangaloreArea, { location: extended.location }),
        quote: formatLocation(t.quote, { location: extended.location }),
      }));
    }

    return (testRes.data as DbTestimonial[]).map((t) => ({
      id: t.id,
      clientName: t.customer_name,
      eventType: 'Bridal Mehndi',
      bangaloreArea: t.image ? formatLocation(t.image, { location: extended.location }) : `${extended.location.city}, ${extended.location.state}`,
      quote: formatLocation(t.review, { location: extended.location }),
      rating: t.rating || 5,
      weddingDate: 'Verified Client',
      verifiedBride: true,
      featured: t.featured,
    }));
  } catch {
    return testimonialsData;
  }
}

/**
 * Fetch FAQs dynamically from Supabase
 */
export async function fetchFaqs(includeUnpublished = false): Promise<FaqItem[]> {
  return getFaqs(includeUnpublished);
}

/**
 * Fetch Why Choose Us items dynamically from Supabase
 */
export async function fetchWhyChooseUs(includeUnpublished = false): Promise<WhyChooseUsItem[]> {
  return getWhyChooseUs(includeUnpublished);
}


