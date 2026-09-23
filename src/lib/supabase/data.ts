import { createClient as createServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/config/site';
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
} from '@/types';

/**
 * Fetch site settings from Supabase, falling back to static siteConfig if database
 * table is unavailable or empty.
 */
export async function fetchSiteSettings(): Promise<SiteConfig> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return siteConfig;
    }

    const s = data as DbSiteSettings;
    return {
      name: s.business_name || siteConfig.name,
      tagline: s.tagline || siteConfig.tagline,
      description: s.short_description || siteConfig.description,
      url: s.website_url || siteConfig.url,
      contact: {
        whatsappDisplayNumber: s.whatsapp_number || siteConfig.contact.whatsappDisplayNumber,
        whatsappPhoneRaw: s.whatsapp_raw || siteConfig.contact.whatsappPhoneRaw,
        whatsappDefaultMessage: s.whatsapp_message || siteConfig.contact.whatsappDefaultMessage,
        email: s.email || siteConfig.contact.email,
        instagramHandle: s.instagram_url ? '@hennabyaayesha' : siteConfig.contact.instagramHandle,
        instagramUrl: s.instagram_url || siteConfig.contact.instagramUrl,
        city: siteConfig.contact.city,
        state: siteConfig.contact.state,
        country: siteConfig.contact.country,
        serviceNotice: siteConfig.contact.serviceNotice,
        operatingHours: siteConfig.contact.operatingHours,
      },
      navLinks: siteConfig.navLinks,
    };
  } catch {
    return siteConfig;
  }
}

/**
 * Fetch all active mehndi designs from Supabase, falling back to default designs.
 */
export async function fetchDesigns(): Promise<MehndiDesign[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('mehndi_designs')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return mehndiDesigns;
    }

    return (data as DbDesign[]).map((d) => {
      const categoryLower = d.category.toLowerCase() as DesignCategory;
      return {
        id: d.id,
        slug: d.slug,
        title: d.title,
        category: categoryLower,
        categoryLabel: d.category,
        shortDescription: d.description || '',
        fullDescription: d.description || '',
        idealFor: ['Bridal Ceremonies', 'Celebrations in Bangalore'],
        estimatedDuration: '2 - 5 hours',
        coverage: 'Full Palms & Wrists',
        tags: [d.category, 'Bangalore Henna'],
        image: d.image,
        featured: d.featured,
      };
    });
  } catch {
    return mehndiDesigns;
  }
}

/**
 * Fetch single design by slug
 */
export async function fetchDesignBySlug(slug: string): Promise<MehndiDesign | undefined> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('mehndi_designs')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (error || !data) {
      return mehndiDesigns.find((d) => d.slug === slug);
    }

    const d = data as DbDesign;
    const categoryLower = d.category.toLowerCase() as DesignCategory;
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: categoryLower,
      categoryLabel: d.category,
      shortDescription: d.description || '',
      fullDescription: d.description || '',
      idealFor: ['Bridal Ceremonies', 'Bangalore Celebrations'],
      estimatedDuration: '2 - 5 hours',
      coverage: 'Full Palms & Wrists',
      tags: [d.category, 'Bangalore Henna'],
      image: d.image,
      featured: d.featured,
    };
  } catch {
    return mehndiDesigns.find((d) => d.slug === slug);
  }
}

/**
 * Fetch active services from Supabase
 */
export async function fetchServices(): Promise<ServicePackage[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return servicesData;
    }

    return (data as DbService[]).map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      subtitle: s.short_description || s.duration_text || 'Bespoke Bangalore Package',
      category: 'bridal',
      description: s.description || s.short_description || '',
      duration: s.duration_text || '3 - 6 hours',
      idealFor: 'Bangalore brides & festive events',
      features: [
        '100% natural organic Sojat henna cones',
        'Direct on-location travel across Bangalore',
        'Complimentary lemon-sugar seal & herbal aftercare kit',
      ],
      bangaloreTravel: 'Direct artist travel anywhere in Bangalore',
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
 * Fetch active testimonials from Supabase
 */
export async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return testimonialsData;
    }

    return (data as DbTestimonial[]).map((t) => ({
      id: t.id,
      clientName: t.customer_name,
      eventType: 'Bridal Mehndi',
      bangaloreArea: t.image || 'Bangalore, India',
      quote: t.review,
      rating: t.rating || 5,
      weddingDate: 'Verified Client',
      verifiedBride: true,
      featured: t.featured,
    }));
  } catch {
    return testimonialsData;
  }
}

