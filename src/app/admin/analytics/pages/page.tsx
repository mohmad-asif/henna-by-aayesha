'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DateFilterSelector } from '@/components/admin/analytics/date-filter-selector';
import { DistributionCard } from '@/components/admin/analytics/distribution-card';
import { AnalyticsOverview } from '@/types/analytics';

export default function PagesAnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPages = useCallback(async () => {
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
      console.error('Failed to load pages analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) {
        fetchPages();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchPages]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      let url = `/api/admin/analytics/export?type=pageviews&range=${range}`;
      if (customStart && customEnd) {
        url += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `henna_pageviews_${new Date().toISOString().split('T')[0]}.csv`;
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

  const filteredPages = (data?.topPages || []).filter((p) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return p.urlPath.toLowerCase().includes(s) || (p.title && p.title.toLowerCase().includes(s));
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📄</span>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16]">
              Page Views & Navigation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#703D24]">
            Performance metrics, top landing entrances, and client exploration duration across site paths
          </p>
        </div>
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

      {/* Landing Pages vs Exit Pages Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DistributionCard
          title="Top Landing Pages (Entry Points)"
          subtitle="First page visitors land on when visiting"
          items={(data?.topLandingPages || []).map((l) => ({
            label: l.urlPath,
            count: l.count,
            icon: '🚪',
          }))}
          barColor="brown"
        />

        <DistributionCard
          title="Top Exit Pages (Last Viewed)"
          subtitle="Final page clients viewed before concluding session"
          items={(data?.topExitPages || []).map((e) => ({
            label: e.urlPath,
            count: e.count,
            icon: '🏁',
          }))}
          barColor="gold"
        />
      </div>

      {/* Full Top Pages Table */}
      <div className="bg-white rounded-2xl border border-[#EADFD3] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#F0E5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-heading text-base font-bold text-[#261B16]">
              All Visited Pages ({filteredPages.length})
            </h2>
            <p className="text-xs text-[#847269]">
              Ranked by total page views in selected date range
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by page URL or title..."
            className="px-3 py-1.5 rounded-xl border border-[#D6C1AF] text-xs text-[#261B16] bg-white focus:outline-none focus:ring-2 focus:ring-[#C29B4D] w-full sm:w-64"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-7 h-7 border-2 border-[#C29B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#847269]">Loading page analytics...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <p className="p-8 text-center text-xs text-[#847269]">No pages matching query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                <tr>
                  <th className="py-3 px-4">Page Title & Path</th>
                  <th className="py-3 px-4">Page Views</th>
                  <th className="py-3 px-4">Unique Visitors</th>
                  <th className="py-3 px-4">Avg Duration</th>
                  <th className="py-3 px-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E5D8]">
                {filteredPages.map((p) => (
                  <tr key={p.urlPath} className="hover:bg-[#FAF6F0] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#261B16] block">{p.title || p.urlPath}</span>
                      <span className="font-mono text-[11px] text-[#847269]">{p.urlPath}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#4E2714]">
                      {p.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#703D24]">
                      {p.visitors.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#261B16] font-medium">
                      ⏱ {p.avgDurationSeconds}s
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={p.urlPath}
                        target="_blank"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#B95945] hover:bg-[#FAF3EE]"
                      >
                        Visit Page ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
