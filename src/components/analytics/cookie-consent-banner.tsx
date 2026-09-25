'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HennaFloralMotif, ShieldCheckIcon } from '@/components/ui/icons';

const CONSENT_KEY = 'hba_consent';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Only show on client if no decision has been recorded yet
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Gentle delayed appearance so it doesn't jarringly block initial render
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // Fallback
    }
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'declined');
    } catch {
      // Fallback
    }
    setVisible(false);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(CONSENT_KEY, analyticsEnabled ? 'accepted' : 'declined');
    } catch {
      // Fallback
    }
    setShowPreferences(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy and cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto bg-[#2E160C]/95 backdrop-blur-md text-[#FAF3EE] border border-[#5A2C18] rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 pointer-events-auto transition-all animate-fadeIn">
        {!showPreferences ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#4E2714] flex items-center justify-center text-[#C29B4D] flex-shrink-0 mt-0.5">
                <HennaFloralMotif size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheckIcon size={16} className="text-[#C29B4D]" />
                  <span>Privacy-First Visitor Experience</span>
                </p>
                <p className="text-xs text-[#D4C3B3] leading-relaxed max-w-2xl">
                  We use lightweight, privacy-conscious analytics to refine our bridal lookbooks and studio navigation. We never sell data, store passwords, or record payment details. Learn more in our{' '}
                  <Link href="/privacy" className="text-[#E8A598] hover:underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 self-end md:self-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#D4C3B3] hover:text-white hover:bg-[#432314] transition-colors cursor-pointer"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-[#FAF3EE] bg-[#432314] hover:bg-[#532C19] border border-[#6B3720] transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#2E160C] bg-[#C29B4D] hover:bg-[#D4AC5E] shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#432314] pb-3">
              <h3 className="font-serif-heading text-base font-bold text-white">
                Customize Privacy & Analytics Preferences
              </h3>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="text-xs text-[#D4C3B3] hover:text-white"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#D4C3B3]">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#231008] border border-[#3E1E11]">
                <div>
                  <span className="font-semibold text-white block">Essential Cookies</span>
                  <span className="text-[11px] text-[#A39184]">
                    Required for core website security, WhatsApp routing, and booking navigation.
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C29B4D] bg-[#4E2714] px-2 py-0.5 rounded">
                  Always Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#231008] border border-[#3E1E11]">
                <div className="pr-4">
                  <span className="font-semibold text-white block">Anonymized Analytics & Performance</span>
                  <span className="text-[11px] text-[#A39184]">
                    Helps us understand popular bridal designs and page load speeds without identifying individuals.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#432314] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C29B4D]"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="px-3.5 py-1.5 text-xs text-[#D4C3B3] hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#2E160C] bg-[#C29B4D] hover:bg-[#D4AC5E] shadow-sm cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
