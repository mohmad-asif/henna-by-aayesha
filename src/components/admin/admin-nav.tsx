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

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Contact & Settings', href: '/admin/settings', icon: '⚙️' },
  { name: 'Mehndi Designs', href: '/admin/designs', icon: '✨' },
  { name: 'Services & Packages', href: '/admin/services', icon: '📋' },
  { name: 'Photo Gallery', href: '/admin/gallery', icon: '🖼️' },
  { name: 'Testimonials', href: '/admin/testimonials', icon: '💬' },
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
    return <div className="min-h-screen bg-[#FDFBF7]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col lg:flex-row text-[#261B16]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#2E160C] text-[#F5ECE4] border-r border-[#432314] flex-shrink-0">
        {/* Brand header */}
        <div className="p-6 border-b border-[#432314]">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#4E2714] flex items-center justify-center text-[#C29B4D]">
              <HennaFloralMotif size={20} />
            </div>
            <div>
              <span className="font-serif-heading text-lg font-bold text-white block leading-tight">
                Henna by Aayesha
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#A39184] font-medium">
                Admin Control Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5 flex-grow">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#B95945] text-white shadow-xs font-semibold'
                    : 'text-[#D4C3B3] hover:bg-[#3D1E11] hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom user & view site */}
        <div className="p-4 border-t border-[#432314] space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-[#D4C3B3] hover:text-white px-3 py-2 rounded-lg bg-[#25120A] hover:bg-[#381A0E] transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLinkIcon size={14} />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <div className="truncate max-w-[130px]">
              <span className="text-[10px] text-[#A39184] block">Logged in as:</span>
              <span className="text-white font-medium truncate block">{userEmail || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs text-[#B95945] hover:text-[#E8A598] font-semibold transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Logging out...' : 'Sign out'}
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
          className="p-1.5 text-[#D4C3B3] hover:text-white"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#25120A] text-[#F5ECE4] border-b border-[#432314] p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#D4C3B3] hover:bg-[#3D1E11] hover:text-white"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="pt-3 border-t border-[#432314] flex items-center justify-between text-xs">
            <Link href="/" target="_blank" className="text-[#C29B4D] hover:underline">
              View Website →
            </Link>
            <button
              onClick={handleLogout}
              className="text-[#B95945] font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
