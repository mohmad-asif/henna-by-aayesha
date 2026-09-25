'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DateFilterSelector } from '@/components/admin/analytics/date-filter-selector';
import { DistributionCard } from '@/components/admin/analytics/distribution-card';
import { AnalyticsOverview } from '@/types/analytics';

export default function TrafficSourcesPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const fetchSources = useCallback(async () => {
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
      }
    } catch (err) {
      console.error('Failed to load traffic sources:', err);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) {
        fetchSources();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchSources]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?type=visitors&range=${range}`);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `henna_traffic_sources_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌐</span>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16]">
            Traffic Sources & Acquisition
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#703D24]">
          Understand where brides and clients discover Henna by Aayesha (direct, organic search, Instagram, campaigns)
        </p>
      </div>

      {/* Date Filter & Export */}
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

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#C29B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#847269]">Loading acquisition data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DistributionCard
            title="Channels & Referrers"
            subtitle="Acquisition breakdown by referring channel"
            items={(data?.trafficSources || []).map((s) => ({
              label: s.source,
              count: s.count,
              percentage: s.percentage,
              icon: s.source.toLowerCase().includes('instagram') ? '📸' : s.source.toLowerCase().includes('google') ? '🔍' : '🌐',
            }))}
            barColor="gold"
          />

          <DistributionCard
            title="Geographic Location Sources"
            subtitle="Top approximate city and regional origin"
            items={(data?.topLocations || []).map((l) => ({
              label: l.location,
              count: l.count,
              percentage: l.percentage,
              icon: '📍',
            }))}
            barColor="brown"
          />
        </div>
      )}
    </div>
  );
}
