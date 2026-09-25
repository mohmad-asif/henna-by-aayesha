'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/admin/analytics/stat-card';
import { DailyTrendChart } from '@/components/admin/analytics/chart-svg';
import { DistributionCard } from '@/components/admin/analytics/distribution-card';
import { DateFilterSelector } from '@/components/admin/analytics/date-filter-selector';
import { AnalyticsOverview } from '@/types/analytics';

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/admin/analytics/overview?range=${range}`;
      if (customStart && customEnd) {
        url += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.settings?.retention_days) {
          setRetentionDays(json.settings.retention_days);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) {
        fetchOverview();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchOverview]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      let url = `/api/admin/analytics/export?type=visitors&range=${range}`;
      if (customStart && customEnd) {
        url += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `henna_analytics_visitors_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveRetention = async () => {
    try {
      const res = await fetch('/api/admin/analytics/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention_days: retentionDays }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        fetchOverview();
      }
    } catch (err) {
      console.error('Failed to save retention settings:', err);
    }
  };

  const handleRunCleanup = async () => {
    if (!confirm(`Are you sure you want to purge analytics data older than ${retentionDays} days? This cannot be undone.`)) {
      return;
    }
    setIsCleaningUp(true);
    setCleanupMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup', daysToKeep: retentionDays }),
      });
      if (res.ok) {
        const json = await res.json();
        setCleanupMessage(`Cleanup complete: Purged ${json.cleanupStats?.deleted_page_views || 0} page views, ${json.cleanupStats?.deleted_events || 0} events, and ${json.cleanupStats?.deleted_visitors || 0} stale visitors.`);
        fetchOverview();
      }
    } catch {
      setCleanupMessage('Cleanup failed. Check logs.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📈</span>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16]">
              Visitor Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/15 text-[#1EBE5D] border border-[#25D366]/30">
              Live First-Party
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#703D24]">
            Privacy-conscious tracking, live active sessions, appointment conversions, and lookbook popularity
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/analytics/live"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#25D366]/15 text-[#1EBE5D] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
            </span>
            <span>Live Visitors ({data?.activeVisitors || 0})</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-[#4E2714] border border-[#D6C1AF] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
          >
            <span>⚙️</span>
            <span>Retention & Privacy</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
      <DateFilterSelector
        range={range}
        onRangeChange={(newRange) => {
          setRange(newRange);
          setCustomStart(undefined);
          setCustomEnd(undefined);
        }}
        startDate={customStart}
        endDate={customEnd}
        onCustomDateChange={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
          setRange('custom');
        }}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {loading && !data ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#C29B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#847269]">Loading analytics metrics...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Stat Cards (Section 4 Requirements) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard
              title="Total Visitors"
              value={data?.totalVisitors || 0}
              subtitle="All-time recorded"
              icon="👥"
              highlight
            />
            <StatCard
              title="Unique Visitors"
              value={data?.uniqueVisitors || 0}
              subtitle="In selected window"
              icon="✨"
            />
            <StatCard
              title="Today's Visitors"
              value={data?.todayVisitors || 0}
              subtitle="Since 12:00 AM"
              icon="☀️"
              badge="Active Today"
              badgeColor="green"
            />
            <StatCard
              title="Last 7 Days"
              value={data?.last7DaysVisitors || 0}
              subtitle="Rolling 7-day volume"
              icon="📅"
            />
            <StatCard
              title="Last 30 Days"
              value={data?.last30DaysVisitors || 0}
              subtitle="Rolling 30-day volume"
              icon="🗓️"
            />
            <StatCard
              title="Total Page Views"
              value={data?.totalPageViews || 0}
              subtitle="Pages served in window"
              icon="📄"
              highlight
            />
            <StatCard
              title="Active Visitors"
              value={data?.activeVisitors || 0}
              subtitle="Active in last 5 mins"
              icon="🟢"
              badge="Live"
              badgeColor="green"
            />
            <StatCard
              title="WhatsApp Inquiries"
              value={data?.whatsappClicks || 0}
              subtitle="WhatsApp clicks"
              icon="💬"
              badge="Primary CTA"
              badgeColor="amber"
            />
            <StatCard
              title="Book Appointment"
              value={data?.appointmentClicks || 0}
              subtitle="Appointment CTA clicks"
              icon="📅"
              badge="High Intent"
              badgeColor="amber"
            />
            <StatCard
              title="AI Assistant Opens"
              value={data?.aiAssistantOpens || 0}
              subtitle="Interactive chatbot"
              icon="🤖"
            />
          </div>

          {/* Activity Trend Chart */}
          <DailyTrendChart data={data?.visitorsByDay || []} />

          {/* Top Pages & Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionCard
              title="Top Visited Pages"
              subtitle="Pages driving the most customer interest"
              items={(data?.topPages || []).map((p) => ({
                label: p.title || p.urlPath,
                count: p.views,
                secondary: `${p.visitors} visitors · ${p.avgDurationSeconds}s avg`,
                icon: '📄',
              }))}
              barColor="brown"
            />

            <DistributionCard
              title="Traffic & Acquisition Sources"
              subtitle="Where website visitors originate"
              items={(data?.trafficSources || []).map((s) => ({
                label: s.source,
                count: s.count,
                percentage: s.percentage,
                icon: '🌐',
              }))}
              barColor="gold"
            />
          </div>

          {/* Devices, Operating Systems & Approximate Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DistributionCard
              title="Device Breakdown"
              subtitle="Mobile vs desktop browsing"
              items={(data?.devices || []).map((d) => ({
                label: d.device,
                count: d.count,
                percentage: d.percentage,
                icon: d.device.toLowerCase().includes('mobile') ? '📱' : '💻',
              }))}
              barColor="brown"
            />

            <DistributionCard
              title="Top Browsers & Systems"
              subtitle="Software utilized by brides & clients"
              items={(data?.browsers || []).slice(0, 5).map((b) => ({
                label: b.browser,
                count: b.count,
                percentage: b.percentage,
                icon: '🧭',
              }))}
              barColor="gold"
            />

            <DistributionCard
              title="Approximate Locations"
              subtitle="Regional visitor distribution (e.g. Bangalore)"
              items={(data?.topLocations || []).map((loc) => ({
                label: loc.location,
                count: loc.count,
                percentage: loc.percentage,
                icon: '📍',
              }))}
              barColor="green"
            />
          </div>

          {/* Business Conversion & Events Summary */}
          <div className="bg-white rounded-2xl p-5 border border-[#EADFD3] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#261B16]">
                  High-Value Business Conversions
                </h3>
                <p className="text-xs text-[#847269]">
                  Summary of client touchpoints tracked in this period
                </p>
              </div>
              <Link
                href="/admin/analytics/events"
                className="text-xs font-semibold text-[#B95945] hover:underline"
              >
                View Full Event Stream →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] text-center">
                <span className="text-xs text-[#847269] block mb-1">WhatsApp Clicks</span>
                <span className="text-xl font-bold font-serif-heading text-[#4E2714]">
                  {data?.whatsappClicks || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] text-center">
                <span className="text-xs text-[#847269] block mb-1">Book Appointments</span>
                <span className="text-xl font-bold font-serif-heading text-[#4E2714]">
                  {data?.appointmentClicks || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] text-center">
                <span className="text-xs text-[#847269] block mb-1">AI Assistant Opens</span>
                <span className="text-xl font-bold font-serif-heading text-[#4E2714]">
                  {data?.aiAssistantOpens || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] text-center">
                <span className="text-xs text-[#847269] block mb-1">AI Inquiries Sent</span>
                <span className="text-xl font-bold font-serif-heading text-[#4E2714]">
                  {data?.aiMessagesSent || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] text-center">
                <span className="text-xs text-[#847269] block mb-1">Instagram Clicks</span>
                <span className="text-xl font-bold font-serif-heading text-[#4E2714]">
                  {data?.instagramClicks || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] text-center">
                <span className="text-xs text-[#847269] block mb-1">Email Clicks</span>
                <span className="text-xl font-bold font-serif-heading text-[#4E2714]">
                  {data?.emailClicks || 0}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Settings & Data Retention Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#EADFD3] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-4">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#261B16]">
                  Analytics Settings & Data Retention
                </h3>
                <p className="text-xs text-[#847269]">
                  Configure automatic pruning and privacy parameters
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-xs text-[#847269] hover:text-[#261B16]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#261B16] block">
                  Data Retention Period (Days):
                </label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-white border border-[#D6C1AF] rounded-xl text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#C29B4D]"
                >
                  <option value={30}>30 Days (Strict Privacy)</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={180}>180 Days (Half Year)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
                <p className="text-[11px] text-[#A39184]">
                  Data older than this cutoff will be purged automatically or upon manual trigger.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#EADFD3] space-y-2">
                <span className="font-semibold text-[#4E2714] block">
                  Manual Data Cleanup Trigger
                </span>
                <p className="text-[11px] text-[#703D24]">
                  Run an immediate cleanup cycle to purge all sessions, page views, and visitor records older than {retentionDays} days.
                </p>
                <button
                  type="button"
                  onClick={handleRunCleanup}
                  disabled={isCleaningUp}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#B95945] hover:bg-[#A34B38] text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCleaningUp ? 'Purging Old Records...' : `Run Cleanup (${retentionDays}d cutoff)`}
                </button>
                {cleanupMessage && (
                  <p className="text-[11px] font-medium text-[#1EBE5D] mt-1">
                    {cleanupMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0E5D8]">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#847269] hover:text-[#261B16]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveRetention}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#4E2714] hover:bg-[#381A0E] text-white shadow-xs cursor-pointer"
              >
                Save Retention Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
