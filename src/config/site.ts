import { SiteConfig } from '@/types';

/**
 * Centralized Site and Contact Architecture
 *
 * NOTE: This configuration acts as the single source of truth for the entire application.
 * In a future phase, these values will be hydrated from the Supabase `site_settings` table
 * managed via the Admin Panel without requiring code modifications across components.
 */
export const siteConfig: SiteConfig = {
  name: 'Henna by Aayesha',
  tagline: 'Professional Mehndi & Bridal Henna Artist in Bangalore',
  description:
    'Exquisite bridal, festival, and bespoke mehndi designs crafted with 100% natural organic henna. Serving Bangalore / Bengaluru exclusively. Appointments booked via WhatsApp.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hennabyaayesha.com',
  contact: {
    // Read from environment if set, otherwise fallback to identifiable defaults.
    // Later hooked into Supabase Admin Settings.
    whatsappDisplayNumber:
      process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || '+91 12345 67890',
    whatsappPhoneRaw:
      process.env.NEXT_PUBLIC_WHATSAPP_RAW || '911234567890',
    whatsappDefaultMessage:
      'Hi Aayesha, I would like to book a mehndi appointment in Bangalore. Please share your availability and details.',
    email:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@hennabyaayesha.com',
    instagramHandle: '@hennabyaayesha',
    instagramUrl: 'https://instagram.com/hennabyaayesha',
    city: 'Bangalore / Bengaluru',
    state: 'Karnataka',
    country: 'India',
    serviceNotice:
      'Mehndi services are currently available exclusively in Bangalore / Bengaluru.',
    operatingHours: 'By Prior Appointment Only',
  },
  navLinks: [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Designs', href: '/mehndi-designs' },
    { name: 'Services', href: '/services' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'Contact', href: '/contact' },
  ],
};

/**
 * Dynamically builds a verified WhatsApp click-to-chat URL
 *
 * @param customMessage Optional contextual message (e.g. for specific design or service)
 * @param phoneRaw Optional override, defaults to centralized siteConfig.contact.whatsappPhoneRaw
 */
export function buildWhatsAppUrl(
  customMessage?: string,
  phoneRaw?: string
): string {
  const number = (phoneRaw || siteConfig.contact.whatsappPhoneRaw).replace(/\D/g, '');
  const text = customMessage && customMessage.trim().length > 0
    ? customMessage.trim()
    : siteConfig.contact.whatsappDefaultMessage;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Dynamically builds a mailto: URL using centralized contact email
 *
 * @param subject Optional email subject
 * @param body Optional email body
 */
export function buildEmailUrl(
  subject?: string,
  body?: string,
  emailAddress?: string
): string {
  const email = emailAddress || siteConfig.contact.email;
  const params = new URLSearchParams();

  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);

  const query = params.toString();
  return query ? `mailto:${email}?${query}` : `mailto:${email}`;
}

/**
 * Returns an absolute canonical URL for any route path, stripping trailing slashes.
 *
 * @param path Optional relative route path (e.g. '/mehndi-designs')
 */
export function getCanonicalUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/+$/, '');
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}${cleanPath}`;
}
