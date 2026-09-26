'use client';

import React, { useState, useEffect } from 'react';
import { HeroConfig, SectionToggles } from '@/types';
import { DEFAULT_HERO, DEFAULT_SECTIONS } from '@/config/defaults';

export default function AdminHomepageConfigPage() {
  const [hero, setHero] = useState<HeroConfig>(DEFAULT_HERO);
  const [sections, setSections] = useState<SectionToggles>(DEFAULT_SECTIONS);
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
          if (data.extended?.hero) {
            setHero({ ...DEFAULT_HERO, ...data.extended.hero });
          }
          if (data.extended?.sections) {
            setSections({ ...DEFAULT_SECTIONS, ...data.extended.sections });
          }
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Failed to load homepage settings' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleHeroChange = (field: keyof HeroConfig, val: string) => {
    setHero((prev) => ({ ...prev, [field]: val }));
  };

  const handleToggleSection = (key: keyof SectionToggles) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero,
          sections,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to update homepage' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Homepage settings updated successfully! Public website cache refreshed.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving homepage configuration' });
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
          Website Configuration
        </span>
        <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
          Homepage & Hero Section
        </h1>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${statusMsg.type === 'success'
              ? 'bg-[#EAFBF0] border-[#D0F4DE] text-[#1EBE5D]'
              : 'bg-[#FDF2F2] border-[#F8D7DA] text-[#9B2C2C]'
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section Toggles */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-5">
          <div className="border-b border-[#F0E5D8] pb-3">
            <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
              Section Visibility Toggles
            </h2>
            <p className="text-xs text-[#703D24] mt-0.5">
              Turn specific homepage blocks on or off instantly without modifying source code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'hero' as const, label: 'Hero Banner', desc: 'Main headline & hero CTA' },
              { key: 'services' as const, label: 'Services Showcase', desc: 'Bridal & event packages' },
              { key: 'designs' as const, label: 'Featured Designs', desc: 'Design gallery preview' },
              { key: 'about' as const, label: 'About Story', desc: 'Artist background & organic henna' },
              { key: 'whyChooseUs' as const, label: 'Why Choose Us', desc: 'Studio highlights & values' },
              { key: 'testimonials' as const, label: 'Client Testimonials', desc: 'Verified bridal reviews' },
              { key: 'faq' as const, label: 'Frequently Asked Questions', desc: 'Common inquiries' },
              { key: 'instagram' as const, label: 'Instagram / Social Feed', desc: 'Social community banner' },
              { key: 'contactCta' as const, label: 'Contact & Booking CTA', desc: 'Direct WhatsApp booking' },
            ].map((sec) => (
              <label
                key={sec.key}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${sections[sec.key]
                    ? 'border-[#B95945]/40 bg-[#FDFBF7]'
                    : 'border-[#EADFD3] bg-[#F9F7F4] opacity-70'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sections[sec.key]}
                  onChange={() => handleToggleSection(sec.key)}
                  className="mt-0.5 w-4 h-4 rounded text-[#B95945] focus:ring-[#B95945]"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-[#261B16] block">
                    {sec.label}
                  </span>
                  <span className="text-[11px] text-[#703D24] block mt-0.5">
                    {sec.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Hero Section Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-6">
          <div className="border-b border-[#F0E5D8] pb-3">
            <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
              Hero Banner Content
            </h2>
            <p className="text-xs text-[#703D24] mt-0.5">
              Control the primary visual headline and call-to-actions greeting your visitors.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Eyebrow / Badge Text
              </label>
              <input
                type="text"
                value={hero.badge}
                onChange={(e) => handleHeroChange('badge', e.target.value)}
                placeholder="e.g. Master Bridal Mehndi Artist in {city}"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
              <span className="text-[10px] text-[#A39184] block mt-1">
                Tip: You can use {'{city}'} or {'{state}'} placeholders for dynamic location rendering.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Main Headline
                </label>
                <input
                  type="text"
                  required
                  value={hero.title}
                  onChange={(e) => handleHeroChange('title', e.target.value)}
                  placeholder="e.g. Pure Organic Mehndi"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Highlighted Word / Accent Phrase
                </label>
                <input
                  type="text"
                  value={hero.highlightedTitle}
                  onChange={(e) => handleHeroChange('highlightedTitle', e.target.value)}
                  placeholder="e.g. Artistry in {city}"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={hero.description}
                onChange={(e) => handleHeroChange('description', e.target.value)}
                placeholder="Exquisite bridal henna, intricate Arabic motifs, and bespoke event packages..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Primary Button Text (WhatsApp Booking)
                </label>
                <input
                  type="text"
                  value={hero.primaryCtaText}
                  onChange={(e) => handleHeroChange('primaryCtaText', e.target.value)}
                  placeholder="Book on WhatsApp"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Secondary Button Text (Design Gallery)
                </label>
                <input
                  type="text"
                  value={hero.secondaryCtaText}
                  onChange={(e) => handleHeroChange('secondaryCtaText', e.target.value)}
                  placeholder="Explore Designs"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Hero Image URL
                </label>
                <input
                  type="text"
                  value={hero.imageUrl}
                  onChange={(e) => handleHeroChange('imageUrl', e.target.value)}
                  placeholder="/images/hero-bride.jpg"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Hero Image Alt Text
                </label>
                <input
                  type="text"
                  value={hero.imageAlt}
                  onChange={(e) => handleHeroChange('imageAlt', e.target.value)}
                  placeholder="Bespoke bridal mehndi artist in {city}"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
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
            {saving ? 'Saving changes...' : 'Save Homepage Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
