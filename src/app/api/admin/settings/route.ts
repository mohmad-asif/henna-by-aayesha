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

  const dbClient = auth.client;

  try {
    const body = await request.json();

    // Fetch existing site settings to allow partial updates without wiping fields
    const { data: currentSettings } = await dbClient
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    // 1. WhatsApp Validation & Normalization
    let finalPhoneDisplay = currentSettings?.whatsapp_number || '+91 98765 43210';
    let finalPhoneRaw = currentSettings?.whatsapp_raw || '919876543210';

    if (body.whatsapp_number !== undefined || body.whatsapp_raw !== undefined) {
      const rawInputPhone = body.whatsapp_number || body.whatsapp_raw || '';
      if (!rawInputPhone.trim()) {
        return NextResponse.json(
          { error: 'WhatsApp phone number cannot be empty.' },
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
      finalPhoneDisplay = phone.display;
      finalPhoneRaw = phone.raw;
    }

    // 2. Instagram Validation & Normalization
    let finalInstaUrl = currentSettings?.instagram_url ?? '';
    const rawInstagram =
      body.instagram_url !== undefined
        ? body.instagram_url
        : body.instagram_input !== undefined
        ? body.instagram_input
        : body.instagram_handle;

    if (rawInstagram !== undefined) {
      if (rawInstagram && typeof rawInstagram === 'string' && rawInstagram.trim().length > 0) {
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
        finalInstaUrl = insta.url;
      } else {
        finalInstaUrl = '';
      }
    }

    // 3. Email Validation
    let finalEmail = currentSettings?.email || 'hello@hennabyaayesha.com';
    if (body.email !== undefined) {
      const email = (body.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Please provide a valid contact email address.' },
          { status: 400 }
        );
      }
      finalEmail = email;
    }

    // 4. Update Extended Settings if provided
    const { saveExtendedSiteSettings, getExtendedSiteSettings } = await import(
      '@/lib/supabase/extended-settings'
    );

    let extendedData = null;
    const hasExtendedData =
      body.location !== undefined ||
      body.hero !== undefined ||
      body.sections !== undefined ||
      body.socialLinks !== undefined ||
      body.navigation !== undefined ||
      body.footer !== undefined ||
      body.promo !== undefined ||
      body.seo !== undefined ||
      typeof body.maintenanceMode === 'boolean';

    if (hasExtendedData) {
      // Synchronize timing in location payload if present
      const locationPayload = body.location ? { ...body.location } : undefined;
      if (locationPayload) {
        const hours = locationPayload.businessHours || locationPayload.operatingHours;
        if (hours) {
          locationPayload.businessHours = hours;
          locationPayload.operatingHours = hours;
        }
      }

      extendedData = await saveExtendedSiteSettings(
        {
          location: locationPayload,
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
    const computedLocation = extendedData.location.city
      ? `${extendedData.location.city} / ${extendedData.location.altCity}, ${extendedData.location.state}, ${extendedData.location.country}`
      : body.location?.city
      ? `${body.location.city}, ${body.location.state || ''}`
      : currentSettings?.location || 'Bengaluru / Bangalore, Karnataka, India';

    const updatePayload: Partial<DbSiteSettings> = {
      id: 1,
      business_name:
        body.business_name !== undefined
          ? (body.business_name || '').trim()
          : currentSettings?.business_name || 'Henna by Aayesha',
      tagline:
        body.tagline !== undefined
          ? (body.tagline || '').trim()
          : currentSettings?.tagline || '',
      whatsapp_number: finalPhoneDisplay,
      whatsapp_raw: finalPhoneRaw,
      whatsapp_message:
        body.whatsapp_message !== undefined
          ? (body.whatsapp_message || '').trim()
          : currentSettings?.whatsapp_message ||
            `Hi Aayesha, I would like to book a mehndi appointment in ${extendedData.location.city}. Please share your availability and details.`,
      email: finalEmail,
      location: computedLocation,
      short_description:
        body.short_description !== undefined
          ? (body.short_description || '').trim()
          : currentSettings?.short_description || '',
      about_description:
        body.about_description !== undefined
          ? (body.about_description || '').trim()
          : currentSettings?.about_description || '',
      instagram_url: finalInstaUrl,
      facebook_url:
        body.facebook_url !== undefined
          ? (body.facebook_url || '').trim()
          : currentSettings?.facebook_url || '',
      website_url:
        body.website_url !== undefined
          ? (body.website_url || '').trim()
          : currentSettings?.website_url || 'https://hennabyaayesha.com',
      primary_cta_text:
        body.primary_cta_text !== undefined
          ? (body.primary_cta_text || '').trim()
          : currentSettings?.primary_cta_text || 'Book Appointment on WhatsApp',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await dbClient
      .from('site_settings')
      .upsert(updatePayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Admin Settings API] Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: `Database error updating settings: ${error.message}` },
        { status: 500 }
      );
    }

    // 6. Targeted cache invalidation across the public website
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
