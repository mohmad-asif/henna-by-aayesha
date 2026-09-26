'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  designsTotal: number;
  designsPublished: number;
  designsDraft: number;
  servicesTotal: number;
  servicesPublished: number;
  galleryCount: number;
  testimonialsCount: number;
  faqsCount: number;
  aiProvidersCount: number;
  whatsappNumber: string;
  email: string;
  instagramHandle: string;
  city: string;
  state: string;
  availability: string;
  tablesReady: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    designsTotal: 6,
    designsPublished: 6,
    designsDraft: 0,
    servicesTotal: 5,
    servicesPublished: 5,
    galleryCount: 6,
    testimonialsCount: 5,
    faqsCount: 6,
    aiProvidersCount: 1,
    whatsappNumber: '+91 98765 43210',
    email: 'hello@hennabyaayesha.com',
    instagramHandle: '@henna_by_aayesha',
    city: 'Bengaluru',
    state: 'Karnataka',
    availability: 'Available across Bengaluru & nearby areas',
    tablesReady: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient();

        // 1. Fetch site settings & location
        const res = await fetch('/api/admin/settings');
        let coreSettings = null;
        let extSettings = null;
        if (res.ok) {
          const json = await res.json();
          coreSettings = json.settings;
          extSettings = json.extended;
        }

        // 2. Count designs
        const { data: designs } = await supabase
          .from('mehndi_designs')
          .select('active');

        const dTotal = designs ? designs.length : 6;
        const dPub = designs ? designs.filter((d) => d.active).length : 6;
        const dDraft = dTotal - dPub;

        // 3. Count services
        const { data: services } = await supabase
          .from('services')
          .select('active');

        const sTotal = services ? services.length : 5;
        const sPub = services ? services.filter((s) => s.active).length : 5;

        // 4. Count gallery
        const { count: gallery } = await supabase
          .from('gallery')
          .select('*', { count: 'exact', head: true });

        // 5. Count testimonials
        const { count: testimonials } = await supabase
          .from('testimonials')
          .select('*', { count: 'exact', head: true });

        // 6. Count FAQs
        const faqsRes = await fetch('/api/admin/faqs');
        let faqsCount = 6;
        if (faqsRes.ok) {
          const faqsJson = await faqsRes.json();
          if (faqsJson.faqs) {
            faqsCount = faqsJson.faqs.length;
          }
        }

        // 7. AI Providers
        const { count: aiCount } = await supabase
          .from('ai_providers')
          .select('*', { count: 'exact', head: true });

        setStats({
          designsTotal: dTotal,
          designsPublished: dPub,
          designsDraft: dDraft,
          servicesTotal: sTotal,
          servicesPublished: sPub,
          galleryCount: gallery ?? 6,
          testimonialsCount: testimonials ?? 5,
          faqsCount,
          aiProvidersCount: aiCount ?? 1,
          whatsappNumber: coreSettings?.whatsapp_number || '+91 98765 43210',
          email: coreSettings?.email || 'hello@hennabyaayesha.com',
          instagramHandle: coreSettings?.instagram_url || '@henna_by_aayesha',
          city: extSettings?.location?.city || 'Bengaluru',
          state: extSettings?.location?.state || 'Karnataka',
          availability: extSettings?.location?.availability || 'Available across Bengaluru & nearby areas',
          tablesReady: true,
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EADBCE]">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            Overview
          </span>
          <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1">
            Centralized hub to manage content, service packages, client reviews, dynamic location, and AI studio settings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/settings"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs font-semibold hover:bg-[#381A0E] transition-all shadow-xs flex-1 sm:flex-none"
          >
            <span>Site & Location</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D6C1AF] bg-white text-[#4E2714] text-xs font-semibold hover:bg-[#FDFBF7] transition-all shadow-xs flex-1 sm:flex-none"
          >
            <span>Preview Site ↗</span>
          </Link>
        </div>
      </div>

      {/* Analytics Banner */}
      <div className="bg-gradient-to-r from-[#2E160C] to-[#432314] text-[#FAF3EE] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#C29B4D] font-bold">
              Visitor Tracking & Analytics
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
            </span>
            <span className="text-[10px] font-bold text-[#25D366]">Live</span>
          </div>
          <h2 className="font-serif-heading text-xl sm:text-2xl font-bold text-white">
            Client Traffic & Conversion Insights
          </h2>
          <p className="text-xs text-[#D4C3B3] max-w-xl">
            Monitor real-time active sessions, WhatsApp inquiries, appointment button clicks, and bridal lookbook engagement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
          <Link
            href="/admin/analytics/live"
            className="px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/40 transition-colors text-center"
          >
            Live Visitors →
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-[#C29B4D] text-[#2E160C] hover:bg-[#D4AC5E] shadow-xs transition-colors text-center"
          >
            Open Analytics Dashboard →
          </Link>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Designs */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#EADFD3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
                Mehndi Designs
              </span>
              <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#B95945]">✨</span>
            </div>
            <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
              {loading ? '...' : stats.designsTotal}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#703D24]">
              <span className="text-[#1EBE5D] font-semibold">{stats.designsPublished} Published</span>
              <span>•</span>
              <span className="text-[#A39184]">{stats.designsDraft} Draft</span>
            </div>
          </div>
          <Link
            href="/admin/designs"
            className="mt-4 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage designs →
          </Link>
        </div>

        {/* Services */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#EADFD3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
                Services & Packages
              </span>
              <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#C29B4D]">📋</span>
            </div>
            <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
              {loading ? '...' : stats.servicesTotal}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#703D24]">
              <span className="text-[#1EBE5D] font-semibold">{stats.servicesPublished} Active</span>
            </div>
          </div>
          <Link
            href="/admin/services"
            className="mt-4 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage packages →
          </Link>
        </div>

        {/* FAQs */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#EADFD3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
                Published FAQs
              </span>
              <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#B95945]">❓</span>
            </div>
            <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
              {loading ? '...' : stats.faqsCount}
            </div>
            <div className="mt-1 text-xs text-[#703D24]">
              Included in AI Knowledge Base
            </div>
          </div>
          <Link
            href="/admin/faqs"
            className="mt-4 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage FAQs →
          </Link>
        </div>

        {/* Testimonials */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#EADFD3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#847269]">
                Testimonials
              </span>
              <span className="p-2 rounded-xl bg-[#FAF3EE] text-[#1EBE5D]">💬</span>
            </div>
            <div className="mt-3 font-serif-heading text-3xl font-bold text-[#261B16]">
              {loading ? '...' : stats.testimonialsCount}
            </div>
            <div className="mt-1 text-xs text-[#703D24]">
              Verified Bridal Reviews
            </div>
          </div>
          <Link
            href="/admin/testimonials"
            className="mt-4 text-xs text-[#B95945] hover:underline font-semibold inline-block"
          >
            Manage reviews →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#EADFD3] shadow-xs">
        <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] mb-4">
          Quick Management Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          <Link
            href="/admin/homepage"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">🏠</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              Homepage & Hero
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Edit hero headlines, CTAs, and section toggles
            </p>
          </Link>

          <Link
            href="/admin/why-choose-us"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">🌿</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              Why Choose Us
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Highlight organic henna and studio artistry
            </p>
          </Link>

          <Link
            href="/admin/seo"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">🔍</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              SEO & Metadata
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Configure titles, meta descriptions, and schema
            </p>
          </Link>

          <Link
            href="/admin/ai-settings"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">🤖</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              AI Studio Assistant
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Providers, knowledge base & RAG settings
            </p>
          </Link>

          <Link
            href="/admin/ai-conversations"
            className="p-4 rounded-2xl bg-[#FAF3EE] hover:bg-[#F5ECE4] border border-[#EADBCE] transition-all group"
          >
            <span className="text-xl">💬</span>
            <h3 className="font-semibold text-sm text-[#4E2714] mt-2 group-hover:text-[#B95945]">
              AI Chat History
            </h3>
            <p className="text-xs text-[#847269] mt-1">
              Browse real-time conversations & user queries
            </p>
          </Link>
        </div>
      </div>

      {/* Live System Configuration Snapshot */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#EADFD3] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-serif-heading text-lg font-semibold text-[#261B16]">
              Live Site & Location Snapshot
            </h3>
            <p className="text-xs text-[#703D24]">
              Values dynamically served to public pages, schemas, and AI responses.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs font-semibold text-[#B95945] hover:underline self-start sm:self-auto"
          >
            Change in Settings →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              Primary Service City
            </span>
            <span className="text-base font-bold text-[#4E2714] mt-1 block">
              {stats.city}
            </span>
            <span className="text-[11px] text-[#A39184]">{stats.state}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              WhatsApp Booking
            </span>
            <span className="text-base font-bold text-[#4E2714] mt-1 block font-mono text-sm">
              {stats.whatsappNumber}
            </span>
            <span className="text-[11px] text-[#1EBE5D]">Single Source of Truth</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              Contact Email
            </span>
            <span className="text-sm font-semibold text-[#4E2714] mt-1 block truncate break-all [overflow-wrap:anywhere]" title={stats.email}>
              {stats.email}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EADBCE]">
            <span className="text-[11px] uppercase tracking-wider text-[#847269] font-medium block">
              Service Availability
            </span>
            <span className="text-xs font-semibold text-[#703D24] mt-1 block truncate" title={stats.availability}>
              {stats.availability}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
