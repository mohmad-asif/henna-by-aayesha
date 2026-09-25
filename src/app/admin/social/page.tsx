'use client';

import React, { useState, useEffect } from 'react';
import { SocialLinkItem } from '@/types';
import { DEFAULT_SOCIAL_LINKS } from '@/config/defaults';
import { normalizeInstagram } from '@/lib/settings/contact';

export default function AdminSocialLinksPage() {
  const [links, setLinks] = useState<SocialLinkItem[]>(DEFAULT_SOCIAL_LINKS);
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
          if (data.extended?.socialLinks && data.extended.socialLinks.length > 0) {
            setLinks(data.extended.socialLinks);
          }
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Failed to load social links' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleEnabled = (platform: string) => {
    setLinks((prev) =>
      prev.map((item) => (item.platform === platform ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleUrlChange = (platform: string, val: string) => {
    let cleanVal = val.trim();
    if (platform === 'instagram' && cleanVal) {
      const norm = normalizeInstagram(cleanVal);
      cleanVal = norm.url || cleanVal;
    }
    setLinks((prev) =>
      prev.map((item) => (item.platform === platform ? { ...item, url: cleanVal } : item))
    );
  };

  const handleOrderChange = (platform: string, newOrder: number) => {
    setLinks((prev) =>
      prev.map((item) => (item.platform === platform ? { ...item, displayOrder: newOrder } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    // Also sync the primary instagram_url in site_settings if instagram link is changed
    const instaItem = links.find((l) => l.platform.toLowerCase() === 'instagram');
    const instaUrl = instaItem?.url || '';

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialLinks: links,
          instagram_url: instaUrl,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to update social links' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Social media links updated successfully! Public website cache refreshed.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving social media configuration' });
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
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
          Website Configuration
        </span>
        <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
          Social Media Links
        </h1>
        <p className="text-xs sm:text-sm text-[#703D24] mt-1">
          Manage your social handles and links. Only enabled platforms with valid URLs will appear on the public website.
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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-6">
        <div className="border-b border-[#F0E5D8] pb-3">
          <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
            Connected Channels
          </h2>
          <p className="text-xs text-[#703D24] mt-0.5">
            Toggle which platforms you want visible in the header, footer, and contact sections.
          </p>
        </div>

        <div className="space-y-4">
          {links
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => (
              <div
                key={item.platform}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.enabled ? 'border-[#B95945]/40 bg-[#FDFBF7]' : 'border-[#EADFD3] bg-[#F9F7F4] opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleEnabled(item.platform)}
                    className="w-4 h-4 rounded text-[#B95945] focus:ring-[#B95945]"
                    id={`soc-${item.platform}`}
                  />
                  <div>
                    <span className="text-sm font-semibold capitalize text-[#261B16] block">
                      {item.platform}
                    </span>
                    <span className="text-[11px] text-[#A39184]">
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => handleUrlChange(item.platform, e.target.value)}
                    placeholder={
                      item.platform.toLowerCase() === 'instagram'
                        ? 'https://instagram.com/henna_by_aayesha or @henna_by_aayesha'
                        : `https://${item.platform.toLowerCase()}.com/yourhandle`
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-[#703D24] font-medium">Order:</span>
                  <input
                    type="number"
                    min={1}
                    value={item.displayOrder}
                    onChange={(e) =>
                      handleOrderChange(item.platform, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-16 px-2 py-1 text-xs text-center rounded-lg border border-[#EADFD3] bg-white focus:outline-none focus:border-[#B95945]"
                  />
                </div>
              </div>
            ))}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#EADFD3]">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-full bg-[#B95945] text-white text-xs sm:text-sm font-semibold hover:bg-[#A04533] transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Social Links'}
          </button>
        </div>
      </form>
    </div>
  );
}
