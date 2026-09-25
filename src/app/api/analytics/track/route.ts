import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { resolveClientIp } from '@/lib/analytics/ip-resolver';
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
    const clientIp = resolveClientIp(request);

    if (clientIp) {
      console.log('[Analytics Track] Resolved client IP:', clientIp);
    } else {
      console.log('[Analytics Track] Public IP not present in trusted headers (local or missing)');
    }

    const deviceType = payload.clientInfo?.deviceType || 'desktop';
    const browser = payload.clientInfo?.browser || 'Unknown';
    const os = payload.clientInfo?.os || 'Unknown';
    const screenSize = payload.clientInfo?.screenSize || null;
    const language = payload.clientInfo?.language || 'en';
    const timezone = payload.clientInfo?.timezone || 'UTC';

    // 2. Primary Execution: Use atomic SECURITY DEFINER RPC function if available
    let { error: rpcError } = await supabase.rpc('record_visitor_activity', {
      p_type: payload.type,
      p_visitor_id: payload.visitorId,
      p_session_id: payload.sessionId,
      p_url_path: payload.urlPath,
      p_page_title: payload.pageTitle || 'Henna by Aayesha',
      p_referrer: payload.referrer || null,
      p_is_new_session: payload.isNewSession === true,
      p_device_type: deviceType,
      p_browser: browser,
      p_os: os,
      p_screen_size: screenSize,
      p_language: language,
      p_timezone: timezone,
      p_country: location.country,
      p_region: location.region,
      p_city: location.city,
      p_location_display: location.display,
      p_utm_source: payload.utm?.source || null,
      p_utm_medium: payload.utm?.medium || null,
      p_utm_campaign: payload.utm?.campaign || null,
      p_utm_term: payload.utm?.term || null,
      p_utm_content: payload.utm?.content || null,
      p_event_name: payload.eventName || null,
      p_event_properties: payload.eventProperties || {},
      p_time_spent_seconds: payload.timeSpentSeconds || 0,
      p_ip_address: clientIp,
    });

    // If RPC failed due to parameter mismatch (e.g. database schema lacks p_ip_address parameter),
    // retry calling the legacy RPC signature without p_ip_address and persist IP via direct update
    if (rpcError && rpcError.code === 'PGRST202') {
      const { error: legacyRpcErr } = await supabase.rpc('record_visitor_activity', {
        p_type: payload.type,
        p_visitor_id: payload.visitorId,
        p_session_id: payload.sessionId,
        p_url_path: payload.urlPath,
        p_page_title: payload.pageTitle || 'Henna by Aayesha',
        p_referrer: payload.referrer || null,
        p_is_new_session: payload.isNewSession === true,
        p_device_type: deviceType,
        p_browser: browser,
        p_os: os,
        p_screen_size: screenSize,
        p_language: language,
        p_timezone: timezone,
        p_country: location.country,
        p_region: location.region,
        p_city: location.city,
        p_location_display: location.display,
        p_utm_source: payload.utm?.source || null,
        p_utm_medium: payload.utm?.medium || null,
        p_utm_campaign: payload.utm?.campaign || null,
        p_utm_term: payload.utm?.term || null,
        p_utm_content: payload.utm?.content || null,
        p_event_name: payload.eventName || null,
        p_event_properties: payload.eventProperties || {},
        p_time_spent_seconds: payload.timeSpentSeconds || 0,
      });

      if (!legacyRpcErr) {
        rpcError = null;
        if (clientIp) {
          const { error: ipUpdErr } = await supabase
            .from('visitors')
            .update({ ip_address: clientIp })
            .eq('visitor_id', payload.visitorId);
          if (ipUpdErr && ipUpdErr.code !== '42703') {
            console.error('[Analytics Track] Error updating visitor ip_address:', {
              message: ipUpdErr.message,
              code: ipUpdErr.code,
              details: ipUpdErr.details,
              hint: ipUpdErr.hint,
            });
          }
          await supabase
            .from('visitor_sessions')
            .update({ ip_address: clientIp })
            .eq('session_id', payload.sessionId);
        }
      } else {
        rpcError = legacyRpcErr;
      }
    }

    if (!rpcError) {
      return NextResponse.json({ success: true, via: 'rpc', ipCaptured: !!clientIp });
    }

    console.warn('[Analytics Track RPC fallback to direct]:', rpcError.message);

    // 3. Fallback: Direct Table Queries (upsert / insert with proper error logging)
    if (payload.type === 'pageview' || payload.type === 'session_init') {
      // 3.1. Upsert Visitor Record
      const visitorPayload: Record<string, unknown> = {
        visitor_id: payload.visitorId,
        last_visit_at: nowIso,
        last_active_at: nowIso,
        landing_page: payload.urlPath,
        last_page: payload.urlPath,
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
        is_bot: isBot,
      };

      if (clientIp) {
        visitorPayload.ip_address = clientIp;
      }

      let { error: visErr } = await supabase.from('visitors').upsert(
        visitorPayload,
        { onConflict: 'visitor_id' }
      );

      // If ip_address column does not exist in DB yet (code 42703), retry without it
      if (visErr && visErr.code === '42703' && visitorPayload.ip_address) {
        console.warn('[Analytics Track] column visitors.ip_address does not exist in DB yet. Upserting without ip_address...');
        delete visitorPayload.ip_address;
        const { error: retryVisErr } = await supabase.from('visitors').upsert(
          visitorPayload,
          { onConflict: 'visitor_id' }
        );
        visErr = retryVisErr;
      }

      if (visErr) {
        console.error('[Analytics Track] Failed to upsert visitor:', {
          message: visErr.message,
          code: visErr.code,
          details: visErr.details,
          hint: visErr.hint,
        });
      }

      // 3.2. Upsert Session Record
      const sessionPayload: Record<string, unknown> = {
        session_id: payload.sessionId,
        visitor_id: payload.visitorId,
        last_active_at: nowIso,
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
      };

      if (clientIp) {
        sessionPayload.ip_address = clientIp;
      }

      let { error: sessErr } = await supabase.from('visitor_sessions').upsert(
        sessionPayload,
        { onConflict: 'session_id' }
      );

      if (sessErr && sessErr.code === '42703' && sessionPayload.ip_address) {
        delete sessionPayload.ip_address;
        const { error: retrySessErr } = await supabase.from('visitor_sessions').upsert(
          sessionPayload,
          { onConflict: 'session_id' }
        );
        sessErr = retrySessErr;
      }

      if (sessErr) {
        console.error('[Analytics Track] Failed to upsert session:', {
          message: sessErr.message,
          code: sessErr.code,
          details: sessErr.details,
          hint: sessErr.hint,
        });
      }

      // 3.3. Record Page View
      if (payload.type === 'pageview') {
        const { error: pvErr } = await supabase.from('page_views').insert({
          session_id: payload.sessionId,
          visitor_id: payload.visitorId,
          url_path: payload.urlPath,
          page_title: payload.pageTitle || 'Henna by Aayesha',
          referrer: payload.referrer || null,
          device_type: deviceType,
          time_spent_seconds: 0,
        });

        if (pvErr) {
          console.error('[Analytics Track] Failed to insert page_view:', pvErr);
        }
      }
    } else if (payload.type === 'event' && payload.eventName) {
      // 3.4. Handle Business Event
      await supabase
        .from('visitors')
        .update({ last_active_at: nowIso, updated_at: nowIso })
        .eq('visitor_id', payload.visitorId);

      await supabase
        .from('visitor_sessions')
        .update({ last_active_at: nowIso, updated_at: nowIso })
        .eq('session_id', payload.sessionId);

      const { error: evErr } = await supabase.from('visitor_events').insert({
        session_id: payload.sessionId,
        visitor_id: payload.visitorId,
        event_name: payload.eventName,
        url_path: payload.urlPath,
        properties: payload.eventProperties || {},
      });

      if (evErr) {
        console.error('[Analytics Track] Failed to insert visitor_event:', evErr);
      }
    } else if (payload.type === 'heartbeat') {
      // 3.5. Handle Heartbeat
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
              duration_seconds: Math.max(session.duration_seconds || 0, payload.timeSpentSeconds),
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

    return NextResponse.json({ success: true, via: 'fallback' });
  } catch (err: unknown) {
    console.error('[Analytics Track API Error]:', err);
    return NextResponse.json(
      { error: 'Failed to record tracking payload' },
      { status: 500 }
    );
  }
}
