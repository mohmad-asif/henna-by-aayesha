'use client';

import React, { useState, useEffect } from 'react';
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

  if (isLoginPage) {
    return (
      <main id="main-content" className="min-h-screen bg-[#FDFBF7] focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F4EF] flex flex-col lg:flex-row text-[#261B16]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#2E160C] text-[#F5ECE4] border-r border-[#432314] flex-shrink-0 z-30 overflow-y-auto">
        {/* Brand header */}
        <div className="p-5 border-b border-[#432314] flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#4E2714] flex items-center justify-center text-[#C29B4D] flex-shrink-0">
              <HennaFloralMotif size={20} />
            </div>
            <div>
              <span className="font-serif-heading text-base font-bold text-white block leading-tight">
                Henna by Aayesha
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#A39184] font-medium">
                Admin Control Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation links by Section */}
        <nav className="p-3 space-y-4 flex-grow">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C29B4D] px-3 block">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#B95945] text-white shadow-xs font-semibold'
                        : 'text-[#D4C3B3] hover:bg-[#3D1E11] hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.name}</span>
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
            className="flex items-center justify-between text-xs text-[#D4C3B3] hover:text-white px-3 py-2 rounded-lg bg-[#2E160C] hover:bg-[#381A0E] transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLinkIcon size={14} />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <div className="truncate max-w-[130px]">
              <span className="text-[10px] text-[#A39184] block">Logged in:</span>
              <span className="text-white font-medium truncate block">{userEmail || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs text-[#B95945] hover:text-[#E8A598] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-[#2E160C] text-white p-4 flex items-center justify-between border-b border-[#432314] sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <HennaFloralMotif size={20} className="text-[#C29B4D]" />
          <span className="font-serif-heading text-lg font-bold">Admin Panel</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-[#D4C3B3] hover:text-white cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#25120A] text-[#F5ECE4] border-b border-[#432314] p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C29B4D] px-2 block">
                {sec.title}
              </span>
              {sec.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-[#D4C3B3] hover:bg-[#3D1E11] hover:text-white"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          ))}
          <div className="pt-3 border-t border-[#432314] flex items-center justify-between text-xs">
            <Link href="/" target="_blank" className="text-[#C29B4D] hover:underline">
              View Website →
            </Link>
            <button
              onClick={handleLogout}
              className="text-[#B95945] font-semibold cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 min-w-0 flex flex-col overflow-y-auto focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
