import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { HennaFloralMotif } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { MobileNav } from './mobile-nav';

import { SiteConfig } from '@/types';

export function Header({ settings }: { settings?: SiteConfig }) {
  const currentConfig = settings || siteConfig;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#EADFD3]/80 nav-glass backdrop-blur-md transition-all">
      {/* Top micro-bar for Bangalore Notice */}
      <div className="bg-[#4E2714] text-[#FAF3EE] py-1 px-4 text-center text-[11px] sm:text-xs font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
        <span>Accepting Mehndi Bookings across <strong>Bangalore / Bengaluru</strong> • WhatsApp Only</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
              aria-label="Henna by Aayesha Homepage"
            >
              <div className="w-10 h-10 rounded-full bg-[#F5ECE4] border border-[#E4D2C3] flex items-center justify-center text-[#4E2714] group-hover:bg-[#EBDDCF] transition-colors">
                <HennaFloralMotif size={24} className="text-[#B95945]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif-heading text-2xl font-bold tracking-tight text-[#4E2714] leading-none">
                  Henna by Aayesha
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {siteConfig.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-[#58463D] hover:text-[#4E2714] hover:bg-[#F5ECE4]/70 rounded-full transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action: Book Appointment CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <WhatsAppButton
              label="Book Appointment"
              size="sm"
              variant="whatsapp"
              phoneRaw={currentConfig.contact.whatsappPhoneRaw}
            />
          </div>

          {/* Mobile hamburger navigation */}
          <div className="flex items-center gap-2 sm:hidden">
            <WhatsAppButton
              label="Book"
              size="sm"
              variant="whatsapp"
              className="text-xs px-2.5 py-1"
              phoneRaw={currentConfig.contact.whatsappPhoneRaw}
            />
            <MobileNav settings={currentConfig} />
          </div>

          {/* Mobile nav for tablet */}
          <div className="hidden sm:block lg:hidden">
            <MobileNav settings={currentConfig} />
          </div>
        </div>
      </div>
    </header>
  );
}
