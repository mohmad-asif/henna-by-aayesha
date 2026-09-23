export interface DbSiteSettings {
  id: number;
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  whatsapp_raw: string;
  whatsapp_message: string;
  email: string;
  location: string;
  short_description: string;
  about_description: string;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
  primary_cta_text: string;
  updated_at?: string;
}

export interface DbService {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price_text: string;
  duration_text: string;
  image?: string;
  featured: boolean;
  active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbDesign {
  id: string;
  title: string;
  slug: string;
  category: 'Bridal' | 'Arabic' | 'Traditional' | 'Minimal' | 'Modern' | 'Custom';
  description: string;
  image: string;
  alt_text?: string;
  featured: boolean;
  active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbGallery {
  id: string;
  title: string;
  image: string;
  alt_text?: string;
  category: string;
  featured: boolean;
  active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbTestimonial {
  id: string;
  customer_name: string;
  review: string;
  rating: number;
  image?: string;
  active: boolean;
  featured: boolean;
  display_order: number;
  created_at?: string;
}

export interface DbAdminProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}
