import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { HennaFloralMotif } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { MobileNav } from './mobile-nav';
import { SiteConfig } from '@/types';
import { formatLocation } from '@/lib/settings/location';

export function Header({ settings }: { settings?: SiteConfig }) {
  const currentConfig = settings || siteConfig;

  // Dynamic promo banner or service availability
  const promo = currentConfig.promo;
  const showPromo = promo?.enabled && promo.text?.trim();

  // Navigation items
  const navItems =
    currentConfig.navigation && currentConfig.navigation.length > 0
      ? currentConfig.navigation
          .filter((item) => item.enabled !== false)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((item) => ({ name: item.label, href: item.url }))
      : siteConfig.navLinks;

  const dynamicAvailability =
    currentConfig.location?.serviceAvailability ||
    currentConfig.location?.availability ||
    `Accepting Mehndi Bookings across ${currentConfig.location?.city || 'Bengaluru'} • WhatsApp Only`;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#EADFD3]/80 nav-glass backdrop-blur-md transition-all">
      {/* Top micro-bar for Announcement or Dynamic Availability */}
      {showPromo ? (
        <div className="bg-[#B95945] text-white py-1.5 px-4 text-center text-[11px] sm:text-xs font-medium tracking-wide flex items-center justify-center gap-2">
          <span>{formatLocation(promo.text, currentConfig)}</span>
          {promo.ctaText && promo.ctaUrl && (
            <Link
              href={promo.ctaUrl}
              className="ml-2 underline font-bold hover:text-[#FAF3EE] transition-colors"
            >
              {promo.ctaText} →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-[#4E2714] text-[#FAF3EE] py-1 px-4 text-center text-[11px] sm:text-xs font-medium tracking-wide flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
          <span>{dynamicAvailability}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none min-w-0"
              aria-label="Henna by Aayesha Homepage"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F5ECE4] border border-[#E4D2C3] flex items-center justify-center text-[#4E2714] group-hover:bg-[#EBDDCF] transition-colors flex-shrink-0">
                <HennaFloralMotif size={22} className="text-[#B95945]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-serif-heading text-xl sm:text-2xl font-bold tracking-tight text-[#4E2714] leading-none whitespace-nowrap">
                  {currentConfig.name || 'Henna by Aayesha'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-[#58463D] hover:text-[#4E2714] hover:bg-[#F5ECE4]/70 rounded-full transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action: Book Appointment CTA for tablet & desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <WhatsAppButton
              label="Book Appointment"
              size="sm"
              variant="whatsapp"
              phoneRaw={currentConfig.contact.whatsappPhoneRaw}
            />
          </div>

          {/* Mobile & Tablet hamburger navigation */}
          <div className="flex items-center lg:hidden flex-shrink-0">
            <MobileNav settings={currentConfig} />
          </div>
        </div>
      </div>
    </header>
  );
}
