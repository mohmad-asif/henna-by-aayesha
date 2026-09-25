import {
  getOrCreateVisitorId,
  getOrCreateSessionId,
  getClientInfo,
  sendTrackingPayload,
  isTrackingPermitted,
} from './tracker';

// Throttle event fires to prevent button hammering
const eventThrottleMap = new Map<string, number>();

export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined' || !isTrackingPermitted()) return;

  const now = Date.now();
  const throttleKey = `${eventName}_${JSON.stringify(properties)}`;
  const lastFired = eventThrottleMap.get(throttleKey);

  // 600ms debounce / throttle per distinct event
  if (lastFired && now - lastFired < 600) {
    return;
  }
  eventThrottleMap.set(throttleKey, now);

  const { visitorId } = getOrCreateVisitorId();
  const { sessionId } = getOrCreateSessionId(visitorId);

  // Privacy protection: explicitly ensure no sensitive keys are passed
  const sanitizedProps: Record<string, unknown> = {};
  const forbiddenPatterns = [/password/i, /token/i, /auth/i, /credit/i, /card/i, /cvv/i, /secret/i];

  for (const [key, value] of Object.entries(properties)) {
    const isSensitive = forbiddenPatterns.some((pattern) => pattern.test(key));
    if (!isSensitive && typeof value !== 'function') {
      sanitizedProps[key] = value;
    }
  }

  sendTrackingPayload({
    type: 'event',
    visitorId,
    sessionId,
    urlPath: window.location.pathname,
    eventName,
    eventProperties: sanitizedProps,
    clientInfo: getClientInfo(),
  });
}

// Pre-defined helpers for important business events
export function trackWhatsAppClick(sourceContext: string = 'general'): void {
  trackEvent('WhatsApp button clicked', { context: sourceContext });
}

export function trackAppointmentClick(sourceContext: string = 'general'): void {
  trackEvent('Book Appointment clicked', { context: sourceContext });
}

export function trackEmailClick(sourceContext: string = 'general'): void {
  trackEvent('Email clicked', { context: sourceContext });
}

export function trackInstagramClick(sourceContext: string = 'general'): void {
  trackEvent('Instagram clicked', { context: sourceContext });
}

export function trackAiAssistantOpen(): void {
  trackEvent('AI Assistant opened');
}

export function trackAiAssistantMessage(): void {
  // IMPORTANT: Record only the occurrence of an AI inquiry, NEVER the personal conversation content!
  trackEvent('AI Assistant message sent');
}

export function trackDesignView(design: { slug: string; title: string; category?: string }): void {
  trackEvent('Design viewed', {
    slug: design.slug,
    title: design.title,
    category: design.category || 'General',
  });
}

export function trackServiceView(service: { slug: string; title: string }): void {
  trackEvent('Service viewed', {
    slug: service.slug,
    title: service.title,
  });
}

export function trackGalleryImageOpen(item: { title: string; category?: string }): void {
  trackEvent('Gallery image opened', {
    title: item.title,
    category: item.category || 'General',
  });
}

export function trackCtaClick(ctaName: string, destinationUrl?: string): void {
  trackEvent('CTA clicked', {
    cta: ctaName,
    destination: destinationUrl,
  });
}

export function trackContactSectionView(): void {
  trackEvent('Contact section viewed');
}
