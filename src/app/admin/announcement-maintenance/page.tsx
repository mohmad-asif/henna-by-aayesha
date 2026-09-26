'use client';

import React, { useState, useEffect } from 'react';
import { PromoBarConfig } from '@/types';
import { DEFAULT_PROMO_BAR } from '@/config/defaults';

export default function AdminAnnouncementMaintenancePage() {
  const [promo, setPromo] = useState<PromoBarConfig>(DEFAULT_PROMO_BAR);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
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
          if (data.extended?.promo) {
            setPromo(data.extended.promo);
          }
          if (typeof data.extended?.maintenanceMode === 'boolean') {
            setMaintenanceMode(data.extended.maintenanceMode);
          }
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Failed to load announcement & maintenance settings' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePromoChange = (field: keyof PromoBarConfig, val: unknown) => {
    setPromo((prev) => ({ ...prev, [field]: val }));
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
          promo,
          maintenanceMode,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to update settings' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Promo bar and maintenance settings updated! Public website cache refreshed.',
        });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving settings' });
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
          Website Controls
        </span>
        <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
          Promo Bar & Maintenance Mode
        </h1>
        <p className="text-xs sm:text-sm text-[#703D24] mt-1">
          Manage promotional announcement banners atop the header and configure temporary maintenance mode.
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
        {/* Maintenance Mode Box */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-xs transition-all ${
          maintenanceMode
            ? 'bg-[#FDF2F2] border-[#F8D7DA]'
            : 'bg-white border-[#EADFD3]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{maintenanceMode ? '🚧' : '🟢'}</span>
                <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                  Maintenance Mode
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#703D24] mt-1 max-w-xl">
                When enabled, public visitors see an elegant studio maintenance message with WhatsApp contact. The Admin Panel remains fully accessible to you.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-white/80 border border-[#EADFD3] self-start sm:self-auto">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded text-[#B95945] focus:ring-[#B95945]"
              />
              <span className="text-xs sm:text-sm font-bold text-[#261B16]">
                {maintenanceMode ? 'Enabled (Site Inactive)' : 'Disabled (Site Live)'}
              </span>
            </label>
          </div>
        </div>

        {/* Promo Bar Settings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADFD3] shadow-xs space-y-6">
          <div className="border-b border-[#F0E5D8] pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                Top Announcement / Promo Bar
              </h2>
              <p className="text-xs text-[#703D24] mt-0.5">
                Display a prominent ribbon at the top of every page for seasonal bookings or promotions.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={promo.enabled}
                onChange={(e) => handlePromoChange('enabled', e.target.checked)}
                className="w-4 h-4 rounded text-[#B95945] focus:ring-[#B95945]"
              />
              <span className="text-xs font-semibold text-[#261B16]">
                Banner Active
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                Announcement Text
              </label>
              <input
                type="text"
                value={promo.text}
                onChange={(e) => handlePromoChange('text', e.target.value)}
                placeholder="✨ Bridal bookings are now open across {city} for the upcoming wedding season"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
              />
              <span className="text-[10px] text-[#A39184] block mt-1">
                Tip: {'{city}'} automatically renders your dynamic primary service city.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Call to Action (CTA) Button Text
                </label>
                <input
                  type="text"
                  value={promo.ctaText || ''}
                  onChange={(e) => handlePromoChange('ctaText', e.target.value)}
                  placeholder="e.g. Reserve Date"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  CTA Link URL
                </label>
                <input
                  type="text"
                  value={promo.ctaUrl || ''}
                  onChange={(e) => handlePromoChange('ctaUrl', e.target.value)}
                  placeholder="e.g. /contact or #services"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={promo.startDate || ''}
                  onChange={(e) => handlePromoChange('startDate', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={promo.endDate || ''}
                  onChange={(e) => handlePromoChange('endDate', e.target.value)}
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
            {saving ? 'Saving changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
