import { SiteConfig } from '@/types';
export {
  normalizeWhatsAppPhone,
  normalizeInstagram,
  buildWhatsAppUrl,
  buildInstagramUrl,
  buildEmailUrl,
} from '@/lib/settings/contact';

/**
 * Centralized Site Architecture & Baseline Configuration
 *
 * NOTE: Dynamic contact and social settings (WhatsApp, Email, Instagram) are hydrated
 * strictly from Supabase `site_settings` managed via the Admin Panel.
 * Baseline contact fields default to empty strings to guarantee no hardcoded or stale
 * contact information ever reaches visitors if unconfigured.
 */
export const siteConfig: SiteConfig = {
  name: 'Henna by Aayesha',
  tagline: 'Professional Mehndi & Bridal Henna Artist in Bangalore',
  description:
    'Exquisite bridal, festival, and bespoke mehndi designs crafted with 100% natural organic henna. Serving Bangalore / Bengaluru exclusively. Appointments booked via WhatsApp.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hennabyaayesha.com',
  contact: {
    whatsappDisplayNumber: '',
    whatsappPhoneRaw: '',
    whatsappDefaultMessage:
      'Hi Aayesha, I would like to book a mehndi appointment in Bangalore. Please share your availability and details.',
    email: 'hello@hennabyaayesha.com',
    instagramHandle: '',
    instagramUrl: '',
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
 * Returns an absolute canonical URL for any route path, stripping trailing slashes.
 *
 * @param path Optional relative route path (e.g. '/mehndi-designs')
 */
export function getCanonicalUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/+$/, '');
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}${cleanPath}`;
}
