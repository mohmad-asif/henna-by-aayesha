'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { MenuIcon, XIcon, HennaFloralMotif } from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { LocationBadge } from '@/components/ui/location-badge';

import { SiteConfig } from '@/types';

const emptySubscribe = () => () => {};

export function MobileNav({ settings }: { settings?: SiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
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

  const drawerContent = (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
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
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-50 w-[84%] max-w-sm h-full max-h-[100dvh] bg-[#FCF9F4] shadow-2xl flex flex-col justify-between p-5 sm:p-6 transform transition-transform duration-300 ease-in-out border-l border-[#EADFD3] overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
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
              className="w-11 h-11 flex items-center justify-center text-[#703D24] hover:text-[#261B16] rounded-full hover:bg-[#F5ECE4] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B95945] cursor-pointer"
              aria-label="Close navigation menu"
            >
              <XIcon size={24} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Location Callout */}
          <div className="mt-4 mb-4">
            <LocationBadge
              label={
                currentConfig.location?.serviceAvailability ||
                currentConfig.location?.availability ||
                `${currentConfig.location?.city || 'Bengaluru'} Service Area Only`
              }
              variant="accent"
              size="sm"
            />
          </div>

          {/* Nav links */}
          <nav className="flex flex-col space-y-1.5 mt-2">
            {(currentConfig.navigation && currentConfig.navigation.length > 0
              ? currentConfig.navigation
                  .filter((item) => item.enabled !== false)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((item) => ({ name: item.label, href: item.url }))
              : siteConfig.navLinks
            ).map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-3.5 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F5ECE4] text-[#4E2714] font-semibold'
                      : 'text-[#58463D] hover:bg-[#FAF3EE] hover:text-[#4E2714]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Featured AI Design Assistant link */}
            <Link
              href="/ai-design-assistant"
              onClick={() => setIsOpen(false)}
              className={`mt-2 px-3.5 py-3 rounded-xl text-base font-semibold flex items-center justify-between border transition-all ${
                pathname === '/ai-design-assistant'
                  ? 'bg-[#4E2714] text-[#FAF3EE] border-[#381A0E]'
                  : 'bg-[#F9EFEA] text-[#B95945] border-[#EADFD3] hover:bg-[#F5ECE4]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>✨</span>
                <span>AI Design Assistant</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#B95945] text-white">
                Try AI
              </span>
            </Link>
          </nav>
        </div>

        {/* Bottom CTA block */}
        <div className="pt-6 border-t border-[#F0E5D8] flex flex-col gap-3 mt-4">
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
    </>
  );

  return (
    <div className="lg:hidden">
      {/* High-visibility accessible 44px x 44px Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#F5ECE4] border border-[#E4D2C3] text-[#4E2714] hover:bg-[#EBDDCF] hover:text-[#B95945] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B95945] transition-all shadow-2xs active:scale-95 flex-shrink-0 cursor-pointer"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        {isOpen ? (
          <XIcon size={24} className="stroke-[2.5]" />
        ) : (
          <MenuIcon size={24} className="stroke-[2.5]" />
        )}
      </button>

      {/* Render drawer via portal into document.body */}
      {mounted ? createPortal(drawerContent, document.body) : null}
    </div>
  );
}
