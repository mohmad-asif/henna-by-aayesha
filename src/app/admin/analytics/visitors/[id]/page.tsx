'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Visitor, VisitorSession, PageView, VisitorEvent } from '@/types/analytics';

function formatDate(isoString: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '< 1m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function VisitorDetailPage() {
  const params = useParams();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'pages' | 'events'>('sessions');

  useEffect(() => {
    async function loadDetail() {
      if (!visitorId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/visitors/${visitorId}`);
        if (res.ok) {
          const json = await res.json();
          setVisitor(json.visitor);
          setSessions(json.sessions || []);
          setPageViews(json.pageViews || []);
          setEvents(json.events || []);
        }
      } catch (err) {
        console.error('Failed to load visitor details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [visitorId]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 max-w-7xl mx-auto">
        <div className="w-8 h-8 border-3 border-[#C29B4D] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#847269]">Loading visitor breakdown...</p>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="p-16 text-center space-y-3 max-w-xl mx-auto">
        <p className="font-serif-heading text-xl font-bold text-[#261B16]">
          Visitor Not Found
        </p>
        <p className="text-xs text-[#847269]">
          The requested visitor record could not be found or may have been purged under data retention rules.
        </p>
        <Link
          href="/admin/analytics/visitors"
          className="inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-[#4E2714] text-white"
        >
          ← Return to Visitors List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Link & Title */}
      <div className="space-y-1">
        <Link
          href="/admin/analytics/visitors"
          className="text-xs font-semibold text-[#B95945] hover:underline flex items-center gap-1"
        >
          ← Back to Visitors Directory
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16] flex items-center gap-2">
              <span>Visitor Profile</span>
              <span className="font-mono text-xs font-normal text-[#847269] bg-[#FAF3EE] px-2.5 py-1 rounded-lg border border-[#EADBCE]">
                {visitor.visitor_id}
              </span>
            </h1>
            <p className="text-xs text-[#703D24]">
              First visited on {formatDate(visitor.first_visit_at)} · Last active {formatDate(visitor.last_active_at)}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Overview Cards (Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] shadow-xs">
          <span className="text-[11px] font-semibold text-[#847269] uppercase block mb-1">Total Visits</span>
          <span className="font-serif-heading text-2xl font-bold text-[#4E2714]">{visitor.visit_count}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] shadow-xs">
          <span className="text-[11px] font-semibold text-[#847269] uppercase block mb-1">Page Views</span>
          <span className="font-serif-heading text-2xl font-bold text-[#4E2714]">{visitor.page_views_count}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] shadow-xs">
          <span className="text-[11px] font-semibold text-[#847269] uppercase block mb-1">Device & System</span>
          <span className="text-xs font-bold text-[#261B16] capitalize block">{visitor.device_type}</span>
          <span className="text-[11px] text-[#847269]">{visitor.browser} on {visitor.os}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] shadow-xs">
          <span className="text-[11px] font-semibold text-[#847269] uppercase block mb-1">Approx. Location</span>
          <span className="text-xs font-bold text-[#261B16] block truncate" title={visitor.location_display || ''}>
            {visitor.city || 'Bangalore'}
          </span>
          <span className="text-[11px] text-[#847269] truncate block">{visitor.country || 'India'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] shadow-xs">
          <span className="text-[11px] font-semibold text-[#847269] uppercase block mb-1">Language & Zone</span>
          <span className="text-xs font-bold text-[#261B16] block">{visitor.language}</span>
          <span className="text-[11px] text-[#847269] truncate block">{visitor.timezone}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EADFD3] shadow-xs">
          <span className="text-[11px] font-semibold text-[#847269] uppercase block mb-1">Acquisition</span>
          <span className="text-xs font-bold text-[#261B16] truncate block">{visitor.initial_source || 'Direct'}</span>
          <span className="text-[11px] text-[#847269] truncate block">{visitor.landing_page}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-[#EADFD3] shadow-xs overflow-hidden">
        <div className="flex border-b border-[#F0E5D8] px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-[#4E2714] text-[#4E2714]'
                : 'border-transparent text-[#847269] hover:text-[#261B16]'
            }`}
          >
            Session History ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pages'
                ? 'border-[#4E2714] text-[#4E2714]'
                : 'border-transparent text-[#847269] hover:text-[#261B16]'
            }`}
          >
            Page History ({pageViews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'events'
                ? 'border-[#4E2714] text-[#4E2714]'
                : 'border-transparent text-[#847269] hover:text-[#261B16]'
            }`}
          >
            Event History ({events.length})
          </button>
        </div>

        {/* Tab 1: Sessions */}
        {activeTab === 'sessions' && (
          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#847269]">No sessions recorded for this visitor.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                  <tr>
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-4">Started At</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Pages Viewed</th>
                    <th className="py-3 px-4">Landing Page</th>
                    <th className="py-3 px-4">Exit Page</th>
                    <th className="py-3 px-4">UTM / Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E5D8]">
                  {sessions.map((s) => (
                    <tr key={s.session_id} className="hover:bg-[#FAF6F0] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#4E2714]">{s.session_id}</td>
                      <td className="py-3 px-4 text-[#703D24]">{formatDate(s.started_at)}</td>
                      <td className="py-3 px-4 text-[#261B16]">{formatDate(s.last_active_at)}</td>
                      <td className="py-3 px-4 font-medium text-[#261B16]">{formatDuration(s.duration_seconds)}</td>
                      <td className="py-3 px-4 font-semibold text-[#4E2714]">{s.page_views_count}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#703D24]">{s.landing_page}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#703D24]">{s.exit_page}</td>
                      <td className="py-3 px-4 text-[#847269]">
                        {s.utm_source ? `utm_source: ${s.utm_source}` : (s.referrer || 'Direct')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Page History */}
        {activeTab === 'pages' && (
          <div className="overflow-x-auto">
            {pageViews.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#847269]">No page views logged for this visitor.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                  <tr>
                    <th className="py-3 px-4">Page Title & Path</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Time Spent</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E5D8]">
                  {pageViews.map((pv) => (
                    <tr key={pv.id} className="hover:bg-[#FAF6F0] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#261B16] block">{pv.page_title || pv.url_path}</span>
                        <span className="font-mono text-[11px] text-[#847269]">{pv.url_path}</span>
                      </td>
                      <td className="py-3 px-4 text-[#703D24]">{formatDate(pv.created_at)}</td>
                      <td className="py-3 px-4 font-medium text-[#261B16]">
                        {pv.time_spent_seconds > 0 ? `${pv.time_spent_seconds}s` : '—'}
                      </td>
                      <td className="py-3 px-4 capitalize text-[#703D24]">{pv.device_type}</td>
                      <td className="py-3 px-4 text-[#847269] truncate max-w-[200px]">{pv.referrer || 'Direct'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Event History */}
        {activeTab === 'events' && (
          <div className="overflow-x-auto">
            {events.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#847269]">No business events logged for this visitor.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                  <tr>
                    <th className="py-3 px-4">Event Name</th>
                    <th className="py-3 px-4">Page URL</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Properties / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E5D8]">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#FAF6F0] transition-colors">
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-[#FAF3EE] text-[#4E2714] border border-[#EADBCE]">
                          ⚡ {ev.event_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#703D24]">{ev.url_path}</td>
                      <td className="py-3 px-4 text-[#703D24]">{formatDate(ev.created_at)}</td>
                      <td className="py-3 px-4 text-[#847269] font-mono text-[11px]">
                        {Object.keys(ev.properties || {}).length > 0
                          ? JSON.stringify(ev.properties)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
