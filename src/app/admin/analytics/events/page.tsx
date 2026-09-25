'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DateFilterSelector } from '@/components/admin/analytics/date-filter-selector';
import { StatCard } from '@/components/admin/analytics/stat-card';
import { AnalyticsOverview } from '@/types/analytics';

export default function EventsAnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const fetchEvents = useCallback(async () => {
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
      console.error('Failed to load events analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) {
        fetchEvents();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchEvents]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      let url = `/api/admin/analytics/export?type=events&range=${range}`;
      if (customStart && customEnd) {
        url += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `henna_events_${new Date().toISOString().split('T')[0]}.csv`;
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

  const eventEntries = Object.entries(data?.eventCounts || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⚡</span>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16]">
            Business Events & Conversions
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#703D24]">
          Track high-intent booking conversions, WhatsApp inquiries, lookbook opens, and AI assistant engagement
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
          <p className="text-xs text-[#847269]">Loading business event metrics...</p>
        </div>
      ) : (
        <>
          {/* Key Touchpoint Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <StatCard
              title="WhatsApp Inquiries"
              value={data?.whatsappClicks || 0}
              icon="💬"
              badge="High Value"
              badgeColor="green"
            />
            <StatCard
              title="Book Appointment"
              value={data?.appointmentClicks || 0}
              icon="📅"
              badge="Conversion"
              badgeColor="amber"
            />
            <StatCard
              title="AI Assistant Opens"
              value={data?.aiAssistantOpens || 0}
              icon="🤖"
            />
            <StatCard
              title="AI Questions Asked"
              value={data?.aiMessagesSent || 0}
              icon="✨"
            />
            <StatCard
              title="Instagram Clicks"
              value={data?.instagramClicks || 0}
              icon="📸"
            />
            <StatCard
              title="Email Clicks"
              value={data?.emailClicks || 0}
              icon="✉️"
            />
          </div>

          {/* All Tracked Events Table */}
          <div className="bg-white rounded-2xl border border-[#EADFD3] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#F0E5D8]">
              <h2 className="font-serif-heading text-base font-bold text-[#261B16]">
                Tracked Event Catalog
              </h2>
              <p className="text-xs text-[#847269]">
                Aggregated counts for all privacy-safe business interactions
              </p>
            </div>

            {eventEntries.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#847269]">
                No interaction events recorded in this date period yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                    <tr>
                      <th className="py-3 px-4">Event Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Occurrences</th>
                      <th className="py-3 px-4">Privacy Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E5D8]">
                    {eventEntries.map(([eventName, count]) => {
                      const isHighIntent =
                        eventName.includes('WhatsApp') || eventName.includes('Appointment');

                      return (
                        <tr key={eventName} className="hover:bg-[#FAF6F0] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#261B16] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#C29B4D]" />
                            <span>{eventName}</span>
                          </td>
                          <td className="py-3 px-4 text-[#703D24]">
                            {isHighIntent ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/15 text-[#1EBE5D]">
                                Lead Conversion
                              </span>
                            ) : eventName.includes('AI') ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                                AI Engagement
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF3EE] text-[#4E2714]">
                                Interaction
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-sm text-[#4E2714]">
                            {count.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-[#847269] text-[11px]">
                            Anonymized Event Counter (No PII)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
