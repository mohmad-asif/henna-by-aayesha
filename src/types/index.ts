export type DesignCategory =
  | 'bridal'
  | 'arabic'
  | 'indo-western'
  | 'traditional'
  | 'mandala'
  | 'minimalist'
  | 'minimal'
  | 'modern'
  | 'custom'
  | 'feet';

export interface MehndiDesign {
  id: string;
  slug: string;
  title: string;
  category: DesignCategory;
  categoryLabel: string;
  shortDescription: string;
  fullDescription: string;
  idealFor: string[];
  estimatedDuration: string;
  coverage: string;
  tags: string[];
  image: string;
  featured?: boolean;
}

export type ServiceCategory =
  | 'bridal'
  | 'engagement'
  | 'sangeet-guest'
  | 'festival'
  | 'bespoke-studio';

export interface ServicePackage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ServiceCategory;
  description: string;
  duration: string;
  idealFor: string;
  features: string[];
  bangaloreTravel: string;
  note?: string;
  recommendedForBridal?: boolean;
  image?: string;
  priceText?: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  eventType: string;
  bangaloreArea: string;
  quote: string;
  rating: number; // 1 to 5
  weddingDate: string;
  verifiedBride: boolean;
  featured?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'all' | 'bridal' | 'hands' | 'feet' | 'minimalist' | 'arabic';
  categoryLabel: string;
  image: string;
  caption: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: 'general' | 'booking' | 'aftercare' | 'bangalore';
}

export interface SiteContactConfig {
  whatsappDisplayNumber: string;
  whatsappPhoneRaw: string;
  whatsappDefaultMessage: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  city: string;
  state: string;
  country: string;
  serviceNotice: string;
  operatingHours: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  contact: SiteContactConfig;
  navLinks: { name: string; href: string }[];
}
