'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  designsCount: number;
  servicesCount: number;
  galleryCount: number;
  testimonialsCount: number;
  whatsappNumber: string;
  email: string;
  tablesReady: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    designsCount: 6,
    servicesCount: 5,
    galleryCount: 6,
    testimonialsCount: 3,
    whatsappNumber: '+91 12345 67890',
    email: 'hello@hennabyaayesha.com',
    tablesReady: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient();

        // Check site_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('site_settings')
          .select('whatsapp_number, email')
          .eq('id', 1)
          .maybeSingle();

        const tablesAvailable = !settingsError;

        // Count designs
        const { count: designs } = await supabase
          .from('mehndi_designs')
          .select('*', { count: 'exact', head: true });

        // Count services
        const { count: services } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        // Count gallery
        const { count: gallery } = await supabase
          .from('gallery')
          .select('*', { count: 'exact', head: true });

        // Count testimonials
        const { count: testimonials } = await supabase
          .from('testimonials')
          .select('*', { count: 'exact', head: true });

        setStats({
          designsCount: designs ?? 6,
          servicesCount: services ?? 5,
          galleryCount: gallery ?? 6,
          testimonialsCount: testimonials ?? 3,
          whatsappNumber: settingsData?.whatsapp_number || '+91 12345 67890',
          email: settingsData?.email || 'hello@hennabyaayesha.com',
          tablesReady: tablesAvailable,
        });
      } catch {
        // Fallback to active mock stats
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            Overview
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1">
            Manage your mehndi designs, services, photo gallery, client reviews, and WhatsApp settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs font-semibold hover:bg-[#381A0E] transition-all shadow-sm"
          >
            <span>Update Contact Settings</span>
          </Link>
        </div>
      </div>

      {/* Database Status Alert Banner */}
      {!stats.tablesReady && !loading && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EB] border border-[#F2DEB0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#7E5E1C]">
                Supabase Tables Ready for Migration
              </h4>
              <p className="text-xs text-[#846627] mt-0.5 leading-relaxed">
                The public website is actively running with our built-in curated data and graceful fallbacks. To enable persistent live database updates from this Admin Panel, execute the SQL migration script located in{' '}
                <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#4E2714]">
                  supabase/schema.sql
                </code>{' '}
                in your Supabase SQL Editor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
              Total Designs
            </span>
            <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#B95945]">✨</span>
          </div>
          <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
            {loading ? '...' : stats.designsCount}
          </div>
          <Link
            href="/admin/designs"
            className="mt-3 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage designs →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
              Services / Packages
            </span>
            <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#C29B4D]">📋</span>
          </div>
          <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
            {loading ? '...' : stats.servicesCount}
          </div>
          <Link
            href="/admin/services"
            className="mt-3 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage packages →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
              Gallery Photos
            </span>
            <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#B95945]">🖼️</span>
          </div>
          <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
            {loading ? '...' : stats.galleryCount}
          </div>
          <Link
            href="/admin/gallery"
            className="mt-3 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage gallery →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EADFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
              Testimonials
            </span>
            <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#1EBE5D]">💬</span>
          </div>
          <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
            {loading ? '...' : stats.testimonialsCount}
          </div>
          <Link
            href="/admin/testimonials"
            className="mt-3 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage reviews →
          </Link>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs">
        <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/designs"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">✨</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              Add New Design
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Upload photos, add description & category
            </p>
          </Link>

          <Link
            href="/admin/gallery"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">🖼️</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              Upload Gallery Photo
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Add lookbook images with category tags
            </p>
          </Link>

          <Link
            href="/admin/services"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">📋</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              Add Service Package
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Create bridal, sangeet, or festival package
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">📱</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              Edit WhatsApp Number
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Update booking number & contact email
            </p>
          </Link>
        </div>
      </div>

      {/* Live Contact Information Snapshot */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif-heading text-lg font-semibold text-[#261B16]">
              Active Booking Information
            </h3>
            <p className="text-xs text-[#847269]">
              Every WhatsApp button and email link on the public website reflects these values:
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs font-semibold text-[#B95945] hover:underline"
          >
            Change Settings →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              WhatsApp Booking Number
            </span>
            <span className="text-base font-bold text-[#4E2714] mt-1 block">
              {stats.whatsappNumber}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              Contact Email Address
            </span>
            <span className="text-sm font-semibold text-[#4E2714] mt-1 block truncate">
              {stats.email}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              Service Exclusivity
            </span>
            <span className="text-xs font-semibold text-[#703D24] mt-1 block">
              Bangalore / Bengaluru Only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
