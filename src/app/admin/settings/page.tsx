'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { siteConfig } from '@/config/site';
import { DbSiteSettings } from '@/types/database';

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<DbSiteSettings>({
    id: 1,
    business_name: siteConfig.name,
    tagline: siteConfig.tagline,
    whatsapp_number: siteConfig.contact.whatsappDisplayNumber,
    whatsapp_raw: siteConfig.contact.whatsappPhoneRaw,
    whatsapp_message: siteConfig.contact.whatsappDefaultMessage,
    email: siteConfig.contact.email,
    location: `${siteConfig.contact.city}, ${siteConfig.contact.state}, ${siteConfig.contact.country}`,
    short_description: siteConfig.description,
    about_description: 'Over 8 years crafting bridal couture in Bangalore using 100% certified organic Rajasthani henna cones.',
    instagram_url: siteConfig.contact.instagramUrl,
    facebook_url: '',
    website_url: siteConfig.url,
    primary_cta_text: 'Book Appointment on WhatsApp',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (data && !error) {
          setFormData(data as DbSiteSettings);
        }
      } catch {
        // Fallback to initial values
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-compute raw WhatsApp number if display number is typed
      if (name === 'whatsapp_number') {
        updated.whatsapp_raw = value.replace(/\D/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1,
          business_name: formData.business_name,
          tagline: formData.tagline,
          whatsapp_number: formData.whatsapp_number,
          whatsapp_raw: formData.whatsapp_raw || formData.whatsapp_number.replace(/\D/g, ''),
          whatsapp_message: formData.whatsapp_message,
          email: formData.email,
          location: formData.location,
          short_description: formData.short_description,
          about_description: formData.about_description,
          instagram_url: formData.instagram_url,
          facebook_url: formData.facebook_url,
          website_url: formData.website_url,
          primary_cta_text: formData.primary_cta_text,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        setStatusMsg({
          type: 'error',
          text: `Failed to save settings: ${error.message}. If tables are not yet created in your Supabase project, execute supabase/schema.sql in the Supabase SQL editor.`,
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Settings updated successfully! The entire public website will now use these updated contact details.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setStatusMsg({ type: 'error', text: msg });
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
    <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
          Global Configuration
        </span>
        <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
          Contact & Site Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#703D24] mt-1">
          Updating your WhatsApp number or email here automatically updates all buttons, banners, and links across the entire website.
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
          <strong>{statusMsg.type === 'success' ? 'Success:' : 'Note:'}</strong> {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADFD3] shadow-xs space-y-8">
        {/* Contact Architecture Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Primary Booking & WhatsApp Settings
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="whatsapp_number"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Display WhatsApp Number *
              </label>
              <input
                id="whatsapp_number"
                type="text"
                name="whatsapp_number"
                required
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="+91 12345 67890"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
              <span className="text-[11px] text-[#847269] mt-1 block">
                Shown to visitors on the website.
              </span>
            </div>

            <div>
              <label
                htmlFor="whatsapp_raw"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Raw WhatsApp Number (Digits Only) *
              </label>
              <input
                id="whatsapp_raw"
                type="text"
                name="whatsapp_raw"
                required
                value={formData.whatsapp_raw}
                onChange={handleChange}
                placeholder="911234567890"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
              <span className="text-[11px] text-[#847269] mt-1 block">
                Country code + number without plus or spaces (e.g. 919876543210 for wa.me link).
              </span>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="whatsapp_message"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Default WhatsApp Pre-filled Message
              </label>
              <textarea
                id="whatsapp_message"
                name="whatsapp_message"
                rows={2}
                value={formData.whatsapp_message}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
              <span className="text-[11px] text-[#847269] mt-1 block">
                Message that opens automatically in WhatsApp when a user clicks &quot;Book Appointment&quot;.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Contact Email Address *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="hello@hennabyaayesha.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
              <span className="text-[11px] text-[#847269] mt-1 block">
                Used in all &quot;Send Email&quot; buttons and mailto links.
              </span>
            </div>
          </div>
        </div>

        {/* Business Identity Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Business Information
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="business_name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Business Name
              </label>
              <input
                id="business_name"
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Location & Coverage
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="tagline"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Tagline
              </label>
              <input
                id="tagline"
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="short_description"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Short Description
              </label>
              <textarea
                id="short_description"
                name="short_description"
                rows={2}
                value={formData.short_description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>
          </div>
        </div>

        {/* Social Links & CTA Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Social Links & Button Text
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="instagram_url"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Instagram URL
              </label>
              <input
                id="instagram_url"
                type="url"
                name="instagram_url"
                value={formData.instagram_url || ''}
                onChange={handleChange}
                placeholder="https://instagram.com/hennabyaayesha"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="primary_cta_text"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Primary CTA Button Label
              </label>
              <input
                id="primary_cta_text"
                type="text"
                name="primary_cta_text"
                value={formData.primary_cta_text}
                onChange={handleChange}
                placeholder="Book Appointment on WhatsApp"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-[#F0E5D8] flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-[#4E2714] text-white text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              'Save All Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
