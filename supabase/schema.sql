-- ==============================================================================
-- Henna by Aayesha - Supabase Database Schema & RLS Setup
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SITE SETTINGS TABLE (Singleton)
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

-- 3. SERVICES TABLE
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

-- 4. MEHNDI DESIGNS TABLE
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

-- 5. GALLERY TABLE
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

-- 6. TESTIMONIALS TABLE
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

-- 7. ADMIN PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mehndi_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- SITE SETTINGS POLICIES:
-- Anyone (public) can read settings
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Authenticated admins can update settings
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SERVICES POLICIES:
-- Public can only view active services; Admins can view all
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

-- Admins can create/edit/delete services
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MEHNDI DESIGNS POLICIES:
-- Public can view active designs; Admins can view all
DROP POLICY IF EXISTS "Public can view active designs" ON public.mehndi_designs;
CREATE POLICY "Public can view active designs"
  ON public.mehndi_designs FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

-- Admins can create/edit/delete designs
DROP POLICY IF EXISTS "Admins can manage designs" ON public.mehndi_designs;
CREATE POLICY "Admins can manage designs"
  ON public.mehndi_designs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- GALLERY POLICIES:
-- Public can view active gallery items; Admins can view all
DROP POLICY IF EXISTS "Public can view active gallery" ON public.gallery;
CREATE POLICY "Public can view active gallery"
  ON public.gallery FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

-- Admins can manage gallery
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;
CREATE POLICY "Admins can manage gallery"
  ON public.gallery FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- TESTIMONIALS POLICIES:
-- Public can view active testimonials; Admins can view all
DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;
CREATE POLICY "Public can view active testimonials"
  ON public.testimonials FOR SELECT
  USING (active = true OR (SELECT auth.role()) = 'authenticated');

-- Admins can manage testimonials
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ADMIN PROFILES POLICIES:
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

-- ==============================================================================
-- STORAGE BUCKET CREATION & POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('henna-images', 'henna-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can view images in henna-images bucket
DROP POLICY IF EXISTS "Public can read henna-images" ON storage.objects;
CREATE POLICY "Public can read henna-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'henna-images');

-- Authenticated admins can upload images
DROP POLICY IF EXISTS "Admins can upload to henna-images" ON storage.objects;
CREATE POLICY "Admins can upload to henna-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'henna-images');

-- Authenticated admins can update/delete images
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

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Seed Site Settings
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

-- Seed Mehndi Designs
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

-- Seed Services
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

-- Seed Gallery
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

-- Seed Testimonials
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
