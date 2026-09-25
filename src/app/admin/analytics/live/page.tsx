'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface LiveVisitor {
  visitor_id: string;
  ip_address?: string | null;
  device_type: string;
  browser: string;
  os: string;
  location_display: string;
  current_page: string;
  last_active_at: string;
  session_duration_seconds: number;
  referrer?: string;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '< 1 min';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(isoString: string): string {
  const diffSec = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}

export default function LiveVisitorsPage() {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/live');
      if (res.ok) {
        const json = await res.json();
        setVisitors(json.visitors || []);
        setTotalActive(json.totalActive || 0);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to poll live visitors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) {
        fetchLive();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchLive]);

  // Periodic polling every 8 seconds when active
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(fetchLive, 8000);
    return () => clearInterval(interval);
  }, [isPolling, fetchLive]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🟢</span>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16]">
              Live Visitors
            </h1>
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#703D24]">
            Real-time visitors browsing Henna by Aayesha within the last 5 minutes
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-[#847269] hidden sm:inline">
            Updated: {lastRefreshed}
          </span>
          <button
            type="button"
            onClick={() => setIsPolling(!isPolling)}
            className={`px-3.5 py-1.5 rounded-xl font-medium border transition-colors cursor-pointer ${
              isPolling
                ? 'bg-[#FAF3EE] text-[#4E2714] border-[#D6C1AF] hover:bg-[#F2ECE4]'
                : 'bg-white text-[#847269] border-[#EADFD3] hover:text-[#261B16]'
            }`}
          >
            {isPolling ? '⏸ Pause Polling' : '▶ Resume Live'}
          </button>
          <button
            type="button"
            onClick={fetchLive}
            className="px-3.5 py-1.5 rounded-xl font-semibold bg-[#4E2714] text-white hover:bg-[#381A0E] transition-colors cursor-pointer"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-[#2E160C] to-[#432314] text-[#FAF3EE] rounded-2xl p-5 sm:p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#C29B4D] font-bold">
            Real-Time Presence
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif-heading text-3xl sm:text-4xl font-bold text-white">
              {totalActive}
            </span>
            <span className="text-xs sm:text-sm text-[#D4C3B3]">
              {totalActive === 1 ? 'visitor active right now' : 'visitors active right now'}
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-[#D4C3B3] hidden sm:block">
          <p>Active Window: <strong>5 minutes</strong></p>
          <p className="text-[11px] text-[#A39184]">Heartbeat interval: 30 seconds</p>
        </div>
      </div>

      {/* Live Visitors Table */}
      <div className="bg-white rounded-2xl border border-[#EADFD3] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F0E5D8] flex items-center justify-between">
          <h2 className="font-serif-heading text-base font-bold text-[#261B16]">
            Active Sessions ({visitors.length})
          </h2>
          <span className="text-xs text-[#847269]">
            Excludes admin staff and search bots
          </span>
        </div>

        {loading && visitors.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-7 h-7 border-2 border-[#C29B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#847269]">Checking active sessions...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF3EE] flex items-center justify-center text-xl mx-auto">
              🌿
            </div>
            <p className="font-serif-heading text-lg font-bold text-[#261B16]">
              No Live Visitors Detected
            </p>
            <p className="text-xs text-[#847269] max-w-sm mx-auto">
              There have been no active page requests or heartbeats in the last 5 minutes. As visitors land on the website, they will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                <tr>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Device / System</th>
                  <th className="py-3 px-4">Current Page</th>
                  <th className="py-3 px-4">Session Duration</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E5D8]">
                {visitors.map((v) => (
                  <tr key={v.visitor_id} className="hover:bg-[#FAF6F0] transition-colors">
                    {/* Visitor ID Badge */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#4E2714]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#25D366] flex-shrink-0" />
                        <span title={v.visitor_id}>
                          {v.visitor_id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#261B16]">
                      {v.ip_address ? (
                        <span className="px-2 py-0.5 rounded bg-[#FAF3EE] text-[#4E2714] border border-[#EADBCE] font-medium">
                          {v.ip_address}
                        </span>
                      ) : (
                        <span className="text-[#A39184] italic">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-[#261B16]">
                      <span className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="truncate max-w-[180px]">{v.location_display}</span>
                      </span>
                    </td>

                    {/* Device & OS */}
                    <td className="py-3 px-4 text-[#703D24]">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#261B16] capitalize">
                          {v.device_type} · {v.browser}
                        </span>
                        <span className="text-[11px] text-[#847269]">{v.os}</span>
                      </div>
                    </td>

                    {/* Current Page */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF3EE] border border-[#EADBCE] text-[#4E2714] font-medium font-mono text-[11px]">
                        {v.current_page}
                      </span>
                    </td>

                    {/* Session Duration */}
                    <td className="py-3 px-4 text-[#261B16] font-medium">
                      ⏱ {formatDuration(v.session_duration_seconds)}
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 text-[#1EBE5D] font-semibold">
                      {formatTimeAgo(v.last_active_at)}
                    </td>

                    {/* Action Link */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/analytics/visitors/${v.visitor_id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#B95945] hover:bg-[#FAF3EE] transition-colors"
                      >
                        Details →
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
