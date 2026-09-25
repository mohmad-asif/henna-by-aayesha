import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { TrackingPayload } from '@/types/analytics';

export const dynamic = 'force-dynamic';

const KNOWN_BOTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'applebot',
  'whatsapp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'skypeuripreview',
  'nuzzel',
  'discordbot',
  'google page speed',
  'qwantify',
  'pinterestbot',
  'bitrix link preview',
  'xing-contenttabreceiver',
  'chrome-lighthouse',
  'telegrambot',
];

function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return KNOWN_BOTS.some((bot) => lower.includes(bot));
}

function resolveApproximateLocation(
  request: NextRequest,
  timezone?: string
): { country: string; region: string; city: string; display: string } {
  // Check standard CDN & cloud proxy headers
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country') ||
    '';

  const region =
    request.headers.get('x-vercel-ip-country-region') ||
    request.headers.get('cf-region') ||
    request.headers.get('x-region') ||
    '';

  const city =
    request.headers.get('x-vercel-ip-city') ||
    request.headers.get('cf-ipcity') ||
    request.headers.get('x-city') ||
    '';

  if (city && region && country) {
    return {
      country,
      region,
      city,
      display: `${decodeURIComponent(city)}, ${decodeURIComponent(region)}, ${country}`,
    };
  }

  if (city && country) {
    return {
      country,
      region: '',
      city,
      display: `${decodeURIComponent(city)}, ${country}`,
    };
  }

  if (country) {
    return {
      country,
      region: '',
      city: '',
      display: country,
    };
  }

  // Fallback: estimate from client-provided timezone
  if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
    return {
      country: 'India',
      region: 'Karnataka',
      city: 'Bengaluru',
      display: 'Bengaluru, Karnataka, India',
    };
  }

  if (timezone?.startsWith('Asia/')) {
    const tzCity = timezone.replace('Asia/', '').replace('_', ' ');
    return {
      country: 'Asia',
      region: '',
      city: tzCity,
      display: `${tzCity}, Asia`,
    };
  }

  if (timezone?.startsWith('Europe/')) {
    const tzCity = timezone.replace('Europe/', '').replace('_', ' ');
    return {
      country: 'Europe',
      region: '',
      city: tzCity,
      display: `${tzCity}, Europe`,
    };
  }

  if (timezone?.startsWith('America/')) {
    const tzCity = timezone.replace('America/', '').replace('_', ' ');
    return {
      country: 'Americas',
      region: '',
      city: tzCity,
      display: `${tzCity}, Americas`,
    };
  }

  return {
    country: 'India',
    region: 'Karnataka',
    city: 'Bengaluru',
    display: 'Bengaluru, Karnataka, India',
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check if caller is an authenticated admin user; if so, do not pollute public visitor analytics!
    const adminAuth = await verifyAdminAuth(request);
    if (adminAuth) {
      return NextResponse.json({ success: true, ignored: 'admin_traffic' });
    }

    const payload = (await request.json()) as TrackingPayload;

    if (!payload || !payload.visitorId || !payload.sessionId || !payload.urlPath) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    // Do not track admin path URLs
    if (payload.urlPath.startsWith('/admin')) {
      return NextResponse.json({ success: true, ignored: 'admin_path' });
    }

    const ua = request.headers.get('user-agent');
    const isBot = isBotUserAgent(ua);

    // If it's a known bot, ignore or flag without inflating real metrics
    if (isBot && payload.type === 'pageview') {
      return NextResponse.json({ success: true, ignored: 'bot_traffic' });
    }

    const supabase = await getAdminSupabaseClient();
    const nowIso = new Date().toISOString();
    const location = resolveApproximateLocation(request, payload.clientInfo?.timezone);

    const deviceType = payload.clientInfo?.deviceType || 'desktop';
    const browser = payload.clientInfo?.browser || 'Unknown';
    const os = payload.clientInfo?.os || 'Unknown';
    const screenSize = payload.clientInfo?.screenSize || null;
    const language = payload.clientInfo?.language || 'en';
    const timezone = payload.clientInfo?.timezone || 'UTC';

    // 2. Handle Visitor Record
    if (payload.type === 'pageview' || payload.type === 'session_init') {
      const { data: existingVisitor } = await supabase
        .from('visitors')
        .select('visitor_id, visit_count, page_views_count')
        .eq('visitor_id', payload.visitorId)
        .maybeSingle();

      if (!existingVisitor) {
        // Create new visitor
        await supabase.from('visitors').insert({
          visitor_id: payload.visitorId,
          first_visit_at: nowIso,
          last_visit_at: nowIso,
          last_active_at: nowIso,
          visit_count: 1,
          page_views_count: 1,
          device_type: deviceType,
          browser,
          os,
          screen_size: screenSize,
          language,
          timezone,
          country: location.country,
          region: location.region,
          city: location.city,
          location_display: location.display,
          initial_referrer: payload.referrer || null,
          initial_source: payload.utm?.source || (payload.referrer ? 'Referral' : 'Direct'),
          initial_utm_source: payload.utm?.source || null,
          initial_utm_medium: payload.utm?.medium || null,
          initial_utm_campaign: payload.utm?.campaign || null,
          landing_page: payload.urlPath,
          last_page: payload.urlPath,
          is_bot: isBot,
        });
      } else {
        // Update existing visitor
        const isNewVisit = payload.isNewSession === true;
        const newVisitCount = isNewVisit ? existingVisitor.visit_count + 1 : existingVisitor.visit_count;
        const newPageViewsCount =
          payload.type === 'pageview'
            ? existingVisitor.page_views_count + 1
            : existingVisitor.page_views_count;

        await supabase
          .from('visitors')
          .update({
            last_visit_at: isNewVisit ? nowIso : undefined,
            last_active_at: nowIso,
            visit_count: newVisitCount,
            page_views_count: newPageViewsCount,
            last_page: payload.urlPath,
            device_type: deviceType,
            browser,
            os,
            updated_at: nowIso,
          })
          .eq('visitor_id', payload.visitorId);
      }

      // 3. Handle Session Record
      const { data: existingSession } = await supabase
        .from('visitor_sessions')
        .select('session_id, page_views_count, duration_seconds')
        .eq('session_id', payload.sessionId)
        .maybeSingle();

      if (!existingSession) {
        await supabase.from('visitor_sessions').insert({
          session_id: payload.sessionId,
          visitor_id: payload.visitorId,
          started_at: nowIso,
          last_active_at: nowIso,
          page_views_count: 1,
          landing_page: payload.urlPath,
          exit_page: payload.urlPath,
          referrer: payload.referrer || null,
          utm_source: payload.utm?.source || null,
          utm_medium: payload.utm?.medium || null,
          utm_campaign: payload.utm?.campaign || null,
          utm_term: payload.utm?.term || null,
          utm_content: payload.utm?.content || null,
          device_type: deviceType,
          browser,
          os,
        });
      } else {
        await supabase
          .from('visitor_sessions')
          .update({
            last_active_at: nowIso,
            exit_page: payload.urlPath,
            page_views_count:
              payload.type === 'pageview'
                ? existingSession.page_views_count + 1
                : existingSession.page_views_count,
            updated_at: nowIso,
          })
          .eq('session_id', payload.sessionId);
      }

      // 4. Record Page View
      if (payload.type === 'pageview') {
        await supabase.from('page_views').insert({
          session_id: payload.sessionId,
          visitor_id: payload.visitorId,
          url_path: payload.urlPath,
          page_title: payload.pageTitle || 'Henna by Aayesha',
          referrer: payload.referrer || null,
          device_type: deviceType,
          time_spent_seconds: 0,
        });
      }
    } else if (payload.type === 'event' && payload.eventName) {
      // 5. Handle Business Event
      // Ensure visitor & session exist or update last active
      await supabase
        .from('visitors')
        .update({ last_active_at: nowIso, updated_at: nowIso })
        .eq('visitor_id', payload.visitorId);

      await supabase
        .from('visitor_sessions')
        .update({ last_active_at: nowIso, updated_at: nowIso })
        .eq('session_id', payload.sessionId);

      await supabase.from('visitor_events').insert({
        session_id: payload.sessionId,
        visitor_id: payload.visitorId,
        event_name: payload.eventName,
        url_path: payload.urlPath,
        properties: payload.eventProperties || {},
      });
    } else if (payload.type === 'heartbeat') {
      // 6. Handle Heartbeat (keeps live status and accumulates duration)
      await supabase
        .from('visitors')
        .update({ last_active_at: nowIso, updated_at: nowIso })
        .eq('visitor_id', payload.visitorId);

      if (payload.timeSpentSeconds && payload.timeSpentSeconds > 0) {
        const { data: session } = await supabase
          .from('visitor_sessions')
          .select('duration_seconds')
          .eq('session_id', payload.sessionId)
          .maybeSingle();

        if (session) {
          await supabase
            .from('visitor_sessions')
            .update({
              last_active_at: nowIso,
              duration_seconds: Math.max(session.duration_seconds, payload.timeSpentSeconds),
              updated_at: nowIso,
            })
            .eq('session_id', payload.sessionId);
        }
      } else {
        await supabase
          .from('visitor_sessions')
          .update({ last_active_at: nowIso, updated_at: nowIso })
          .eq('session_id', payload.sessionId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Analytics Track API Error]:', err);
    return NextResponse.json(
      { error: 'Failed to record tracking payload' },
      { status: 500 }
    );
  }
}
