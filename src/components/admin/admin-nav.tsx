'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  HennaFloralMotif,
  ExternalLinkIcon,
  MenuIcon,
  XIcon,
} from '@/components/ui/icons';

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: string;
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: '📊' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Overview', href: '/admin/analytics', icon: '📈' },
      { name: 'Live Visitors', href: '/admin/analytics/live', icon: '🟢' },
      { name: 'Visitors', href: '/admin/analytics/visitors', icon: '👥' },
      { name: 'Pages', href: '/admin/analytics/pages', icon: '📄' },
      { name: 'Traffic Sources', href: '/admin/analytics/sources', icon: '🌐' },
      { name: 'Events', href: '/admin/analytics/events', icon: '⚡' },
    ],
  },
  {
    title: 'Content',
    items: [
      { name: 'Mehndi Designs', href: '/admin/designs', icon: '✨' },
      { name: 'Services & Packages', href: '/admin/services', icon: '📋' },
      { name: 'Testimonials', href: '/admin/testimonials', icon: '💬' },
      { name: 'FAQs', href: '/admin/faqs', icon: '❓' },
      { name: 'Why Choose Us', href: '/admin/why-choose-us', icon: '🌿' },
      { name: 'Photo Gallery', href: '/admin/gallery', icon: '🖼️' },
    ],
  },
  {
    title: 'Website',
    items: [
      { name: 'Site & Location', href: '/admin/settings', icon: '⚙️' },
      { name: 'Homepage & Hero', href: '/admin/homepage', icon: '🏠' },
      { name: 'Navigation & Footer', href: '/admin/navigation-footer', icon: '🧭' },
      { name: 'Social Links', href: '/admin/social', icon: '📱' },
      { name: 'Promo & Maintenance', href: '/admin/announcement-maintenance', icon: '📢' },
    ],
  },
  {
    title: 'SEO',
    items: [
      { name: 'SEO & Schema', href: '/admin/seo', icon: '🔍' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { name: 'AI Settings', href: '/admin/ai-settings', icon: '🤖' },
      { name: 'Chat History', href: '/admin/ai-conversations', icon: '💬' },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // If on login page, render clean layout without sidebar
  const isLoginPage = pathname === '/admin/login';

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Fetch logged in user email
  useEffect(() => {
    if (!isLoginPage) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserEmail(user.email || 'Admin');
        }
      });
    }
  }, [isLoginPage]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeMobileMenu();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen, closeMobileMenu]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (isLoginPage) {
    return (
      <main id="main-content" className="min-h-screen bg-[#FDFBF7] focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F7F4EF] flex flex-col lg:flex-row text-[#261B16] overflow-hidden">
      {/* Desktop Sidebar (lg: and above) */}
      <aside className="hidden lg:flex flex-col w-64 h-full bg-[#2E160C] text-[#F5ECE4] border-r border-[#432314] flex-shrink-0 z-30 overflow-y-auto">
        {/* Brand header */}
        <div className="p-5 border-b border-[#432314] flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#4E2714] flex items-center justify-center text-[#C29B4D] flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <HennaFloralMotif size={20} />
            </div>
            <div className="min-w-0">
              <span className="font-serif-heading text-base font-bold text-white block leading-tight truncate">
                Henna by Aayesha
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#A39184] font-medium block truncate">
                Admin Control Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation links by Section */}
        <nav className="p-3 space-y-4 flex-grow overflow-y-auto" aria-label="Admin Navigation">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C29B4D] px-3 block">
                {section.title}
              </span>
              {section.items.map((item) => {
                const active = isLinkActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#B95945] text-white shadow-xs font-semibold'
                        : 'text-[#D4C3B3] hover:bg-[#3D1E11] hover:text-white'
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user & view site */}
        <div className="p-4 border-t border-[#432314] space-y-3 flex-shrink-0 bg-[#25120A]">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs text-[#D4C3B3] hover:text-white px-3 py-2 rounded-lg bg-[#2E160C] hover:bg-[#381A0E] transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLinkIcon size={14} />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <div className="truncate max-w-[130px]">
              <span className="text-[10px] text-[#A39184] block">Logged in:</span>
              <span className="text-white font-medium truncate block" title={userEmail || 'Admin'}>
                {userEmail || 'Admin'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs text-[#B95945] hover:text-[#E8A598] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar (< lg screens) */}
      <header className="lg:hidden bg-[#2E160C] text-white px-4 py-3 flex items-center justify-between border-b border-[#432314] flex-shrink-0 z-40 shadow-xs">
        <Link href="/admin" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#4E2714] flex items-center justify-center text-[#C29B4D] flex-shrink-0">
            <HennaFloralMotif size={18} />
          </div>
          <div className="min-w-0">
            <span className="font-serif-heading text-base font-bold truncate block leading-tight">
              Admin Panel
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#A39184] font-medium block truncate">
              Henna by Aayesha
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="p-2 -mr-1 text-[#D4C3B3] hover:text-white rounded-lg hover:bg-[#3D1E11] transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </header>

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer (< lg screens) */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#2E160C] text-[#F5ECE4] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#432314] flex items-center justify-between flex-shrink-0 bg-[#25120A]">
          <Link href="/admin" onClick={closeMobileMenu} className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#4E2714] flex items-center justify-center text-[#C29B4D] flex-shrink-0">
              <HennaFloralMotif size={18} />
            </div>
            <div className="min-w-0">
              <span className="font-serif-heading text-sm font-bold text-white block leading-tight truncate">
                Henna by Aayesha
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#A39184] font-medium block truncate">
                Control Panel
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-1.5 rounded-lg text-[#D4C3B3] hover:text-white hover:bg-[#3D1E11] transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="p-3 space-y-4 flex-1 overflow-y-auto" aria-label="Mobile Admin Navigation">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C29B4D] px-2.5 block">
                {sec.title}
              </span>
              {sec.items.map((item) => {
                const active = isLinkActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#B95945] text-white shadow-xs font-semibold'
                        : 'text-[#D4C3B3] hover:bg-[#3D1E11] hover:text-white'
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Drawer Bottom Footer */}
        <div className="p-4 border-t border-[#432314] space-y-2.5 flex-shrink-0 bg-[#25120A]">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobileMenu}
            className="flex items-center justify-between text-xs text-[#D4C3B3] hover:text-white px-3 py-2 rounded-lg bg-[#2E160C] hover:bg-[#381A0E] transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLinkIcon size={14} />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <div className="truncate max-w-[140px]">
              <span className="text-[10px] text-[#A39184] block">Logged in:</span>
              <span className="text-white font-medium truncate block" title={userEmail || 'Admin'}>
                {userEmail || 'Admin'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs text-[#B95945] hover:text-[#E8A598] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 min-w-0 h-full overflow-y-auto focus:outline-none"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
