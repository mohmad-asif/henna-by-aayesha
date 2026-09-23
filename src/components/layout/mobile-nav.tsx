'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { MenuIcon, XIcon, HennaFloralMotif } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { LocationBadge } from '@/components/ui/location-badge';

import { SiteConfig } from '@/types';

export function MobileNav({ settings }: { settings?: SiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const currentConfig = settings || siteConfig;

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 -mr-2 text-[#4E2714] hover:text-[#B95945] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4E2714] transition-colors rounded-lg"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        {isOpen ? <XIcon size={26} /> : <MenuIcon size={26} />}
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={`fixed top-0 right-0 z-50 w-[82%] max-w-sm h-full bg-[#FCF9F4] shadow-2xl flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out border-l border-[#EADFD3] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top bar inside drawer */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-[#F0E5D8]">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 group"
            >
              <HennaFloralMotif size={22} className="text-[#C29B4D]" />
              <span className="font-serif-heading text-xl font-bold tracking-tight text-[#4E2714]">
                Henna by Aayesha
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-[#703D24] hover:text-[#261B16] rounded-full hover:bg-[#F5ECE4] transition-colors"
              aria-label="Close menu"
            >
              <XIcon size={22} />
            </button>
          </div>

          {/* Location Callout */}
          <div className="mt-4 mb-4">
            <LocationBadge label="Bangalore / Bengaluru Only" variant="accent" size="sm" />
          </div>

          {/* Nav links */}
          <nav className="flex flex-col space-y-1.5 mt-2">
            {siteConfig.navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F5ECE4] text-[#4E2714] font-semibold'
                      : 'text-[#58463D] hover:bg-[#FAF3EE] hover:text-[#4E2714]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom CTA block */}
        <div className="pt-6 border-t border-[#F0E5D8] flex flex-col gap-3">
          <p className="text-xs text-[#847269] text-center">
            {currentConfig.contact.operatingHours}
          </p>
          <WhatsAppButton
            phoneRaw={currentConfig.contact.whatsappPhoneRaw}
            label="Book Appointment on WhatsApp"
            size="md"
            variant="whatsapp"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
