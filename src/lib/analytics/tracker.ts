import { TrackingClientInfo, TrackingPayload } from '@/types/analytics';

const VISITOR_ID_KEY = 'hba_vid';
const SESSION_ID_KEY = 'hba_sid';
const SESSION_TS_KEY = 'hba_sid_ts';
const CONSENT_KEY = 'hba_consent';
const ADMIN_FLAG_KEY = 'hba_is_admin';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateVisitorId(): { visitorId: string; isNew: boolean } {
  if (typeof window === 'undefined') {
    return { visitorId: '', isNew: false };
  }

  let vid = localStorage.getItem(VISITOR_ID_KEY);
  let isNew = false;

  if (!vid) {
    vid = generateUUID();
    try {
      localStorage.setItem(VISITOR_ID_KEY, vid);
      // Set a fallback cookie for 1 year
      document.cookie = `${VISITOR_ID_KEY}=${vid}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Storage restricted
    }
    isNew = true;
  }

  return { visitorId: vid, isNew };
}

export function getOrCreateSessionId(visitorId?: string): { sessionId: string; isNew: boolean } {
  void visitorId;
  if (typeof window === 'undefined') {
    return { sessionId: '', isNew: false };
  }

  const now = Date.now();
  const existingSid = sessionStorage.getItem(SESSION_ID_KEY);
  const existingTsStr = sessionStorage.getItem(SESSION_TS_KEY);
  const existingTs = existingTsStr ? parseInt(existingTsStr, 10) : 0;

  if (existingSid && existingTs && now - existingTs < SESSION_TIMEOUT_MS) {
    // Session is still active; refresh timestamp
    sessionStorage.setItem(SESSION_TS_KEY, now.toString());
    return { sessionId: existingSid, isNew: false };
  }

  // Create a new session
  const newSid = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  try {
    sessionStorage.setItem(SESSION_ID_KEY, newSid);
    sessionStorage.setItem(SESSION_TS_KEY, now.toString());
  } catch {
    // Storage restricted
  }

  return { sessionId: newSid, isNew: true };
}

export function getClientInfo(): TrackingClientInfo {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
      screenSize: '0x0',
      language: 'en',
      timezone: 'UTC',
    };
  }

  const ua = navigator.userAgent;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // Device detection
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua);
  const isMobile = /(android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|mobile)/i.test(ua);

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile || window.innerWidth < 768) {
    deviceType = 'mobile';
  }

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  // OS detection
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  const screenSize = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;
  const language = navigator.language || 'en';
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // Ignore timezone detection failure
  }

  return {
    deviceType,
    browser,
    os,
    screenSize,
    language,
    timezone,
  };
}

export function getUtmParams(): {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
} {
  if (typeof window === 'undefined') return {};

  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get('utm_source') || undefined;
  const medium = searchParams.get('utm_medium') || undefined;
  const campaign = searchParams.get('utm_campaign') || undefined;
  const term = searchParams.get('utm_term') || undefined;
  const content = searchParams.get('utm_content') || undefined;

  return { source, medium, campaign, term, content };
}

export function isTrackingPermitted(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Never track inside Admin Panel routes
  if (window.location.pathname.startsWith('/admin')) {
    return false;
  }

  // 2. Never track if user is identified as Admin
  if (localStorage.getItem(ADMIN_FLAG_KEY) === 'true') {
    return false;
  }

  // 3. Check cookie consent choice
  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'declined') {
    return false;
  }

  return true;
}

export async function sendTrackingPayload(payload: TrackingPayload): Promise<void> {
  if (!isTrackingPermitted()) return;

  const endpoint = '/api/analytics/track';
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon && payload.type === 'heartbeat') {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    } catch {
      // Fallback to fetch
    }
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    });
  } catch {
    // Fail silently to avoid degrading user experience
  }
}
