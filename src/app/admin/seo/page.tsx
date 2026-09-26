'use client';

import React, { useState, useEffect } from 'react';
import { SeoConfig } from '@/types';
import { DEFAULT_SEO } from '@/config/defaults';

export default function AdminSeoPage() {
  const [seo, setSeo] = useState<SeoConfig>(DEFAULT_SEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.extended?.seo) {
            setSeo({ ...DEFAULT_SEO, ...data.extended.seo });
          }
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Failed to load SEO settings' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleChange = (field: keyof SeoConfig, val: string) => {
    setSeo((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to update SEO settings' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'SEO configuration updated! Public website metadata and schema revalidated.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving SEO configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#B95945] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
          Search Engine Optimization
        </span>
        <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
          SEO & Meta Tags Management
        </h1>
        <p className="text-xs sm:text-sm text-[#703D24] mt-1">
          Manage page titles, open graph sharing previews, and search engine metadata. Dynamic tokens like {'{city}'} automatically render your configured city.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
            statusMsg.type === 'success'
              ? 'bg-[#EAFBF0] border-[#D0F4DE] text-[#1EBE5D]'
              : 'bg-[#FDF2F2] border-[#F8D7DA] text-[#9B2C2C]'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Global SEO */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-5">
          <div className="border-b border-[#F0E5D8] pb-3">
            <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
              Global Defaults
            </h2>
            <p className="text-xs text-[#703D24] mt-0.5">
              Applied site-wide unless specifically overridden on an individual page.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Site Title
              </label>
              <input
                type="text"
                value={seo.primaryTitle}
                onChange={(e) => handleChange('primaryTitle', e.target.value)}
                placeholder="Henna by Aayesha | Bridal Mehndi Artist in {city}"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Default Meta Description
              </label>
              <textarea
                rows={3}
                value={seo.defaultMetaDescription}
                onChange={(e) => handleChange('defaultMetaDescription', e.target.value)}
                placeholder="Exquisite organic bridal mehndi, Arabic patterns, and bespoke event packages in {city}..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Keywords (Comma Separated)
                </label>
                <input
                  type="text"
                  value={seo.keywords}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="bridal mehndi, henna artist, organic henna, {city}"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Canonical Base URL
                </label>
                <input
                  type="url"
                  value={seo.canonicalBaseUrl}
                  onChange={(e) => handleChange('canonicalBaseUrl', e.target.value)}
                  placeholder="https://hennabyaayesha.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Open Graph (OG) Image URL
                </label>
                <input
                  type="text"
                  value={seo.ogImage}
                  onChange={(e) => handleChange('ogImage', e.target.value)}
                  placeholder="/images/hero-bride.jpg"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Twitter Card Image URL
                </label>
                <input
                  type="text"
                  value={seo.twitterImage}
                  onChange={(e) => handleChange('twitterImage', e.target.value)}
                  placeholder="/images/hero-bride.jpg"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Page-Specific Overrides */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-6">
          <div className="border-b border-[#F0E5D8] pb-3">
            <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
              Key Page Metadata
            </h2>
            <p className="text-xs text-[#703D24] mt-0.5">
              Specific titles and descriptions for individual landing sections.
            </p>
          </div>

          <div className="space-y-4">
            {/* Homepage */}
            <div className="p-4 rounded-2xl border border-[#EADFD3] bg-[#FDFBF7] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B95945] block">
                Homepage
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seo.homepageTitle}
                    onChange={(e) => handleChange('homepageTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={seo.homepageDescription}
                    onChange={(e) => handleChange('homepageDescription', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="p-4 rounded-2xl border border-[#EADFD3] bg-[#FDFBF7] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B95945] block">
                Services & Packages Page
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seo.servicesTitle}
                    onChange={(e) => handleChange('servicesTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={seo.servicesDescription}
                    onChange={(e) => handleChange('servicesDescription', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
              </div>
            </div>

            {/* Designs */}
            <div className="p-4 rounded-2xl border border-[#EADFD3] bg-[#FDFBF7] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B95945] block">
                Designs & Gallery Page
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seo.designsTitle}
                    onChange={(e) => handleChange('designsTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={seo.designsDescription}
                    onChange={(e) => handleChange('designsDescription', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="p-4 rounded-2xl border border-[#EADFD3] bg-[#FDFBF7] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B95945] block">
                Contact & Booking Page
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seo.contactTitle}
                    onChange={(e) => handleChange('contactTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#703D24] mb-1 uppercase">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={seo.contactDescription}
                    onChange={(e) => handleChange('contactDescription', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end pt-4 border-t border-[#EADFD3]">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#4E2714] text-white text-xs sm:text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md disabled:opacity-50 cursor-pointer text-center"
          >
            {saving ? 'Saving changes...' : 'Save SEO Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
