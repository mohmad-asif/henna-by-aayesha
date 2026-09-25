export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { normalizeWhatsAppPhone, normalizeInstagram } from '@/lib/settings/contact';
import { DbSiteSettings } from '@/types/database';

import { verifyAdminAuth } from '@/lib/auth/admin-api';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const [coreRes, extended] = await Promise.all([
      auth.client.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      import('@/lib/supabase/extended-settings').then((m) => m.getExtendedSiteSettings()),
    ]);

    if (coreRes.error) {
      return NextResponse.json({ error: coreRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: coreRes.data,
      extended,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // 1. WhatsApp Validation & Normalization
    const rawInputPhone = body.whatsapp_number || body.whatsapp_raw || '';
    if (!rawInputPhone) {
      return NextResponse.json(
        { error: 'WhatsApp phone number is required.' },
        { status: 400 }
      );
    }

    const phone = normalizeWhatsAppPhone(rawInputPhone);
    if (!phone.isValid || !phone.raw) {
      return NextResponse.json(
        {
          error:
            'Invalid WhatsApp number. Please provide a valid phone number with 7-15 digits (e.g. +91 98765 43210 or 9876543210).',
        },
        { status: 400 }
      );
    }

    // 2. Instagram Validation & Normalization
    const rawInstagram = body.instagram_url || body.instagram_handle || '';
    let instaUrl = '';
    if (rawInstagram && rawInstagram.trim().length > 0) {
      const insta = normalizeInstagram(rawInstagram);
      if (!insta.isValid || !insta.handle) {
        return NextResponse.json(
          {
            error:
              'Invalid Instagram handle. Handle must contain only letters, numbers, periods, and underscores (max 30 characters).',
          },
          { status: 400 }
        );
      }
      instaUrl = insta.url;
    }

    // 3. Email Validation
    const email = (body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid contact email address.' },
        { status: 400 }
      );
    }

    // 4. Update Extended Settings if provided
    const { saveExtendedSiteSettings, getExtendedSiteSettings } = await import(
      '@/lib/supabase/extended-settings'
    );

    let extendedData = null;
    if (
      body.location ||
      body.hero ||
      body.sections ||
      body.socialLinks ||
      body.navigation ||
      body.footer ||
      body.promo ||
      body.seo ||
      typeof body.maintenanceMode === 'boolean'
    ) {
      extendedData = await saveExtendedSiteSettings(
        {
          location: body.location,
          hero: body.hero,
          sections: body.sections,
          socialLinks: body.socialLinks,
          navigation: body.navigation,
          footer: body.footer,
          promo: body.promo,
          seo: body.seo,
          maintenanceMode: body.maintenanceMode,
        },
        auth.client
      );
    } else {
      extendedData = await getExtendedSiteSettings();
    }

    // 5. Update Core Database Record
    const dbClient = auth.client;
    const computedLocation = extendedData.location.city
      ? `${extendedData.location.city} / ${extendedData.location.altCity}, ${extendedData.location.state}, ${extendedData.location.country}`
      : body.location || 'Bengaluru / Bangalore, Karnataka, India';

    const updatePayload: Partial<DbSiteSettings> = {
      id: 1,
      business_name: (body.business_name || 'Henna by Aayesha').trim(),
      tagline: (body.tagline || '').trim(),
      whatsapp_number: phone.display,
      whatsapp_raw: phone.raw,
      whatsapp_message: (
        body.whatsapp_message ||
        `Hi Aayesha, I would like to book a mehndi appointment in ${extendedData.location.city}. Please share your availability and details.`
      ).trim(),
      email,
      location: computedLocation,
      short_description: (body.short_description || '').trim(),
      about_description: (body.about_description || '').trim(),
      instagram_url: instaUrl,
      facebook_url: (body.facebook_url || '').trim(),
      website_url: (body.website_url || 'https://hennabyaayesha.com').trim(),
      primary_cta_text: (body.primary_cta_text || 'Book Appointment on WhatsApp').trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await dbClient
      .from('site_settings')
      .upsert(updatePayload)
      .select()
      .single();

    if (error) {
      console.error('[Admin Settings API] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 6. Targeted cache invalidation across the entire public website
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/contact');
      revalidatePath('/services');
      revalidatePath('/mehndi-designs');
      revalidatePath('/gallery');
      revalidatePath('/testimonials');
      revalidatePath('/about');
    } catch (revalidateErr) {
      console.warn('[Admin Settings API] revalidatePath warning:', revalidateErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Site settings updated successfully. Cache invalidated.',
      settings: data,
      extended: extendedData,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Admin Settings API] Unexpected error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
