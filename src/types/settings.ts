export interface SiteLocationConfig {
  city: string;
  altCity: string;
  state: string;
  country: string;
  serviceArea: string;
  serviceAreaLabel?: string;
  serviceAvailability: string;
  availability?: string;
  address: string;
  googleMapsUrl: string;
  operatingHours: string;
  businessHours?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface HeroConfig {
  badge: string;
  badgeText?: string;
  title: string;
  highlightedTitle: string;
  highlightWord?: string;
  description: string;
  subtitle?: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  imageUrl: string;
  heroImage?: string;
  imageAlt: string;
  heroImageAlt?: string;
}

export interface SectionToggles {
  hero: boolean;
  services: boolean;
  designs: boolean;
  featuredDesigns?: boolean;
  about: boolean;
  whyChooseUs: boolean;
  testimonials: boolean;
  faq: boolean;
  instagram: boolean;
  contactCta: boolean;
  contact?: boolean;
}

export type SocialPlatform =
  | 'Instagram'
  | 'Facebook'
  | 'YouTube'
  | 'Pinterest'
  | 'TikTok'
  | 'Twitter'
  | 'LinkedIn'
  | 'Other'
  | string;

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  displayOrder: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  href?: string;
  enabled: boolean;
  active?: boolean;
  displayOrder: number;
}

export interface FooterConfig {
  description: string;
  copyrightText: string;
  contactHeading?: string;
  linksHeading?: string;
}

export interface PromoBarConfig {
  enabled: boolean;
  text: string;
  ctaText: string;
  ctaUrl: string;
  startDate?: string;
  endDate?: string;
}

export interface SeoConfig {
  primaryTitle: string;
  defaultMetaDescription: string;
  keywords: string;
  ogImage: string;
  twitterImage: string;
  canonicalBaseUrl: string;
  homepageTitle: string;
  homepageDescription: string;
  servicesTitle: string;
  servicesDescription: string;
  designsTitle: string;
  designsDescription: string;
  contactTitle: string;
  contactDescription: string;
  global?: {
    siteTitle: string;
    defaultDescription: string;
    keywords: string;
    canonicalBaseUrl: string;
    ogImage: string;
    twitterImage: string;
  };
  pages?: {
    homepage: { title: string; description: string };
    services: { title: string; description: string };
    designs: { title: string; description: string };
    contact: { title: string; description: string };
  };
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  published: boolean;
}

export interface WhyChooseUsItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  displayOrder: number;
  published: boolean;
}

export interface ExtendedSiteSettings {
  location: SiteLocationConfig;
  hero: HeroConfig;
  sections: SectionToggles;
  socialLinks: SocialLinkItem[];
  navigation: NavigationItem[];
  footer: FooterConfig;
  promo: PromoBarConfig;
  seo: SeoConfig;
  maintenanceMode: boolean;
}
