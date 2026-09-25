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

export type AIProviderKey =
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'mistral'
  | 'cohere'
  | 'cloudflare';

export interface DbAIProvider {
  id: string;
  provider_key: AIProviderKey;
  display_name: string;
  enabled: boolean;
  encrypted_api_key?: string | null;
  encrypted_account_id?: string | null;
  model: string;
  priority: number;
  last_tested_at?: string | null;
  last_status: 'connected' | 'error' | 'untested';
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type EmbeddingProviderKey = 'gemini' | 'cohere' | 'mistral' | 'openrouter';

export interface DbEmbeddingSettings {
  id: number;
  provider_key: EmbeddingProviderKey;
  model: string;
  dimensions: number;
  enabled: boolean;
  encrypted_api_key?: string | null;
  last_tested_at?: string | null;
  last_status: 'connected' | 'error' | 'untested';
  last_error?: string | null;
  requires_reindex: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbKnowledgeDocument {
  id: string;
  source_type: string;
  source_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  content_hash: string;
  embedding?: number[] | null;
  embedding_provider: string;
  embedding_model: string;
  is_active: boolean;
  indexing_status: 'indexed' | 'pending' | 'failed';
  indexing_error?: string | null;
  created_at?: string;
  updated_at?: string;
}


