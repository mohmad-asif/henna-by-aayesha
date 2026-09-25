import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { AnalyticsOverview, AnalyticsSettings, Visitor, VisitorSession, PageView, VisitorEvent } from '@/types/analytics';

export interface DateFilter {
  startDate?: string;
  endDate?: string;
  range?: string; // 'today' | '7d' | '30d' | '90d' | 'all'
}

export function getDateCutoff(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = filter.endDate ? new Date(filter.endDate) : now;
  let start = new Date();

  if (filter.startDate) {
    start = new Date(filter.startDate);
  } else {
    switch (filter.range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        start = new Date(2020, 0, 1);
        break;
    }
  }

  return { start, end };
}

export async function getAnalyticsOverview(filter: DateFilter): Promise<AnalyticsOverview & { settings: AnalyticsSettings }> {
  const supabase = await getAdminSupabaseClient();
  const { start, end } = getDateCutoff(filter);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const now = new Date();
  const todayStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fiveMinutesAgoIso = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  // 1. Total & Filtered Visitors
  const { count: totalVisitorsCount } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true });

  const { count: todayVisitorsCount } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', todayStartIso);

  const { count: last7DaysVisitorsCount } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', sevenDaysAgoIso);

  const { count: last30DaysVisitorsCount } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', thirtyDaysAgoIso);

  // 2. Live Active Visitors (active in last 5 minutes)
  const { count: liveActiveCount } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', fiveMinutesAgoIso);

  // 3. Page Views Count
  const { count: totalPageViewsCount } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startIso)
    .lte('created_at', endIso);

  // 4. Visitors query for charts & breakdowns within date window
  const { data: windowVisitors } = await supabase
    .from('visitors')
    .select('*')
    .gte('last_active_at', startIso)
    .lte('last_active_at', endIso)
    .order('last_active_at', { ascending: false })
    .limit(2000);

  // 5. Events query within date window
  const { data: windowEvents } = await supabase
    .from('visitor_events')
    .select('*')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(2000);

  // 6. Page views within date window
  const { data: windowPageViews } = await supabase
    .from('page_views')
    .select('*')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(3000);

  // Calculate event counters
  const eventCounts: Record<string, number> = {};
  let whatsappClicks = 0;
  let appointmentClicks = 0;
  let aiAssistantOpens = 0;
  let aiMessagesSent = 0;
  let instagramClicks = 0;
  let emailClicks = 0;

  (windowEvents || []).forEach((ev) => {
    const name = ev.event_name;
    eventCounts[name] = (eventCounts[name] || 0) + 1;

    if (name.includes('WhatsApp')) whatsappClicks++;
    else if (name.includes('Appointment')) appointmentClicks++;
    else if (name.includes('AI Assistant opened')) aiAssistantOpens++;
    else if (name.includes('AI Assistant message')) aiMessagesSent++;
    else if (name.includes('Instagram')) instagramClicks++;
    else if (name.includes('Email')) emailClicks++;
  });

  // Calculate daily trend
  const dailyMap: Record<string, { visitors: Set<string>; pageViews: number }> = {};
  // Pre-populate days
  const daysDiff = Math.max(1, Math.min(30, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))));
  for (let i = daysDiff - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = { visitors: new Set(), pageViews: 0 };
  }

  (windowVisitors || []).forEach((v) => {
    const dateKey = v.last_active_at.split('T')[0];
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].visitors.add(v.visitor_id);
    }
  });

  (windowPageViews || []).forEach((pv) => {
    const dateKey = pv.created_at.split('T')[0];
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].pageViews++;
    }
  });

  const visitorsByDay = Object.keys(dailyMap)
    .sort()
    .map((dateKey) => {
      const parts = dateKey.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: dateKey,
        displayDate,
        visitors: dailyMap[dateKey].visitors.size,
        pageViews: dailyMap[dateKey].pageViews,
      };
    });

  // Calculate Top Pages
  const pageMap: Record<string, { views: number; visitors: Set<string>; totalTime: number; title: string }> = {};
  (windowPageViews || []).forEach((pv) => {
    const path = pv.url_path || '/';
    if (!pageMap[path]) {
      pageMap[path] = { views: 0, visitors: new Set(), totalTime: 0, title: pv.page_title || path };
    }
    pageMap[path].views++;
    pageMap[path].visitors.add(pv.visitor_id);
    pageMap[path].totalTime += pv.time_spent_seconds || 0;
  });

  const topPages = Object.keys(pageMap)
    .map((path) => {
      const item = pageMap[path];
      return {
        urlPath: path,
        title: item.title,
        views: item.views,
        visitors: item.visitors.size,
        avgDurationSeconds: item.views > 0 ? Math.round(item.totalTime / item.views) : 0,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Top Landing Pages & Exit Pages
  const landingMap: Record<string, number> = {};
  const exitMap: Record<string, number> = {};
  (windowVisitors || []).forEach((v) => {
    landingMap[v.landing_page] = (landingMap[v.landing_page] || 0) + 1;
    exitMap[v.last_page] = (exitMap[v.last_page] || 0) + 1;
  });

  const topLandingPages = Object.entries(landingMap)
    .map(([urlPath, count]) => ({ urlPath, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topExitPages = Object.entries(exitMap)
    .map(([urlPath, count]) => ({ urlPath, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Devices Breakdown
  const deviceMap: Record<string, number> = {};
  const browserMap: Record<string, number> = {};
  const osMap: Record<string, number> = {};
  const sourceMap: Record<string, number> = {};
  const locationMap: Record<string, number> = {};
  const totalInWindow = (windowVisitors || []).length || 1;

  (windowVisitors || []).forEach((v) => {
    const dev = (v.device_type || 'Desktop').toLowerCase();
    const formattedDev = dev.charAt(0).toUpperCase() + dev.slice(1);
    deviceMap[formattedDev] = (deviceMap[formattedDev] || 0) + 1;

    const b = v.browser || 'Unknown';
    browserMap[b] = (browserMap[b] || 0) + 1;

    const o = v.os || 'Unknown';
    osMap[o] = (osMap[o] || 0) + 1;

    const src = v.initial_source || (v.initial_referrer ? 'Referral' : 'Direct');
    sourceMap[src] = (sourceMap[src] || 0) + 1;

    const loc = v.location_display || v.city || 'Bengaluru, Karnataka, India';
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });

  const devices = Object.entries(deviceMap)
    .map(([device, count]) => ({ device, count, percentage: Math.round((count / totalInWindow) * 100) }))
    .sort((a, b) => b.count - a.count);

  const browsers = Object.entries(browserMap)
    .map(([browser, count]) => ({ browser, count, percentage: Math.round((count / totalInWindow) * 100) }))
    .sort((a, b) => b.count - a.count);

  const operatingSystems = Object.entries(osMap)
    .map(([os, count]) => ({ os, count, percentage: Math.round((count / totalInWindow) * 100) }))
    .sort((a, b) => b.count - a.count);

  const trafficSources = Object.entries(sourceMap)
    .map(([source, count]) => ({ source, count, percentage: Math.round((count / totalInWindow) * 100) }))
    .sort((a, b) => b.count - a.count);

  const topLocations = Object.entries(locationMap)
    .map(([location, count]) => ({ location, count, percentage: Math.round((count / totalInWindow) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Settings
  const { data: settingsData } = await supabase
    .from('analytics_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const settings: AnalyticsSettings = settingsData || {
    id: 1,
    retention_days: 90,
    tracking_enabled: true,
    require_consent: true,
    anonymize_ip: true,
  };

  return {
    totalVisitors: totalVisitorsCount || (windowVisitors ? windowVisitors.length : 0),
    uniqueVisitors: (windowVisitors ? windowVisitors.length : 0) || totalVisitorsCount || 0,
    todayVisitors: todayVisitorsCount || 0,
    last7DaysVisitors: last7DaysVisitorsCount || 0,
    last30DaysVisitors: last30DaysVisitorsCount || 0,
    totalPageViews: totalPageViewsCount || (windowPageViews ? windowPageViews.length : 0),
    activeVisitors: liveActiveCount || 0,
    whatsappClicks,
    appointmentClicks,
    aiAssistantOpens,
    aiMessagesSent,
    instagramClicks,
    emailClicks,
    visitorsByDay,
    topPages,
    topLandingPages,
    topExitPages,
    trafficSources,
    devices,
    browsers,
    operatingSystems,
    topLocations,
    eventCounts,
    settings,
  };
}

export async function getLiveVisitors(): Promise<{
  visitors: Array<{
    visitor_id: string;
    device_type: string;
    browser: string;
    os: string;
    location_display: string;
    current_page: string;
    last_active_at: string;
    session_duration_seconds: number;
    referrer?: string;
  }>;
  totalActive: number;
}> {
  const supabase = await getAdminSupabaseClient();
  const fiveMinutesAgoIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: activeVisitors } = await supabase
    .from('visitors')
    .select('*')
    .gte('last_active_at', fiveMinutesAgoIso)
    .order('last_active_at', { ascending: false })
    .limit(50);

  if (!activeVisitors || activeVisitors.length === 0) {
    return { visitors: [], totalActive: 0 };
  }

  // Fetch recent session for duration
  const visitorIds = activeVisitors.map((v) => v.visitor_id);
  const { data: sessions } = await supabase
    .from('visitor_sessions')
    .select('*')
    .in('visitor_id', visitorIds)
    .order('last_active_at', { ascending: false });

  const sessionMap = new Map<string, VisitorSession>();
  (sessions || []).forEach((s) => {
    if (!sessionMap.has(s.visitor_id)) {
      sessionMap.set(s.visitor_id, s);
    }
  });

  const formatted = activeVisitors.map((v) => {
    const s = sessionMap.get(v.visitor_id);
    return {
      visitor_id: v.visitor_id,
      device_type: v.device_type,
      browser: v.browser,
      os: v.os,
      location_display: v.location_display || v.city || 'Bengaluru, Karnataka, India',
      current_page: v.last_page || '/',
      last_active_at: v.last_active_at,
      session_duration_seconds: s ? s.duration_seconds : 0,
      referrer: v.initial_referrer || undefined,
    };
  });

  return {
    visitors: formatted,
    totalActive: formatted.length,
  };
}

export async function getVisitorsList(options: {
  page?: number;
  limit?: number;
  search?: string;
  device?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  visitors: Visitor[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const supabase = await getAdminSupabaseClient();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const offset = (page - 1) * limit;

  let query = supabase.from('visitors').select('*', { count: 'exact' });

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    query = query.or(`visitor_id.ilike.%${s}%,city.ilike.%${s}%,landing_page.ilike.%${s}%,last_page.ilike.%${s}%`);
  }

  if (options.device && options.device !== 'all') {
    query = query.ilike('device_type', `%${options.device}%`);
  }

  if (options.location && options.location !== 'all') {
    query = query.or(`city.ilike.%${options.location}%,location_display.ilike.%${options.location}%`);
  }

  if (options.startDate) {
    query = query.gte('first_visit_at', new Date(options.startDate).toISOString());
  }

  if (options.endDate) {
    query = query.lte('first_visit_at', new Date(options.endDate).toISOString());
  }

  const sortColumn = options.sortBy || 'last_active_at';
  const ascending = options.sortOrder === 'asc';

  query = query.order(sortColumn, { ascending }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[Visitors List Query Error]:', error);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    visitors: (data as Visitor[]) || [],
    total,
    page,
    totalPages,
  };
}

export async function getVisitorDetail(visitorId: string): Promise<{
  visitor: Visitor | null;
  sessions: VisitorSession[];
  pageViews: PageView[];
  events: VisitorEvent[];
}> {
  const supabase = await getAdminSupabaseClient();

  const { data: visitor } = await supabase
    .from('visitors')
    .select('*')
    .eq('visitor_id', visitorId)
    .maybeSingle();

  if (!visitor) {
    return { visitor: null, sessions: [], pageViews: [], events: [] };
  }

  const { data: sessions } = await supabase
    .from('visitor_sessions')
    .select('*')
    .eq('visitor_id', visitorId)
    .order('started_at', { ascending: false })
    .limit(50);

  const { data: pageViews } = await supabase
    .from('page_views')
    .select('*')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: events } = await supabase
    .from('visitor_events')
    .select('*')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(100);

  return {
    visitor: visitor as Visitor,
    sessions: (sessions as VisitorSession[]) || [],
    pageViews: (pageViews as PageView[]) || [],
    events: (events as VisitorEvent[]) || [],
  };
}

export async function runRetentionCleanup(daysToKeep?: number): Promise<{
  deleted_page_views: number;
  deleted_events: number;
  deleted_sessions: number;
  deleted_visitors: number;
}> {
  const supabase = await getAdminSupabaseClient();
  const { data, error } = await supabase.rpc('cleanup_old_analytics', {
    days_to_keep: daysToKeep || null,
  });

  if (error) {
    console.error('[Retention Cleanup RPC Error]:', error);
    throw error;
  }

  const result = Array.isArray(data) && data[0] ? data[0] : data;
  return {
    deleted_page_views: Number(result?.deleted_page_views || 0),
    deleted_events: Number(result?.deleted_events || 0),
    deleted_sessions: Number(result?.deleted_sessions || 0),
    deleted_visitors: Number(result?.deleted_visitors || 0),
  };
}
