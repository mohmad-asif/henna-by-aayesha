'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import { AiAssistantWidget } from '@/components/ai-assistant/ai-assistant-widget';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { HennaFloralMotif } from '@/components/ui/icons';
import { SiteConfig } from '@/types';
import { VisitorTracker } from '@/components/analytics/visitor-tracker';
import { CookieConsentBanner } from '@/components/analytics/cookie-consent-banner';

interface PublicChromeProps {
  settings?: SiteConfig;
  children: React.ReactNode;
}

/**
 * PublicChrome renders the public website Header, main content wrapper,
 * Footer, and AI Assistant widget ONLY for public pages.
 *
 * For all Admin Panel routes (/admin, /admin/*), it renders only the children
 * so that Admin pages use strictly the isolated Admin layout without any public chrome.
 *
 * If maintenance mode is active, public visitors see an elegant studio maintenance page.
 */
export function PublicChrome({ settings, children }: PublicChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  // Maintenance mode handling
  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center text-[#261B16]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#EADFD3] shadow-lg space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FAF3EE] mx-auto flex items-center justify-center text-[#B95945] border border-[#EADFD3]">
            <HennaFloralMotif size={36} />
          </div>

          <div>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#4E2714]">
              Henna by Aayesha
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#B95945] font-semibold mt-1">
              Studio Updates in Progress
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#703D24] leading-relaxed">
            Our website is momentarily undergoing maintenance as we curate new bridal portfolios and seasonal packages. Our studio remains fully active for appointments and inquiries.
          </p>

          <div className="pt-2">
            <WhatsAppButton
              label="Contact on WhatsApp"
              variant="whatsapp"
              size="lg"
              className="w-full justify-center"
              phoneRaw={settings.contact?.whatsappPhoneRaw}
            />
          </div>

          <div className="pt-2 border-t border-[#F0E5D8] text-xs text-[#847269]">
            <span>Email: </span>
            <a href={`mailto:${settings.contact?.email || 'hello@hennabyaayesha.com'}`} className="text-[#4E2714] font-medium hover:underline">
              {settings.contact?.email || 'hello@hennabyaayesha.com'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <VisitorTracker />
      </Suspense>
      <Header settings={settings} />
      <main id="main-content" className="flex-grow focus:outline-none" tabIndex={-1}>
        {children}
      </main>
      <Footer settings={settings} />
      <AiAssistantWidget settings={settings} />
      <CookieConsentBanner />
    </>
  );
}
