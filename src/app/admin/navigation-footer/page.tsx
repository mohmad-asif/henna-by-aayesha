'use client';

import React, { useState, useEffect } from 'react';
import { NavigationItem, FooterConfig } from '@/types';
import { DEFAULT_NAVIGATION, DEFAULT_FOOTER } from '@/config/defaults';

export default function AdminNavigationFooterPage() {
  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAVIGATION);
  const [footer, setFooter] = useState<FooterConfig>(DEFAULT_FOOTER);
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
          if (data.extended?.navigation && data.extended.navigation.length > 0) {
            setNavItems(data.extended.navigation);
          }
          if (data.extended?.footer) {
            setFooter({ ...DEFAULT_FOOTER, ...data.extended.footer });
          }
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Failed to load navigation & footer settings' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleNavEnabled = (id: string) => {
    setNavItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleNavLabelChange = (id: string, newLabel: string) => {
    setNavItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label: newLabel } : item))
    );
  };

  const handleNavOrderChange = (id: string, newOrder: number) => {
    setNavItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, displayOrder: newOrder } : item))
    );
  };

  const handleFooterChange = (field: keyof FooterConfig, val: string) => {
    setFooter((prev) => ({ ...prev, [field]: val }));
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
          navigation: navItems,
          footer,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to update settings' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Navigation and footer settings updated successfully! Public website cache refreshed.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving navigation & footer settings' });
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
          Navigation & Footer
        </h1>
        <p className="text-xs sm:text-sm text-[#703D24] mt-1">
          Configure active header menu links (safely restricted to verified system routes) and customize footer text.
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
        {/* Navigation Items */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-5">
          <div className="border-b border-[#F0E5D8] pb-3">
            <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
              Header Navigation Links
            </h2>
            <p className="text-xs text-[#703D24] mt-0.5">
              To guarantee zero broken routes, links point to verified platform pages. You can reorder, rename, or toggle visibility.
            </p>
          </div>

          <div className="space-y-3">
            {navItems
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#EADFD3] bg-[#FDFBF7]"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleToggleNavEnabled(item.id)}
                      className="w-4 h-4 rounded text-[#4E2714] focus:ring-[#4E2714] shrink-0"
                      id={`nav-check-${item.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleNavLabelChange(item.id, e.target.value)}
                          className="px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-[#EADFD3] bg-white focus:outline-none focus:border-[#4E2714] min-w-[120px]"
                        />
                        <code className="text-[11px] text-[#A39184] bg-white px-2 py-1 rounded border border-[#EADFD3] font-mono break-all">
                          {item.url}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="text-xs text-[#703D24] font-medium">Order:</span>
                    <input
                      type="number"
                      min={1}
                      value={item.displayOrder}
                      onChange={(e) =>
                        handleNavOrderChange(item.id, parseInt(e.target.value, 10) || 1)
                      }
                      className="w-16 px-2 py-1 text-xs text-center rounded-lg border border-[#EADFD3] bg-white focus:outline-none focus:border-[#4E2714]"
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer Management */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-6">
          <div className="border-b border-[#F0E5D8] pb-3">
            <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
              Footer Content & Text
            </h2>
            <p className="text-xs text-[#703D24] mt-0.5">
              The public footer automatically renders dynamic contact info, social icons, and these custom paragraphs.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Footer Brand Description
              </label>
              <textarea
                rows={3}
                value={footer.description}
                onChange={(e) => handleFooterChange('description', e.target.value)}
                placeholder="Over 8 years crafting bespoke bridal mehndi in {city} with certified 100% organic Sojat henna..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Copyright Text
              </label>
              <input
                type="text"
                value={footer.copyrightText}
                onChange={(e) => handleFooterChange('copyrightText', e.target.value)}
                placeholder="© {year} Henna by Aayesha. All rights reserved."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
              <span className="text-[10px] text-[#A39184] block mt-1">
                Tip: {'{year}'} automatically formats to current year.
              </span>
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
            {saving ? 'Saving changes...' : 'Save Navigation & Footer'}
          </button>
        </div>
      </form>
    </div>
  );
}
