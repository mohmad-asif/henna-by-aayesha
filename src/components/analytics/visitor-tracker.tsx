'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  getOrCreateVisitorId,
  getOrCreateSessionId,
  getClientInfo,
  getUtmParams,
  sendTrackingPayload,
  isTrackingPermitted,
} from '@/lib/analytics/tracker';
import {
  trackWhatsAppClick,
  trackEmailClick,
  trackInstagramClick,
  trackAppointmentClick,
  trackCtaClick,
  trackContactSectionView,
} from '@/lib/analytics/events';

export function VisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(0);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contactObservedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isTrackingPermitted()) return;

    const currentPath = pathname;
    pageStartTimeRef.current = Date.now();

    const { visitorId, isNew: isNewVisitor } = getOrCreateVisitorId();
    const { sessionId, isNew: isNewSession } = getOrCreateSessionId(visitorId);
    const clientInfo = getClientInfo();
    const utm = getUtmParams();

    // Send page view
    sendTrackingPayload({
      type: 'pageview',
      visitorId,
      sessionId,
      urlPath: currentPath,
      pageTitle: document.title,
      referrer: document.referrer || '',
      isNewVisitor,
      isNewSession,
      clientInfo,
      utm,
    });

    lastPathRef.current = currentPath;

    // Heartbeat every 30 seconds to update session duration and keep live status fresh
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    heartbeatTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible' && isTrackingPermitted()) {
        const timeSpentSeconds = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
        sendTrackingPayload({
          type: 'heartbeat',
          visitorId,
          sessionId,
          urlPath: currentPath,
          timeSpentSeconds,
        });
      }
    }, 30000);

    // Send heartbeat on page change / unmount
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (isTrackingPermitted()) {
        const timeSpentSeconds = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
        if (timeSpentSeconds >= 2) {
          sendTrackingPayload({
            type: 'heartbeat',
            visitorId,
            sessionId,
            urlPath: currentPath,
            timeSpentSeconds,
          });
        }
      }
    };
  }, [pathname, searchParams]);

  // Global Page Visibility & BeforeUnload Listeners
  useEffect(() => {
    if (!isTrackingPermitted()) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const { visitorId } = getOrCreateVisitorId();
        const { sessionId } = getOrCreateSessionId(visitorId);
        const timeSpentSeconds = Math.round((Date.now() - pageStartTimeRef.current) / 1000);

        if (timeSpentSeconds >= 2 && lastPathRef.current) {
          sendTrackingPayload({
            type: 'heartbeat',
            visitorId,
            sessionId,
            urlPath: lastPathRef.current,
            timeSpentSeconds,
          });
        }
      }
    };

    const handleBeforeUnload = () => {
      const { visitorId } = getOrCreateVisitorId();
      const { sessionId } = getOrCreateSessionId(visitorId);
      const timeSpentSeconds = Math.round((Date.now() - pageStartTimeRef.current) / 1000);

      if (timeSpentSeconds >= 1 && lastPathRef.current) {
        sendTrackingPayload({
          type: 'heartbeat',
          visitorId,
          sessionId,
          urlPath: lastPathRef.current,
          timeSpentSeconds,
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Global Click Delegation for Links and CTAs
  useEffect(() => {
    if (!isTrackingPermitted()) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const text = target.textContent?.toLowerCase() || '';
      const ctaAttr = target.getAttribute('data-cta');
      const trackEventAttr = target.getAttribute('data-track-event');

      // Explicit attribute overrides
      if (trackEventAttr) {
        trackCtaClick(trackEventAttr, href);
        return;
      }

      // WhatsApp Detection
      if (href.includes('wa.me') || href.includes('api.whatsapp.com') || href.includes('whatsapp.com')) {
        const isAppointment = text.includes('appointment') || text.includes('book');
        trackWhatsAppClick(isAppointment ? 'appointment_cta' : 'whatsapp_button');
        if (isAppointment) {
          trackAppointmentClick('whatsapp_link');
        }
        return;
      }

      // Email Detection
      if (href.startsWith('mailto:')) {
        trackEmailClick('mailto_link');
        return;
      }

      // Instagram Detection
      if (href.includes('instagram.com')) {
        trackInstagramClick('instagram_link');
        return;
      }

      // Book Appointment CTA buttons
      if (text.includes('book appointment') || text.includes('book mehndi') || text.includes('schedule consultation')) {
        trackAppointmentClick('text_cta');
        return;
      }

      // General CTA attributes
      if (ctaAttr) {
        trackCtaClick(ctaAttr, href);
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  // Intersection Observer for Contact Section
  useEffect(() => {
    if (!isTrackingPermitted() || contactObservedRef.current) return;

    const contactEl = document.getElementById('contact') || document.getElementById('contact-section');
    if (!contactEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !contactObservedRef.current) {
          contactObservedRef.current = true;
          trackContactSectionView();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(contactEl);

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
