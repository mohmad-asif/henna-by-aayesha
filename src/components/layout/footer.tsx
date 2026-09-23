import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import {
  HennaFloralMotif,
  MapPinIcon,
  WhatsAppIcon,
  MailIcon,
  ClockIcon,
  InstagramIcon,
} from '@/components/ui/icons';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { SiteConfig } from '@/types';

export function Footer({ settings }: { settings?: SiteConfig }) {
  const currentConfig = settings || siteConfig;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2E160C] text-[#F5ECE4] border-t border-[#4E2714] mt-auto">
      {/* Top Banner inside Footer */}
      <div className="border-b border-[#432314] py-8 bg-[#25120A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-full bg-[#4E2714] flex items-center justify-center text-[#C29B4D] flex-shrink-0">
              <HennaFloralMotif size={26} />
            </div>
            <div>
              <p className="font-serif-heading text-2xl font-semibold text-white">
                Planning your wedding or special occasion?
              </p>
              <p className="text-xs sm:text-sm text-[#D4C3B3] mt-0.5">
                Reserve your bridal date or festive slot in Bangalore directly on WhatsApp.
              </p>
            </div>
          </div>

          <WhatsAppButton
            label="Chat on WhatsApp to Reserve"
            variant="whatsapp"
            size="md"
            className="flex-shrink-0"
            phoneRaw={currentConfig.contact.whatsappPhoneRaw}
          />
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Philosophy (2 columns wide on lg) */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <HennaFloralMotif size={24} className="text-[#C29B4D]" />
              <span className="font-serif-heading text-2xl font-bold text-white tracking-tight">
                Henna by Aayesha
              </span>
            </Link>

            <p className="text-sm text-[#D4C3B3] leading-relaxed max-w-sm">
              Professional, bespoke bridal and festive mehndi artistry handcrafted with 100% natural, chemical-free Rajasthani organic henna. Dedicated to bringing timeless Indian elegance to modern brides.
            </p>

            {/* Social link */}
            {currentConfig.contact.instagramUrl && (
              <div className="mt-5">
                <a
                  href={currentConfig.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4C3B3] hover:text-[#C29B4D] transition-colors px-3 py-2 rounded-lg bg-[#3C1D10] border border-[#522916]"
                  aria-label="Follow Henna by Aayesha on Instagram"
                >
                  <InstagramIcon size={16} className="text-[#E1306C]" />
                  <span>{currentConfig.contact.instagramHandle || '@hennabyaayesha'}</span>
                </a>
              </div>
            )}

            <p className="text-xs text-[#A39184] mt-3">
              On-location bridal appointments & private studio sessions across Bangalore.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C29B4D] mb-4">
              Explore
            </h2>
            <ul className="space-y-2.5 text-sm">
              {siteConfig.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#D4C3B3] hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C29B4D] mb-4">
              Services
            </h2>
            <ul className="space-y-2.5 text-sm text-[#D4C3B3]">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Royal Bridal Packages
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Engagement & Roka Henna
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Sangeet & Guest Mehndi
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Festival & Karwa Chauth
                </Link>
              </li>
              <li>
                <Link href="/mehndi-designs" className="hover:text-white transition-colors">
                  Design Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Appointments */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C29B4D] mb-4">
              Direct Contact
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-[#D4C3B3]">
              <li className="flex items-start gap-2.5">
                <WhatsAppIcon size={16} className="text-[#25D366] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#A39184]">WhatsApp Only:</span>
                  <a
                    href={`https://wa.me/${currentConfig.contact.whatsappPhoneRaw}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white hover:text-[#25D366] transition-colors"
                  >
                    {currentConfig.contact.whatsappDisplayNumber}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <MailIcon size={16} className="text-[#C29B4D] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#A39184]">Email:</span>
                  <a
                    href={`mailto:${currentConfig.contact.email}`}
                    className="hover:text-white transition-colors"
                  >
                    {currentConfig.contact.email}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <MapPinIcon size={16} className="text-[#B95945] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#A39184]">City Availability:</span>
                  <span className="text-white">{currentConfig.contact.city}, {currentConfig.contact.country}</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <ClockIcon size={16} className="text-[#C29B4D] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#A39184]">Hours:</span>
                  <span>{currentConfig.contact.operatingHours}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#432314] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A39184] gap-4">
          <p>© {currentYear} {currentConfig.name}. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>

          <p className="text-center sm:text-right">
            Handcrafted with organic henna in Bangalore • Appointments strictly via WhatsApp.
          </p>
        </div>
      </div>
    </footer>
  );
}

