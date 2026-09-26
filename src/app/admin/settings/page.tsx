'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { normalizeWhatsAppPhone, normalizeInstagram } from '@/config/site';
import { DbSiteSettings } from '@/types/database';
import { SiteLocationConfig } from '@/types';
import { DEFAULT_LOCATION } from '@/lib/settings/location';

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<DbSiteSettings>({
    id: 1,
    business_name: 'Henna by Aayesha',
    tagline: 'Exquisite Organic Bridal Mehndi Artistry',
    whatsapp_number: '+91 98765 43210',
    whatsapp_raw: '919876543210',
    whatsapp_message: 'Hi Aayesha, I would like to book a mehndi appointment. Please share your availability and details.',
    email: 'hello@hennabyaayesha.com',
    location: 'Bengaluru / Bangalore, Karnataka, India',
    short_description: 'Premier bridal and bespoke henna artistry using 100% natural, certified organic Rajasthani henna.',
    about_description: 'Over 8 years crafting bridal couture using 100% certified organic Rajasthani henna cones.',
    instagram_url: 'https://instagram.com/henna_by_aayesha',
    facebook_url: '',
    website_url: 'https://hennabyaayesha.com',
    primary_cta_text: 'Book Appointment on WhatsApp',
  });

  const [locationData, setLocationData] = useState<SiteLocationConfig>(DEFAULT_LOCATION);
  const [instagramInput, setInstagramInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live WhatsApp normalization preview
  const phonePreview = useMemo(() => {
    return normalizeWhatsAppPhone(formData.whatsapp_number);
  }, [formData.whatsapp_number]);

  // Live Instagram normalization preview
  const instagramPreview = useMemo(() => {
    return normalizeInstagram(instagramInput);
  }, [instagramInput]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const json = await res.json();
          if (json.settings) {
            setFormData(json.settings);
            if (json.settings.instagram_url) {
              const norm = normalizeInstagram(json.settings.instagram_url);
              setInstagramInput(norm.displayHandle || json.settings.instagram_url);
            }
          }
          if (json.extended?.location) {
            setLocationData({ ...DEFAULT_LOCATION, ...json.extended.location });
          }
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
      if (name === 'whatsapp_number') {
        const norm = normalizeWhatsAppPhone(value);
        updated.whatsapp_raw = norm.raw;
      }
      return updated;
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocationData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'businessHours') {
        updated.operatingHours = value;
      }
      return updated;
    });
  };

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInstagramInput(val);
    const norm = normalizeInstagram(val);
    setFormData((prev) => ({
      ...prev,
      instagram_url: norm.url || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    // Frontend validation
    if (!phonePreview.isValid || !phonePreview.raw) {
      setStatusMsg({
        type: 'error',
        text: 'Please enter a valid WhatsApp phone number with 7-15 digits (e.g. +91 98765 43210 or 9876543210).',
      });
      setSaving(false);
      return;
    }

    if (instagramInput.trim().length > 0 && (!instagramPreview.isValid || !instagramPreview.handle)) {
      setStatusMsg({
        type: 'error',
        text: 'Invalid Instagram handle. Handle must contain only letters, numbers, periods, and underscores (e.g. @aayesha_mehndi or aayesha_mehndi).',
      });
      setSaving(false);
      return;
    }

    if (!locationData.city?.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Primary Service City is required.',
      });
      setSaving(false);
      return;
    }

    const timingValue = locationData.businessHours?.trim() || locationData.operatingHours?.trim() || '';
    const syncedLocation: SiteLocationConfig = {
      ...locationData,
      businessHours: timingValue,
      operatingHours: timingValue,
    };

    const payload = {
      ...formData,
      whatsapp_number: phonePreview.display,
      whatsapp_raw: phonePreview.raw,
      instagram_url: instagramInput.trim() ? instagramPreview.url : '',
      location: syncedLocation,
    };

    try {
      // Send through centralized Admin API route which handles server-side validation and Next.js cache revalidation
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        console.error('[Admin Settings UI] Save error response:', resData);
        setStatusMsg({
          type: 'error',
          text: `Failed to save settings: ${resData.error || 'Unable to update settings. Please try again.'}`,
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Settings and location configuration updated successfully!',
        });
        if (resData.settings) {
          setFormData(resData.settings);
          if (resData.settings.instagram_url) {
            const norm = normalizeInstagram(resData.settings.instagram_url);
            setInstagramInput(norm.displayHandle || resData.settings.instagram_url);
          } else {
            setInstagramInput('');
          }
        }
        if (resData.extended?.location) {
          setLocationData({
            ...DEFAULT_LOCATION,
            ...resData.extended.location,
            businessHours: resData.extended.location.businessHours || resData.extended.location.operatingHours || '',
            operatingHours: resData.extended.location.businessHours || resData.extended.location.operatingHours || '',
          });
        }
      }
    } catch (err: unknown) {
      console.error('[Admin Settings UI] Unexpected error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred while saving';
      setStatusMsg({ type: 'error', text: `Failed to save settings: ${msg}` });
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
      {/* Page Header */}
      <div>
        <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
          Global Configuration • Single Source of Truth
        </span>
        <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
          Site & Location Settings
        </h1>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${statusMsg.type === 'success'
            ? 'bg-[#EAFBF0] border-[#D0F4DE] text-[#1EBE5D]'
            : 'bg-[#FDF2F2] border-[#F8D7DA] text-[#9B2C2C]'
            }`}
        >
          <strong>{statusMsg.type === 'success' ? 'Success:' : 'Note:'}</strong> {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADFD3] shadow-xs space-y-8">
        {/* Dynamic Location Architecture Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Dynamic Location & Service Area Settings
          </h2>
          <p className="text-xs text-[#703D24] mt-1 mb-4">
            Zero hardcoded cities. Changing this updates your SEO schema, hero banner, services descriptions, footer, and AI context seamlessly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="city"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Primary Service City *
              </label>
              <input
                id="city"
                type="text"
                name="city"
                required
                value={locationData.city}
                onChange={handleLocationChange}
                placeholder="e.g. Bengaluru or Dubai"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="altCity"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Alternative City Name (Optional)
              </label>
              <input
                id="altCity"
                type="text"
                name="altCity"
                value={locationData.altCity || ''}
                onChange={handleLocationChange}
                placeholder="e.g. Bangalore"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                State / Region
              </label>
              <input
                id="state"
                type="text"
                name="state"
                value={locationData.state}
                onChange={handleLocationChange}
                placeholder="e.g. Karnataka"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Country
              </label>
              <input
                id="country"
                type="text"
                name="country"
                value={locationData.country}
                onChange={handleLocationChange}
                placeholder="e.g. India"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="serviceAreaLabel"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Service Area Description
              </label>
              <input
                id="serviceAreaLabel"
                type="text"
                name="serviceAreaLabel"
                value={locationData.serviceAreaLabel}
                onChange={handleLocationChange}
                placeholder="e.g. Serving Bengaluru and nearby areas"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="availability"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Service Availability Banner
              </label>
              <input
                id="availability"
                type="text"
                name="availability"
                value={locationData.availability}
                onChange={handleLocationChange}
                placeholder="e.g. Available only in Bengaluru and surrounding zones"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Business Studio Address
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={locationData.address || ''}
                onChange={handleLocationChange}
                placeholder="e.g. Indiranagar, Bengaluru, Karnataka 560038"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="businessHours"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Business Hours
              </label>
              <input
                id="businessHours"
                type="text"
                name="businessHours"
                value={locationData.businessHours || ''}
                onChange={handleLocationChange}
                placeholder="Mon – Sun: 9:00 AM – 8:00 PM"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="googleMapsUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Google Maps URL
              </label>
              <input
                id="googleMapsUrl"
                type="url"
                name="googleMapsUrl"
                value={locationData.googleMapsUrl || ''}
                onChange={handleLocationChange}
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>
          </div>
        </div>

        {/* Contact Architecture Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Primary Booking & WhatsApp Settings
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label
                htmlFor="whatsapp_number"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                WhatsApp Number *
              </label>
              <input
                id="whatsapp_number"
                type="text"
                name="whatsapp_number"
                required
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="+91 98765 43210 or 9876543210"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />

              {/* Dynamic WhatsApp Normalization Preview */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF6F0] border border-[#EADBCE] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#847269]">Normalized Display:</span>
                  <span className="font-bold text-[#4E2714]">
                    {phonePreview.isValid ? phonePreview.display : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#847269]">Click-to-chat Link:</span>
                  <span className="font-mono text-[11px] text-[#1EBE5D] truncate max-w-[280px] sm:max-w-none">
                    {phonePreview.isValid ? `https://wa.me/${phonePreview.raw}` : 'Invalid phone number format'}
                  </span>
                </div>
              </div>
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
            </div>
          </div>
        </div>

        {/* Business Identity Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Business Identity & Branding
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

            <div>
              <label
                htmlFor="logoUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Website Logo URL
              </label>
              <input
                id="logoUrl"
                type="text"
                name="logoUrl"
                value={locationData.logoUrl || ''}
                onChange={handleLocationChange}
                placeholder="/images/logo.png"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>

            <div>
              <label
                htmlFor="faviconUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Favicon URL
              </label>
              <input
                id="faviconUrl"
                type="text"
                name="faviconUrl"
                value={locationData.faviconUrl || ''}
                onChange={handleLocationChange}
                placeholder="/favicon.ico"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />
            </div>
          </div>
        </div>

        {/* Social Links & CTA Section */}
        <div>
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16] pb-3 border-b border-[#F0E5D8]">
            Instagram Handle & Booking CTA
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="instagram_input"
                className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1.5"
              >
                Instagram Handle / Profile
              </label>
              <input
                id="instagram_input"
                type="text"
                name="instagram_input"
                value={instagramInput}
                onChange={handleInstagramChange}
                placeholder="@aayesha_mehndi or aayesha_mehndi"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
              />

              {/* Dynamic Instagram Normalization Preview */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF6F0] border border-[#EADBCE] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#847269]">Visible Display Handle:</span>
                  <span className="font-bold text-[#E1306C]">
                    {instagramPreview.isValid ? instagramPreview.displayHandle : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#847269]">Generated Profile URL:</span>
                  <span className="font-mono text-[11px] text-[#4E2714] truncate max-w-[200px] sm:max-w-none">
                    {instagramPreview.isValid ? instagramPreview.url : (instagramInput ? 'Invalid handle' : 'Not configured')}
                  </span>
                </div>
              </div>
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
        <div className="pt-4 border-t border-[#F0E5D8] flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#4E2714] text-white text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving & Revalidating...</span>
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
