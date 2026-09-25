import {
  HeroConfig,
  SectionToggles,
  SocialLinkItem,
  NavigationItem,
  FooterConfig,
  PromoBarConfig,
  SeoConfig,
  ExtendedSiteSettings,
} from '@/types';
import { DEFAULT_LOCATION } from '@/lib/settings/location';

export const DEFAULT_HERO: HeroConfig = {
  badge: 'Organic Henna Artist in {city}',
  title: 'Exquisite Bridal Mehndi',
  highlightedTitle: 'Artistry in {city}',
  description:
    'Dedicated to translating romance and heritage into timeless organic henna with chemical-free cones and unhurried artistry.',
  primaryCtaText: 'Book Appointment on WhatsApp',
  secondaryCtaText: 'Explore Design Catalog',
  imageUrl: '/images/hero-bride.jpg',
  imageAlt: 'Bridal Mehndi Artist in {city}',
};

export const DEFAULT_SECTIONS: SectionToggles = {
  hero: true,
  services: true,
  designs: true,
  about: true,
  whyChooseUs: true,
  testimonials: true,
  faq: true,
  instagram: true,
  contactCta: true,
};

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: 'social-ig',
    platform: 'Instagram',
    url: 'https://www.instagram.com/hennabyaayesha/',
    enabled: true,
    displayOrder: 1,
  },
  {
    id: 'social-fb',
    platform: 'Facebook',
    url: '',
    enabled: false,
    displayOrder: 2,
  },
  {
    id: 'social-yt',
    platform: 'YouTube',
    url: '',
    enabled: false,
    displayOrder: 3,
  },
  {
    id: 'social-pin',
    platform: 'Pinterest',
    url: '',
    enabled: false,
    displayOrder: 4,
  },
  {
    id: 'social-tt',
    platform: 'TikTok',
    url: '',
    enabled: false,
    displayOrder: 5,
  },
];

export const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: 'nav-designs', label: 'Designs', url: '/mehndi-designs', enabled: true, displayOrder: 1 },
  { id: 'nav-services', label: 'Services', url: '/services', enabled: true, displayOrder: 2 },
  { id: 'nav-gallery', label: 'Gallery', url: '/gallery', enabled: true, displayOrder: 3 },
  { id: 'nav-about', label: 'About', url: '/about', enabled: true, displayOrder: 4 },
  { id: 'nav-testimonials', label: 'Testimonials', url: '/testimonials', enabled: true, displayOrder: 5 },
  { id: 'nav-contact', label: 'Contact', url: '/contact', enabled: true, displayOrder: 6 },
];

export const DEFAULT_FOOTER: FooterConfig = {
  description:
    'Bespoke bridal, Arabic, and festival henna artistry crafted with 100% natural organic henna cones. Exclusively serving appointments booked directly via WhatsApp.',
  copyrightText: '© {year} Henna by Aayesha. All rights reserved.',
};

export const DEFAULT_PROMO: PromoBarConfig = {
  enabled: false,
  text: '✨ Bridal and festival henna dates are now open! Reserve early on WhatsApp.',
  ctaText: 'Check Availability',
  ctaUrl: '',
};

export const DEFAULT_SEO: SeoConfig = {
  primaryTitle: 'Henna by Aayesha | Mehndi Artist in {city}',
  defaultMetaDescription:
    'Exquisite bespoke bridal, Arabic, and traditional mehndi designs in {city} / {altCity}. 100% natural organic henna. Appointments exclusively via WhatsApp.',
  keywords:
    'Henna by Aayesha, Mehndi Artist {city}, Bridal Mehndi {city}, Organic Henna {city}',
  ogImage: '/images/hero-bride.jpg',
  twitterImage: '/images/hero-bride.jpg',
  canonicalBaseUrl: 'https://hennabyaayesha.com',
  homepageTitle: 'Henna by Aayesha | Mehndi Artist in {city}',
  homepageDescription:
    'Exquisite bespoke bridal, Arabic, and traditional mehndi designs in {city}. 100% natural organic henna. Appointments booked exclusively via WhatsApp.',
  servicesTitle: 'Mehndi Services & Packages | Henna by Aayesha {city}',
  servicesDescription:
    'Explore bridal, sangeet, engagement, and guest mehndi packages in {city}. On-location artist visits.',
  designsTitle: 'Mehndi Design Catalog | Henna by Aayesha',
  designsDescription:
    'Browse our curated collection of bridal, Arabic, mandala, and minimal mehndi designs.',
  contactTitle: 'Book Mehndi Appointment | Henna by Aayesha {city}',
  contactDescription:
    'Book your bridal or festive henna session in {city} directly on WhatsApp.',
};

export const DEFAULT_EXTENDED_SETTINGS: ExtendedSiteSettings = {
  location: DEFAULT_LOCATION,
  hero: DEFAULT_HERO,
  sections: DEFAULT_SECTIONS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  navigation: DEFAULT_NAVIGATION,
  footer: DEFAULT_FOOTER,
  promo: DEFAULT_PROMO,
  seo: DEFAULT_SEO,
  maintenanceMode: false,
};

export const DEFAULT_HERO_CONFIG = DEFAULT_HERO;
export const DEFAULT_SECTION_TOGGLES = DEFAULT_SECTIONS;
export const DEFAULT_PROMO_BAR = DEFAULT_PROMO;
export const DEFAULT_FOOTER_CONFIG = DEFAULT_FOOTER;
export const DEFAULT_SEO_CONFIG = DEFAULT_SEO;

