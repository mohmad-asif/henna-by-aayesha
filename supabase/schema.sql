-- ==============================================================================
-- HENNA BY AAYESHA — CANONICAL DATABASE SCHEMA (schema.sql)
-- ==============================================================================
-- Single Source of Truth for the Entire Supabase / PostgreSQL Database.
--
-- TARGET ENVIRONMENT: Completely Fresh Supabase or PostgreSQL Database.
-- EXECUTION: Run this entire file ONCE in the Supabase SQL Editor.
--
-- DEPENDENCY ORDER:
--   1. Extensions
--   2. Utility & Trigger Functions
--   3. Tables (15 Tables)
--   4. Indexes (B-tree, GIN, HNSW Vector Cosine)
--   5. Triggers
--   6. RPC Functions
--   7. Supabase Storage Configuration & Policies
--   8. Row Level Security (RLS) Enablement & Policies
--   9. Permissions & Grants
--  10. Required Initial Seed & Configuration Data
--
-- REQUIRED ENVIRONMENT VARIABLES:
--   - NEXT_PUBLIC_SUPABASE_URL             : Full URL of the Supabase project
--   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : Publishable anonymous API key
--   - SUPABASE_SERVICE_ROLE_KEY            : Server-only key for secure backend routes
--   - AI_SETTINGS_ENCRYPTION_KEY           : 32+ character key for AES-256-GCM encryption
--   - NEXT_PUBLIC_SITE_URL                 : Base site URL (e.g. https://hennabyaayesha.com)
--
-- MANUAL SUPABASE SETUP (Cannot be automated via SQL):
--   1. Create an admin user under Authentication -> Users in the Supabase Dashboard,
--      or register via the website at /admin/login. The trigger will automatically
--      create their admin profile.
--   2. Configure your SMTP / Email provider under Authentication -> Email Templates
--      if email confirmation is required.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==============================================================================
-- 2. UTILITY & TRIGGER FUNCTIONS
-- ==============================================================================

-- Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatic profile creation for new Supabase Auth users
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. TABLES DEFINITION (15 APPLICATION TABLES)
-- ==============================================================================

-- 3.1. Core Site Settings (Singleton id=1)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'Henna by Aayesha',
  tagline TEXT NOT NULL DEFAULT 'Professional Mehndi & Bridal Henna Artist in Bangalore',
  whatsapp_number TEXT NOT NULL DEFAULT '+91 12345 67890',
  whatsapp_raw TEXT NOT NULL DEFAULT '911234567890',
  whatsapp_message TEXT NOT NULL DEFAULT 'Hi Aayesha, I would like to book a mehndi appointment in Bangalore. Please share your availability and details.',
  email TEXT NOT NULL DEFAULT 'hello@hennabyaayesha.com',
  location TEXT NOT NULL DEFAULT 'Bangalore / Bengaluru, Karnataka, India',
  short_description TEXT NOT NULL DEFAULT 'Exquisite bridal, festival, and bespoke mehndi designs crafted with 100% natural organic henna. Serving Bangalore / Bengaluru exclusively.',
  about_description TEXT NOT NULL DEFAULT 'Dedicated to translating romance and heritage into timeless organic henna with chemical-free cones and unhurried artistry.',
  instagram_url TEXT DEFAULT 'https://instagram.com/hennabyaayesha',
  facebook_url TEXT DEFAULT '',
  website_url TEXT DEFAULT 'https://hennabyaayesha.com',
  primary_cta_text TEXT NOT NULL DEFAULT 'Book Appointment on WhatsApp',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2. Services & Packages
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  price_text TEXT,
  duration_text TEXT,
  image TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3. Mehndi Designs Catalog
CREATE TABLE IF NOT EXISTS public.mehndi_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Bridal', 'Arabic', 'Traditional', 'Minimal', 'Modern', 'Custom')),
  description TEXT,
  image TEXT NOT NULL,
  alt_text TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4. Photo Gallery
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  alt_text TEXT,
  category TEXT NOT NULL DEFAULT 'Bridal',
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5. Testimonials & Client Reviews
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6. Admin Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7. Multi-Provider AI Routing Configuration
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  encrypted_api_key TEXT,
  encrypted_account_id TEXT,
  model TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  last_tested_at TIMESTAMPTZ,
  last_status TEXT NOT NULL DEFAULT 'untested',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON COLUMN public.ai_providers.encrypted_account_id IS 
  'AES-256-GCM encrypted Account ID specifically for providers requiring multi-field authentication like Cloudflare Workers AI.';

-- 3.8. AI Vector Embedding Configuration (Singleton id=1)
CREATE TABLE IF NOT EXISTS public.ai_embedding_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider_key TEXT NOT NULL DEFAULT 'gemini',
  model TEXT NOT NULL DEFAULT 'text-embedding-004',
  dimensions INTEGER NOT NULL DEFAULT 768,
  enabled BOOLEAN NOT NULL DEFAULT true,
  encrypted_api_key TEXT,
  last_tested_at TIMESTAMPTZ,
  last_status TEXT NOT NULL DEFAULT 'untested',
  last_error TEXT,
  requires_reindex BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.9. Dual-Purpose Knowledge Documents (RAG Vectors + Dynamic CMS Store)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  embedding vector(768),
  embedding_provider TEXT NOT NULL DEFAULT 'gemini',
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-004',
  is_active BOOLEAN NOT NULL DEFAULT true,
  indexing_status TEXT NOT NULL DEFAULT 'indexed',
  indexing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (source_type, source_id)
);

-- 3.10. AI Recommendation Engine Settings (Singleton id=1)
CREATE TABLE IF NOT EXISTS public.ai_recommendation_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT true,
  max_recommendations INTEGER NOT NULL DEFAULT 3 CHECK (max_recommendations BETWEEN 1 AND 8),
  min_similarity_threshold FLOAT NOT NULL DEFAULT 0.35 CHECK (min_similarity_threshold BETWEEN 0.1 AND 0.9),
  enable_semantic BOOLEAN NOT NULL DEFAULT true,
  enable_metadata BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.11. Privacy-Preserving Visitors
CREATE TABLE IF NOT EXISTS public.visitors (
  visitor_id TEXT PRIMARY KEY,
  first_visit_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_visit_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  visit_count INTEGER NOT NULL DEFAULT 1,
  page_views_count INTEGER NOT NULL DEFAULT 1,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  browser TEXT NOT NULL DEFAULT 'Unknown',
  os TEXT NOT NULL DEFAULT 'Unknown',
  screen_size TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  country TEXT,
  region TEXT,
  city TEXT,
  location_display TEXT,
  initial_referrer TEXT,
  initial_source TEXT,
  initial_utm_source TEXT,
  initial_utm_medium TEXT,
  initial_utm_campaign TEXT,
  landing_page TEXT NOT NULL DEFAULT '/',
  last_page TEXT NOT NULL DEFAULT '/',
  is_bot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.12. Visitor Sessions
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  page_views_count INTEGER NOT NULL DEFAULT 1,
  landing_page TEXT NOT NULL DEFAULT '/',
  exit_page TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  browser TEXT NOT NULL DEFAULT 'Unknown',
  os TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.13. Page Views
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
  url_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.14. Business & Interaction Events
CREATE TABLE IF NOT EXISTS public.visitor_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  url_path TEXT NOT NULL DEFAULT '/',
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.15. Analytics & Privacy Settings (Singleton id=1)
CREATE TABLE IF NOT EXISTS public.analytics_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retention_days INTEGER NOT NULL DEFAULT 90 CHECK (retention_days IN (30, 60, 90, 180, 365)),
  tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  require_consent BOOLEAN NOT NULL DEFAULT true,
  anonymize_ip BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================

-- Services & Designs
CREATE INDEX IF NOT EXISTS idx_services_active_order ON public.services(active, display_order);
CREATE INDEX IF NOT EXISTS idx_designs_active_order ON public.mehndi_designs(active, display_order);
CREATE INDEX IF NOT EXISTS idx_designs_category ON public.mehndi_designs(category);
CREATE INDEX IF NOT EXISTS idx_gallery_active_order ON public.gallery(active, display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_active_order ON public.testimonials(active, display_order);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role);

-- AI Providers & Embeddings
CREATE INDEX IF NOT EXISTS idx_ai_providers_enabled_priority ON public.ai_providers(enabled, priority);

-- Knowledge Documents & Vector Search
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_hnsw_idx 
  ON public.knowledge_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS knowledge_documents_source_idx 
  ON public.knowledge_documents (is_active, source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_source_type_id 
  ON public.knowledge_documents (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_metadata_published 
  ON public.knowledge_documents USING gin ((metadata -> 'published'));
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_metadata_order 
  ON public.knowledge_documents USING gin ((metadata -> 'display_order'));

-- Visitor Analytics
CREATE INDEX IF NOT EXISTS idx_visitors_last_active ON public.visitors(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_first_visit ON public.visitors(first_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_device ON public.visitors(device_type);
CREATE INDEX IF NOT EXISTS idx_visitors_city ON public.visitors(city);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON public.visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_active ON public.visitor_sessions(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_started_at ON public.visitor_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_url_path ON public.page_views(url_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_id ON public.visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON public.visitor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_event_name ON public.visitor_events(event_name);
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON public.visitor_events(created_at DESC);

-- ==============================================================================
-- 5. TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_designs_updated_at ON public.mehndi_designs;
CREATE TRIGGER set_designs_updated_at
  BEFORE UPDATE ON public.mehndi_designs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_gallery_updated_at ON public.gallery;
CREATE TRIGGER set_gallery_updated_at
  BEFORE UPDATE ON public.gallery
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ai_providers_updated_at ON public.ai_providers;
CREATE TRIGGER set_ai_providers_updated_at
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ai_embedding_settings_updated_at ON public.ai_embedding_settings;
CREATE TRIGGER set_ai_embedding_settings_updated_at
  BEFORE UPDATE ON public.ai_embedding_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_knowledge_documents_updated_at ON public.knowledge_documents;
CREATE TRIGGER set_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ai_recommendation_settings_updated_at ON public.ai_recommendation_settings;
CREATE TRIGGER set_ai_recommendation_settings_updated_at
  BEFORE UPDATE ON public.ai_recommendation_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_visitors_updated_at ON public.visitors;
CREATE TRIGGER set_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_visitor_sessions_updated_at ON public.visitor_sessions;
CREATE TRIGGER set_visitor_sessions_updated_at
  BEFORE UPDATE ON public.visitor_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_analytics_settings_updated_at ON public.analytics_settings;
CREATE TRIGGER set_analytics_settings_updated_at
  BEFORE UPDATE ON public.analytics_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Supabase Auth Hook Trigger for Automatic Admin Profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_admin_user();
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ==============================================================================
-- 6. RPC FUNCTIONS
-- ==============================================================================

-- 6.1. RAG Vector Similarity Search RPC
CREATE OR REPLACE FUNCTION public.match_knowledge_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 5,
  filter_source_type text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.source_type,
    kd.source_id,
    kd.title,
    kd.content,
    kd.metadata,
    (1 - (kd.embedding <=> query_embedding))::float AS similarity
  FROM public.knowledge_documents kd
  WHERE kd.is_active = true
    AND kd.embedding IS NOT NULL
    AND (filter_source_type IS NULL OR kd.source_type = filter_source_type)
    AND (1 - (kd.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6.2. Automatic Analytics Retention Cleanup RPC
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics(days_to_keep INT DEFAULT NULL)
RETURNS TABLE (
  deleted_page_views BIGINT,
  deleted_events BIGINT,
  deleted_sessions BIGINT,
  deleted_visitors BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retention_window INT;
  cutoff_time TIMESTAMPTZ;
  del_pv BIGINT := 0;
  del_ev BIGINT := 0;
  del_sess BIGINT := 0;
  del_vis BIGINT := 0;
BEGIN
  IF days_to_keep IS NOT NULL AND days_to_keep > 0 THEN
    retention_window := days_to_keep;
  ELSE
    SELECT retention_days INTO retention_window FROM public.analytics_settings WHERE id = 1;
    IF retention_window IS NULL THEN
      retention_window := 90;
    END IF;
  END IF;

  cutoff_time := timezone('utc'::text, now()) - (retention_window || ' days')::INTERVAL;

  -- Delete old page views
  WITH deleted AS (
    DELETE FROM public.page_views
    WHERE created_at < cutoff_time
    RETURNING 1
  )
  SELECT count(*) INTO del_pv FROM deleted;

  -- Delete old visitor events
  WITH deleted AS (
    DELETE FROM public.visitor_events
    WHERE created_at < cutoff_time
    RETURNING 1
  )
  SELECT count(*) INTO del_ev FROM deleted;

  -- Delete old visitor sessions
  WITH deleted AS (
    DELETE FROM public.visitor_sessions
    WHERE last_active_at < cutoff_time
    RETURNING 1
  )
  SELECT count(*) INTO del_sess FROM deleted;

  -- Delete old visitors with no recent activity
  WITH deleted AS (
    DELETE FROM public.visitors
    WHERE last_active_at < cutoff_time
    RETURNING 1
  )
  SELECT count(*) INTO del_vis FROM deleted;

  RETURN QUERY SELECT del_pv, del_ev, del_sess, del_vis;
END;
$$;

-- ==============================================================================
-- 7. SUPABASE STORAGE SETUP & POLICIES
-- ==============================================================================

DO $$
BEGIN
  -- Create henna-images storage bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('henna-images', 'henna-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- Storage Policies on storage.objects
  DROP POLICY IF EXISTS "Public can read henna-images" ON storage.objects;
  CREATE POLICY "Public can read henna-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'henna-images');

  DROP POLICY IF EXISTS "Admins can upload to henna-images" ON storage.objects;
  CREATE POLICY "Admins can upload to henna-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'henna-images');

  DROP POLICY IF EXISTS "Admins can update henna-images" ON storage.objects;
  CREATE POLICY "Admins can update henna-images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'henna-images');

  DROP POLICY IF EXISTS "Admins can delete henna-images" ON storage.objects;
  CREATE POLICY "Admins can delete henna-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'henna-images');
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) ENABLEMENT & POLICIES
-- ==============================================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mehndi_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_embedding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;

-- 8.1. Site Settings
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.2. Services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.3. Mehndi Designs
DROP POLICY IF EXISTS "Public can view active designs" ON public.mehndi_designs;
CREATE POLICY "Public can view active designs"
  ON public.mehndi_designs FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage designs" ON public.mehndi_designs;
CREATE POLICY "Admins can manage designs"
  ON public.mehndi_designs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.4. Gallery
DROP POLICY IF EXISTS "Public can view active gallery" ON public.gallery;
CREATE POLICY "Public can view active gallery"
  ON public.gallery FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;
CREATE POLICY "Admins can manage gallery"
  ON public.gallery FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.5. Testimonials
DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;
CREATE POLICY "Public can view active testimonials"
  ON public.testimonials FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.6. Admin Profiles
DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_profiles;
CREATE POLICY "Admins can view own profile"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update own profile" ON public.admin_profiles;
CREATE POLICY "Admins can update own profile"
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8.7. AI Providers (Strict: Authenticated Admins and Service Role only. No public read.)
DROP POLICY IF EXISTS "Admins can view and manage ai_providers" ON public.ai_providers;
CREATE POLICY "Admins can view and manage ai_providers"
  ON public.ai_providers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.8. AI Embedding Settings (Strict: Authenticated Admins and Service Role only. No public read.)
DROP POLICY IF EXISTS "Admins can manage ai_embedding_settings" ON public.ai_embedding_settings;
CREATE POLICY "Admins can manage ai_embedding_settings"
  ON public.ai_embedding_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.9. Knowledge Documents (Public reads active published docs & extended settings; Admins manage all)
DROP POLICY IF EXISTS "Public can view active knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Public can view active knowledge documents"
  ON public.knowledge_documents FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (
      source_type = 'extended_settings'
      OR (metadata->>'published')::boolean IS NOT FALSE
      OR indexing_status = 'indexed'
    )
  );

DROP POLICY IF EXISTS "Admins can manage knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Admins can manage knowledge documents"
  ON public.knowledge_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.10. AI Recommendation Settings
DROP POLICY IF EXISTS "Public can view ai_recommendation_settings" ON public.ai_recommendation_settings;
CREATE POLICY "Public can view ai_recommendation_settings"
  ON public.ai_recommendation_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage ai_recommendation_settings" ON public.ai_recommendation_settings;
CREATE POLICY "Admins can manage ai_recommendation_settings"
  ON public.ai_recommendation_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8.11. Visitor Tracking & Analytics (Strict: Admins only. Anonymous writes routed via Service Role API)
DROP POLICY IF EXISTS "Admins have full access to visitors" ON public.visitors;
CREATE POLICY "Admins have full access to visitors"
  ON public.visitors FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to visitor_sessions" ON public.visitor_sessions;
CREATE POLICY "Admins have full access to visitor_sessions"
  ON public.visitor_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to page_views" ON public.page_views;
CREATE POLICY "Admins have full access to page_views"
  ON public.page_views FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to visitor_events" ON public.visitor_events;
CREATE POLICY "Admins have full access to visitor_events"
  ON public.visitor_events FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 8.12. Analytics Settings
DROP POLICY IF EXISTS "Admins have full access to analytics_settings" ON public.analytics_settings;
CREATE POLICY "Admins have full access to analytics_settings"
  ON public.analytics_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view analytics settings" ON public.analytics_settings;
CREATE POLICY "Public can view analytics settings"
  ON public.analytics_settings FOR SELECT TO anon, authenticated
  USING (true);

-- ==============================================================================
-- 9. PERMISSIONS & GRANTS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.match_knowledge_documents TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_analytics TO authenticated, service_role;

-- ==============================================================================
-- 10. INITIAL SEED & CONFIGURATION DATA
-- ==============================================================================

-- 10.1. Core Site Settings Seed
INSERT INTO public.site_settings (
  id, business_name, tagline, whatsapp_number, whatsapp_raw, whatsapp_message,
  email, location, short_description, about_description, primary_cta_text
) VALUES (
  1,
  'Henna by Aayesha',
  'Professional Mehndi & Bridal Henna Artist in Bangalore',
  '+91 12345 67890',
  '911234567890',
  'Hi Aayesha, I would like to book a mehndi appointment in Bangalore. Please share your availability and details.',
  'hello@hennabyaayesha.com',
  'Bangalore / Bengaluru, Karnataka, India',
  'Exquisite bridal, festival, and bespoke mehndi designs crafted with 100% natural organic henna. Serving Bangalore / Bengaluru exclusively. Appointments booked via WhatsApp.',
  'Over 8 years crafting bridal couture in Bangalore using 100% certified organic Rajasthani henna cones hand-prepared with eucalyptus essential oils.',
  'Book Appointment on WhatsApp'
) ON CONFLICT (id) DO NOTHING;

-- 10.2. Mehndi Designs Catalog Seed
INSERT INTO public.mehndi_designs (title, slug, category, description, image, alt_text, featured, active, display_order)
VALUES
(
  'The Royal Maharani Bridal Ensemble',
  'royal-rajasthani-bridal',
  'Bridal',
  'Full arm traditional bridal masterpiece featuring intricate lotus motifs, jharokha arches, and elephant procession silhouettes.',
  '/images/hero-bride.jpg',
  'Royal Maharani Bridal Mehndi Design on bride hands in Bangalore',
  true,
  true,
  1
),
(
  'Emirates Modern Arabic Floral Trail',
  'dubai-luxe-arabic-vine',
  'Arabic',
  'Flowing organic floral vines with bold outlines, shaded petal gradients, and airy negative space framing the hand.',
  '/images/arabic-design.jpg',
  'Emirates Modern Arabic Henna on hand and fingers',
  true,
  true,
  2
),
(
  'Sacred Lotus Centerpiece Mandala',
  'sacred-lotus-mandala',
  'Traditional',
  'Hypnotic central palm mandala framed with micro-filigree lace, scalloped borders, and capped fingertip details.',
  '/images/mandala-design.jpg',
  'Sacred Lotus Mandala Henna on palm',
  true,
  true,
  3
),
(
  'Nawabina Bridal Feet & Anklet Jaal',
  'regal-anklet-bridal-feet',
  'Bridal',
  'Opulent bridal foot pattern replicating royal silver payal chains, ankle paisleys, and delicate toe net lace.',
  '/images/bridal-feet.jpg',
  'Bridal Feet Henna with silver payal anklet in Bangalore',
  true,
  true,
  4
),
(
  'Indo-Arabic Fusion Garden Trail',
  'indo-arabic-fusion-cuff',
  'Modern',
  'Harmonious blend of dense Indian filigree and flowing bold Gulf leaves, created for versatile celebrations.',
  '/images/arabic-design.jpg',
  'Indo Arabic Fusion Henna Design',
  false,
  true,
  5
),
(
  'Minimalist Botanical Wristlet & Ring Trail',
  'minimalist-botanical-bracelet',
  'Minimal',
  'Understated fine-line botanical branch encircling the wrist with a single delicate finger chain.',
  '/images/mandala-design.jpg',
  'Minimalist Botanical Henna Bracelet',
  false,
  true,
  6
)
ON CONFLICT (slug) DO NOTHING;

-- 10.3. Services Catalog Seed
INSERT INTO public.services (title, slug, short_description, description, price_text, duration_text, image, featured, active, display_order)
VALUES
(
  'The Signature Royal Bridal Package',
  'royal-bridal-bespoke',
  'Comprehensive luxury bridal package for hands & feet with custom wedding storytelling.',
  'Aayesha’s most coveted experience. Crafted exclusively for the bride who desires bespoke artistry, rich storytelling elements, and complete luxury on her special day.',
  'Custom Quote on WhatsApp',
  '6 – 8 hours',
  '/images/hero-bride.jpg',
  true,
  true,
  1
),
(
  'Classic Bridal Elegance Package',
  'classic-bridal-elegance',
  'Timeless floral and jaal artistry up to mid-forearm and bridal feet.',
  'A balanced, timeless bridal ensemble blending classic Indian paisleys, floral lace nets, and delicate bridal feet.',
  'Custom Quote on WhatsApp',
  '4 – 5.5 hours',
  '/images/artist-at-work.jpg',
  true,
  true,
  2
),
(
  'Engagement & Roka Bespoke Henna',
  'engagement-roka-special',
  'Chic modern Arabic or Indo-Western patterns for the bride-to-be.',
  'A celebratory statement design tailored for your engagement, roka ceremony, or pre-wedding cocktail night.',
  'Custom Quote on WhatsApp',
  '2.5 – 3.5 hours',
  '/images/arabic-design.jpg',
  true,
  true,
  3
),
(
  'Sangeet & Wedding Guest Celebration',
  'sangeet-guest-package',
  'Hourly party packages for bridesmaids, mothers, and wedding guests.',
  'Efficient, high-speed, and artistic mehndi service to delight your closest family and friends during sangeet festivities.',
  'Hourly Package via WhatsApp',
  '3 to 6 hours continuous',
  '/images/mandala-design.jpg',
  false,
  true,
  4
),
(
  'Festive & Personal Studio Session',
  'festive-studio-session',
  'Individual appointments for Karwa Chauth, Eid, Diwali, or milestone events.',
  'Private, serene individual henna session at Aayesha’s Bangalore studio space or your doorstep for special festivals.',
  'Inquire on WhatsApp',
  '1 – 2 hours',
  '/images/aayesha-portrait.jpg',
  false,
  true,
  5
)
ON CONFLICT (slug) DO NOTHING;

-- 10.4. Gallery Seed
INSERT INTO public.gallery (title, image, alt_text, category, featured, active, display_order)
VALUES
(
  'The Royal Maharani Bridal Palms',
  '/images/hero-bride.jpg',
  'Bridal palms with intricate henna',
  'Bridal',
  true,
  true,
  1
),
(
  'Modern Gulf Arabic Botanical Trail',
  '/images/arabic-design.jpg',
  'Modern Arabic floral vines on hand',
  'Arabic',
  true,
  true,
  2
),
(
  'Sacred Lotus Sunburst Mandala',
  '/images/mandala-design.jpg',
  'Lotus mandala henna tattoo',
  'Traditional',
  true,
  true,
  3
),
(
  'Bridal Silver Payal Feet Art',
  '/images/bridal-feet.jpg',
  'Feet henna with payal anklets',
  'Bridal',
  true,
  true,
  4
),
(
  'Fresh Cone Application Studio Session',
  '/images/artist-at-work.jpg',
  'Artist applying henna in studio',
  'Custom',
  false,
  true,
  5
),
(
  'Minimalist Botanical Wristlet & Leaf Vines',
  '/images/arabic-design.jpg',
  'Minimalist henna wristlet',
  'Minimal',
  false,
  true,
  6
);

-- 10.5. Testimonials Seed
INSERT INTO public.testimonials (customer_name, review, rating, image, active, featured, display_order)
VALUES
(
  'Priya Sharma',
  'Aayesha is hands down the finest mehndi artist in Bangalore! She captured our courtship story inside the jharokha elements of my bridal design, including tiny coffee cups symbolizing where we met in Indiranagar. Her calmness and patience throughout the 6-hour sitting was unmatched.',
  5,
  'Sadashivanagar, Bangalore',
  true,
  true,
  1
),
(
  'Tanvi & Rahul Deshmukh',
  'Booking Aayesha through WhatsApp was seamless from the first greeting. She gave clear prep instructions, arrived at our Whitefield villa right on time, and completely blew away my guests. The organic henna smelled divine and left no chemical irritation whatsoever.',
  5,
  'Whitefield, Bangalore',
  true,
  true,
  2
),
(
  'Ananya Iyer',
  'The precision in her lotus mandalas and bridal payal patterns is otherworldly. My mother and grandmother could not stop praising the clean symmetry. Even after 10 days, the henna stain looked so elegant. Thank you Aayesha for making my wedding week feel so royal!',
  5,
  'Jayanagar, Bangalore',
  true,
  true,
  3
);

-- 10.6. AI Providers Seed (Ordered priority, API keys empty until configured by admin)
INSERT INTO public.ai_providers (provider_key, display_name, enabled, model, priority, last_status)
VALUES
  ('gemini', 'Google Gemini', false, 'gemini-1.5-flash', 1, 'untested'),
  ('groq', 'Groq', false, 'llama-3.3-70b-versatile', 2, 'untested'),
  ('openrouter', 'OpenRouter', false, 'meta-llama/llama-3.2-3b-instruct:free', 3, 'untested'),
  ('mistral', 'Mistral AI', false, 'mistral-small-latest', 4, 'untested'),
  ('cohere', 'Cohere', false, 'command-r-plus-08-2024', 5, 'untested'),
  ('cloudflare', 'Cloudflare Workers AI', false, '@cf/meta/llama-3.1-8b-instruct', 6, 'untested')
ON CONFLICT (provider_key) DO NOTHING;

-- 10.7. AI Embedding Settings Seed
INSERT INTO public.ai_embedding_settings (id, provider_key, model, dimensions, enabled, last_status)
VALUES (1, 'gemini', 'text-embedding-004', 768, true, 'untested')
ON CONFLICT (id) DO NOTHING;

-- 10.8. AI Recommendation Settings Seed
INSERT INTO public.ai_recommendation_settings (id, enabled, max_recommendations, min_similarity_threshold, enable_semantic, enable_metadata)
VALUES (1, true, 3, 0.35, true, true)
ON CONFLICT (id) DO NOTHING;

-- 10.9. Analytics Privacy Settings Seed
INSERT INTO public.analytics_settings (id, retention_days, tracking_enabled, require_consent, anonymize_ip)
VALUES (1, 90, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 10.10. Knowledge Documents Seed: Extended Site Settings (Dynamic CMS)
INSERT INTO public.knowledge_documents (
  source_type, source_id, title, content, metadata, content_hash, is_active, indexing_status
) VALUES (
  'extended_settings',
  'site_config',
  'Extended Site Configuration',
  'Service City: Bengaluru. State: Karnataka. Country: India. Availability: Accepting Mehndi Bookings across Bengaluru. Hero: Exquisite Bridal Mehndi. Maintenance Mode: false.',
  '{
    "location": {
      "city": "Bengaluru",
      "altCity": "Bangalore",
      "state": "Karnataka",
      "country": "India",
      "serviceArea": "Serving Bengaluru and nearby areas",
      "serviceAreaLabel": "Serving Bengaluru and nearby areas",
      "serviceAvailability": "Accepting Mehndi Bookings across Bengaluru • WhatsApp Only",
      "availability": "Accepting Mehndi Bookings across Bengaluru • WhatsApp Only",
      "address": "Sadashivanagar / Indiranagar, Bengaluru",
      "googleMapsUrl": "",
      "operatingHours": "Mon – Sun: 10:00 AM – 8:00 PM",
      "businessHours": "Mon – Sun: 10:00 AM – 8:00 PM",
      "logoUrl": "/images/logo.png",
      "faviconUrl": "/favicon.ico"
    },
    "hero": {
      "badge": "Organic Henna Artist in {city}",
      "title": "Exquisite Bridal Mehndi",
      "highlightedTitle": "Artistry in {city}",
      "description": "Dedicated to translating romance and heritage into timeless organic henna with chemical-free cones and unhurried artistry.",
      "primaryCtaText": "Book Appointment on WhatsApp",
      "secondaryCtaText": "Explore Design Catalog",
      "imageUrl": "/images/hero-bride.jpg",
      "imageAlt": "Bridal Mehndi Artist in {city}"
    },
    "sections": {
      "hero": true,
      "services": true,
      "designs": true,
      "about": true,
      "whyChooseUs": true,
      "testimonials": true,
      "faq": true,
      "instagram": true,
      "contactCta": true
    },
    "socialLinks": [
      { "id": "social-ig", "platform": "Instagram", "url": "https://www.instagram.com/hennabyaayesha/", "enabled": true, "displayOrder": 1 },
      { "id": "social-fb", "platform": "Facebook", "url": "", "enabled": false, "displayOrder": 2 },
      { "id": "social-yt", "platform": "YouTube", "url": "", "enabled": false, "displayOrder": 3 },
      { "id": "social-pin", "platform": "Pinterest", "url": "", "enabled": false, "displayOrder": 4 },
      { "id": "social-tt", "platform": "TikTok", "url": "", "enabled": false, "displayOrder": 5 }
    ],
    "navigation": [
      { "id": "nav-designs", "label": "Designs", "url": "/mehndi-designs", "enabled": true, "displayOrder": 1 },
      { "id": "nav-services", "label": "Services", "url": "/services", "enabled": true, "displayOrder": 2 },
      { "id": "nav-gallery", "label": "Gallery", "url": "/gallery", "enabled": true, "displayOrder": 3 },
      { "id": "nav-about", "label": "About", "url": "/about", "enabled": true, "displayOrder": 4 },
      { "id": "nav-testimonials", "label": "Testimonials", "url": "/testimonials", "enabled": true, "displayOrder": 5 },
      { "id": "nav-contact", "label": "Contact", "url": "/contact", "enabled": true, "displayOrder": 6 }
    ],
    "footer": {
      "description": "Bespoke bridal, Arabic, and festival henna artistry crafted with 100% natural organic henna cones. Exclusively serving appointments booked directly via WhatsApp.",
      "copyrightText": "© {year} Henna by Aayesha. All rights reserved."
    },
    "promo": {
      "enabled": false,
      "text": "✨ Bridal and festival henna dates are now open! Reserve early on WhatsApp.",
      "ctaText": "Check Availability",
      "ctaUrl": ""
    },
    "seo": {
      "primaryTitle": "Henna by Aayesha | Mehndi Artist in {city}",
      "defaultMetaDescription": "Exquisite bespoke bridal, Arabic, and traditional mehndi designs in {city} / {altCity}. 100% natural organic henna. Appointments exclusively via WhatsApp.",
      "keywords": "Henna by Aayesha, Mehndi Artist {city}, Bridal Mehndi {city}, Organic Henna {city}",
      "ogImage": "/images/hero-bride.jpg",
      "twitterImage": "/images/hero-bride.jpg",
      "canonicalBaseUrl": "https://hennabyaayesha.com",
      "homepageTitle": "Henna by Aayesha | Mehndi Artist in {city}",
      "homepageDescription": "Exquisite bespoke bridal, Arabic, and traditional mehndi designs in {city}. 100% natural organic henna. Appointments booked exclusively via WhatsApp.",
      "servicesTitle": "Mehndi Services & Packages | Henna by Aayesha {city}",
      "servicesDescription": "Explore bridal, sangeet, engagement, and guest mehndi packages in {city}. On-location artist visits.",
      "designsTitle": "Mehndi Design Catalog | Henna by Aayesha",
      "designsDescription": "Browse our curated collection of bridal, Arabic, mandala, and minimal mehndi designs.",
      "contactTitle": "Book Mehndi Appointment | Henna by Aayesha {city}",
      "contactDescription": "Book your bridal or festive henna session in {city} directly on WhatsApp."
    },
    "maintenanceMode": false
  }'::jsonb,
  'ext-settings-seed-v1',
  true,
  'indexed'
) ON CONFLICT (source_type, source_id) DO NOTHING;

-- 10.11. Knowledge Documents Seed: FAQs (Dynamic CMS & RAG Store)
INSERT INTO public.knowledge_documents (
  source_type, source_id, title, content, metadata, content_hash, is_active, indexing_status
) VALUES
(
  'faq',
  'faq-1',
  'Are your henna services available outside Bangalore / Bengaluru?',
  'Frequently Asked Question: Are your henna services available outside Bangalore / Bengaluru?
Category: bangalore
Answer: No. Mehndi services by Henna by Aayesha are currently available exclusively within Bangalore / Bengaluru city limits. Aayesha provides direct on-location artist visits to your residence, hotel, or venue across Bangalore (including Indiranagar, Koramangala, Whitefield, Jayanagar, Sadashivanagar, Hebbal, HSR Layout, etc.).
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.',
  '{"question": "Are your henna services available outside Bangalore / Bengaluru?", "answer": "No. Mehndi services by Henna by Aayesha are currently available exclusively within Bangalore / Bengaluru city limits. Aayesha provides direct on-location artist visits to your residence, hotel, or venue across Bangalore (including Indiranagar, Koramangala, Whitefield, Jayanagar, Sadashivanagar, Hebbal, HSR Layout, etc.).", "category": "bangalore", "display_order": 1, "published": true}'::jsonb,
  'faq-seed-1',
  true,
  'indexed'
),
(
  'faq',
  'faq-2',
  'How do I book an appointment?',
  'Frequently Asked Question: How do I book an appointment?
Category: booking
Answer: All appointments are booked exclusively via WhatsApp. Click any "Book Appointment on WhatsApp" button on this website to start a chat with Aayesha. Please share your event date, event type (Bridal, Sangeet, Engagement, or Individual), time, and location area in Bangalore.
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.',
  '{"question": "How do I book an appointment?", "answer": "All appointments are booked exclusively via WhatsApp. Click any \"Book Appointment on WhatsApp\" button on this website to start a chat with Aayesha. Please share your event date, event type (Bridal, Sangeet, Engagement, or Individual), time, and location area in Bangalore.", "category": "booking", "display_order": 2, "published": true}'::jsonb,
  'faq-seed-2',
  true,
  'indexed'
),
(
  'faq',
  'faq-3',
  'What kind of henna do you use? Is it 100% natural?',
  'Frequently Asked Question: What kind of henna do you use? Is it 100% natural?
Category: general
Answer: Yes, 100% natural and organic. Aayesha hand-mixes each batch using triple-sifted Rajasthani Sojat henna powder, pure water, sugar, and certified 100% pure organic essential oils (eucalyptus and tea tree). There are strictly NO chemicals, NO synthetic dyes, and NO PPD (black henna). It is completely safe for sensitive skin, brides, mothers, and children.
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.',
  '{"question": "What kind of henna do you use? Is it 100% natural?", "answer": "Yes, 100% natural and organic. Aayesha hand-mixes each batch using triple-sifted Rajasthani Sojat henna powder, pure water, sugar, and certified 100% pure organic essential oils (eucalyptus and tea tree). There are strictly NO chemicals, NO synthetic dyes, and NO PPD (black henna). It is completely safe for sensitive skin, brides, mothers, and children.", "category": "general", "display_order": 3, "published": true}'::jsonb,
  'faq-seed-3',
  true,
  'indexed'
),
(
  'faq',
  'faq-4',
  'How many days in advance should bridal mehndi be done?',
  'Frequently Asked Question: How many days in advance should bridal mehndi be done?
Category: booking
Answer: Natural organic henna requires 24 to 48 hours to oxidize and develop its deepest, darkest mahogany/burgundy stain. Therefore, we strongly recommend scheduling your bridal mehndi appointment 2 days (48 hours) prior to your main wedding ceremony.
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.',
  '{"question": "How many days in advance should bridal mehndi be done?", "answer": "Natural organic henna requires 24 to 48 hours to oxidize and develop its deepest, darkest mahogany/burgundy stain. Therefore, we strongly recommend scheduling your bridal mehndi appointment 2 days (48 hours) prior to your main wedding ceremony.", "category": "booking", "display_order": 4, "published": true}'::jsonb,
  'faq-seed-4',
  true,
  'indexed'
),
(
  'faq',
  'faq-5',
  'What should I do after the application to get the darkest stain?',
  'Frequently Asked Question: What should I do after the application to get the darkest stain?
Category: aftercare
Answer: Keep the dry henna paste on for at least 6 to 8 hours (or overnight if possible). Avoid water for the first 24 hours. Scrape off the dried crust gently with a blunt edge or coconut oil (do NOT wash with soap). Warm your hands over clove fumes and apply natural mustard oil or coconut balm to keep the skin warm and protected.
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.',
  '{"question": "What should I do after the application to get the darkest stain?", "answer": "Keep the dry henna paste on for at least 6 to 8 hours (or overnight if possible). Avoid water for the first 24 hours. Scrape off the dried crust gently with a blunt edge or coconut oil (do NOT wash with soap). Warm your hands over clove fumes and apply natural mustard oil or coconut balm to keep the skin warm and protected.", "category": "aftercare", "display_order": 5, "published": true}'::jsonb,
  'faq-seed-5',
  true,
  'indexed'
),
(
  'faq',
  'faq-6',
  'How far in advance should I book my bridal date?',
  'Frequently Asked Question: How far in advance should I book my bridal date?
Category: booking
Answer: Bangalore wedding dates (especially auspicious muhurtham dates between October and February, and May to July) get booked 2 to 4 months in advance. We recommend reaching out on WhatsApp as soon as your wedding dates are finalized to secure your preferred slot.
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.',
  '{"question": "How far in advance should I book my bridal date?", "answer": "Bangalore wedding dates (especially auspicious muhurtham dates between October and February, and May to July) get booked 2 to 4 months in advance. We recommend reaching out on WhatsApp as soon as your wedding dates are finalized to secure your preferred slot.", "category": "booking", "display_order": 6, "published": true}'::jsonb,
  'faq-seed-6',
  true,
  'indexed'
)
ON CONFLICT (source_type, source_id) DO NOTHING;

-- 10.12. Knowledge Documents Seed: Why Choose Us (Dynamic CMS & RAG Store)
INSERT INTO public.knowledge_documents (
  source_type, source_id, title, content, metadata, content_hash, is_active, indexing_status
) VALUES
(
  'why_choose_us',
  'wcu-1',
  '100% Organic Henna Cones',
  'Why Choose Henna by Aayesha: 100% Organic Henna Cones.
Hand-crafted using certified Rajasthani Sojat powder and pure essential oils. Zero chemicals, zero PPD, and guaranteed rich natural stain.',
  '{"id": "wcu-1", "icon": "🌿", "title": "100% Organic Henna Cones", "description": "Hand-crafted using certified Rajasthani Sojat powder and pure essential oils. Zero chemicals, zero PPD, and guaranteed rich natural stain.", "display_order": 1, "published": true}'::jsonb,
  'wcu-seed-1',
  true,
  'indexed'
),
(
  'why_choose_us',
  'wcu-2',
  'Bespoke Storytelling Artistry',
  'Why Choose Henna by Aayesha: Bespoke Storytelling Artistry.
Custom motifs integrating your unique courtship story, wedding dates, portraits, and delicate jharokha architectural arches.',
  '{"id": "wcu-2", "icon": "✨", "title": "Bespoke Storytelling Artistry", "description": "Custom motifs integrating your unique courtship story, wedding dates, portraits, and delicate jharokha architectural arches.", "display_order": 2, "published": true}'::jsonb,
  'wcu-seed-2',
  true,
  'indexed'
),
(
  'why_choose_us',
  'wcu-3',
  'Direct On-Location Travel',
  'Why Choose Henna by Aayesha: Direct On-Location Travel.
Punctual doorstep artist visits to your residence, hotel suite, or wedding venue across the city without hassle.',
  '{"id": "wcu-3", "icon": "📍", "title": "Direct On-Location Travel", "description": "Punctual doorstep artist visits to your residence, hotel suite, or wedding venue across the city without hassle.", "display_order": 3, "published": true}'::jsonb,
  'wcu-seed-3',
  true,
  'indexed'
),
(
  'why_choose_us',
  'wcu-4',
  'Calm & Unhurried Experience',
  'Why Choose Henna by Aayesha: Calm & Unhurried Experience.
Patient, mindful application allowing brides and families to relax comfortably during long sittings with full personal attention.',
  '{"id": "wcu-4", "icon": "🕊️", "title": "Calm & Unhurried Experience", "description": "Patient, mindful application allowing brides and families to relax comfortably during long sittings with full personal attention.", "display_order": 4, "published": true}'::jsonb,
  'wcu-seed-4',
  true,
  'indexed'
),
(
  'why_choose_us',
  'wcu-5',
  'Transparent WhatsApp Booking',
  'Why Choose Henna by Aayesha: Transparent WhatsApp Booking.
Direct one-on-one communication with Aayesha for instant date checks, transparent package quotes, and personalized advice.',
  '{"id": "wcu-5", "icon": "💬", "title": "Transparent WhatsApp Booking", "description": "Direct one-on-one communication with Aayesha for instant date checks, transparent package quotes, and personalized advice.", "display_order": 5, "published": true}'::jsonb,
  'wcu-seed-5',
  true,
  'indexed'
),
(
  'why_choose_us',
  'wcu-6',
  'Hygienic & Skin-Safe',
  'Why Choose Henna by Aayesha: Hygienic & Skin-Safe.
Strict hygiene standards with sterilized tips, fresh cones for every client, and completely chemical-free natural ingredients.',
  '{"id": "wcu-6", "icon": "🛡️", "title": "Hygienic & Skin-Safe", "description": "Strict hygiene standards with sterilized tips, fresh cones for every client, and completely chemical-free natural ingredients.", "display_order": 6, "published": true}'::jsonb,
  'wcu-seed-6',
  true,
  'indexed'
)
ON CONFLICT (source_type, source_id) DO NOTHING;

-- ==============================================================================
-- END OF CANONICAL SCHEMA (schema.sql)
-- ==============================================================================
