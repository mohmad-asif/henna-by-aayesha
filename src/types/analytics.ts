export interface Visitor {
  visitor_id: string;
  first_visit_at: string;
  last_visit_at: string;
  last_active_at: string;
  visit_count: number;
  page_views_count: number;
  device_type: 'desktop' | 'mobile' | 'tablet' | string;
  browser: string;
  os: string;
  screen_size?: string | null;
  language: string;
  timezone: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  location_display?: string | null;
  initial_referrer?: string | null;
  initial_source?: string | null;
  initial_utm_source?: string | null;
  initial_utm_medium?: string | null;
  initial_utm_campaign?: string | null;
  landing_page: string;
  last_page: string;
  is_bot: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisitorSession {
  session_id: string;
  visitor_id: string;
  started_at: string;
  last_active_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  page_views_count: number;
  landing_page: string;
  exit_page: string;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  device_type: string;
  browser: string;
  os: string;
  created_at: string;
  updated_at: string;
}

export interface PageView {
  id: string;
  session_id: string;
  visitor_id: string;
  url_path: string;
  page_title?: string | null;
  referrer?: string | null;
  device_type: string;
  time_spent_seconds: number;
  created_at: string;
}

export interface VisitorEvent {
  id: string;
  session_id: string;
  visitor_id: string;
  event_name: string;
  url_path: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsSettings {
  id: number;
  retention_days: number;
  tracking_enabled: boolean;
  require_consent: boolean;
  anonymize_ip: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsOverview {
  totalVisitors: number;
  uniqueVisitors: number;
  todayVisitors: number;
  last7DaysVisitors: number;
  last30DaysVisitors: number;
  totalPageViews: number;
  activeVisitors: number;
  whatsappClicks: number;
  appointmentClicks: number;
  aiAssistantOpens: number;
  aiMessagesSent: number;
  instagramClicks: number;
  emailClicks: number;
  visitorsByDay: {
    date: string;
    displayDate: string;
    visitors: number;
    pageViews: number;
  }[];
  topPages: {
    urlPath: string;
    title: string;
    views: number;
    visitors: number;
    avgDurationSeconds: number;
  }[];
  topLandingPages: {
    urlPath: string;
    count: number;
  }[];
  topExitPages: {
    urlPath: string;
    count: number;
  }[];
  trafficSources: {
    source: string;
    count: number;
    percentage: number;
  }[];
  devices: {
    device: string;
    count: number;
    percentage: number;
  }[];
  browsers: {
    browser: string;
    count: number;
    percentage: number;
  }[];
  operatingSystems: {
    os: string;
    count: number;
    percentage: number;
  }[];
  topLocations: {
    location: string;
    count: number;
    percentage: number;
  }[];
  eventCounts: Record<string, number>;
}

export interface TrackingClientInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  screenSize: string;
  language: string;
  timezone: string;
}

export interface TrackingPayload {
  type: 'pageview' | 'event' | 'heartbeat' | 'session_init';
  visitorId: string;
  sessionId: string;
  urlPath: string;
  pageTitle?: string;
  referrer?: string;
  isNewSession?: boolean;
  isNewVisitor?: boolean;
  clientInfo?: TrackingClientInfo;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  eventName?: string;
  eventProperties?: Record<string, unknown>;
  timeSpentSeconds?: number;
}
