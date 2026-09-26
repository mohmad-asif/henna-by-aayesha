'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Visitor } from '@/types/analytics';

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

function formatRelative(isoString: string): string {
  if (!isoString) return '—';
  const sec = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default function VisitorsListPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [device, setDevice] = useState('all');
  const [location, setLocation] = useState('all');
  const [sortBy, setSortBy] = useState('last_active_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (search.trim()) params.append('search', search.trim());
      if (device !== 'all') params.append('device', device);
      if (location !== 'all') params.append('location', location);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/admin/analytics/visitors?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setVisitors(json.visitors || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch visitors list:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, device, location, sortBy, sortOrder, startDate, endDate]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (!ignore) {
        fetchVisitors();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchVisitors]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/analytics/export?type=visitors&range=all');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `henna_visitors_list_${new Date().toISOString().split('T')[0]}.csv`;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVisitors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDevice('all');
    setLocation('all');
    setStartDate('');
    setEndDate('');
    setSortBy('last_active_at');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👥</span>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#261B16]">
              Visitor Directory
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FAF3EE] text-[#4E2714] border border-[#EADFD3]">
              {total.toLocaleString()} visitors
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#703D24]">
            Search, filter, and review client visits, devices, and lookbook interactions
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-[#4E2714] border border-[#D6C1AF] hover:bg-[#FAF6F0] transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-50"
        >
          <span>📥</span>
          <span>{isExporting ? 'Exporting...' : 'Export Visitors CSV'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EADFD3] shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[220px] w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Visitor ID, City, or Page URL..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D6C1AF] text-xs text-[#261B16] bg-white focus:outline-none focus:ring-2 focus:ring-[#C29B4D]"
            />
          </div>

          {/* Device Filter */}
          <select
            value={device}
            onChange={(e) => {
              setDevice(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[#D6C1AF] text-xs text-[#261B16] bg-white focus:outline-none focus:ring-2 focus:ring-[#C29B4D] cursor-pointer"
          >
            <option value="all">All Devices</option>
            <option value="mobile">Mobile Phones</option>
            <option value="desktop">Desktop Computers</option>
            <option value="tablet">Tablets</option>
          </select>

          {/* Location Filter */}
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[#D6C1AF] text-xs text-[#261B16] bg-white focus:outline-none focus:ring-2 focus:ring-[#C29B4D] cursor-pointer"
          >
            <option value="all">All Locations</option>
            <option value="Bengaluru">Bengaluru / Bangalore</option>
            <option value="Karnataka">Karnataka Region</option>
            <option value="India">All India</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [col, ord] = e.target.value.split('_');
              setSortBy(col);
              setSortOrder(ord as 'asc' | 'desc');
              setPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[#D6C1AF] text-xs text-[#261B16] bg-white focus:outline-none focus:ring-2 focus:ring-[#C29B4D] cursor-pointer"
          >
            <option value="last_active_at_desc">Latest Activity</option>
            <option value="first_visit_at_desc">Newest Visitors</option>
            <option value="visit_count_desc">Most Visits</option>
            <option value="page_views_count_desc">Most Page Views</option>
          </select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#4E2714] text-white text-xs font-semibold hover:bg-[#381A0E] cursor-pointer"
            >
              Search
            </button>

            {(search || device !== 'all' || location !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl text-xs text-[#847269] hover:text-[#261B16] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-2xl border border-[#EADFD3] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#C29B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#847269]">Loading visitors directory...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="font-serif-heading text-lg font-bold text-[#261B16]">
              No Visitors Found
            </p>
            <p className="text-xs text-[#847269]">
              Try adjusting your search criteria or date filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#FAF6F0] text-[#703D24] uppercase text-[10px] tracking-wider font-semibold border-b border-[#EADFD3]">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Visitor ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">IP Address</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">First Visit</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Last Activity</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Visits</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Pages</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Device & OS</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Approx. Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Referrer</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Last Page</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E5D8]">
                {visitors.map((v) => (
                  <tr key={v.visitor_id} className="hover:bg-[#FAF6F0] transition-colors">
                    {/* Visitor ID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#4E2714] whitespace-nowrap">
                      <span title={v.visitor_id}>
                        {v.visitor_id.substring(0, 8)}...
                      </span>
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 text-[#261B16] whitespace-nowrap">
                      {v.ip_address ? (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#FAF3EE] text-[#4E2714] border border-[#EADBCE] inline-block font-medium">
                          {v.ip_address}
                        </span>
                      ) : (
                        <span className="text-[#A39184] italic">—</span>
                      )}
                    </td>

                    {/* First Visit */}
                    <td className="py-3 px-4 text-[#703D24] whitespace-nowrap">
                      {formatDate(v.first_visit_at)}
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 font-medium text-[#261B16] whitespace-nowrap">
                      {formatRelative(v.last_active_at)}
                    </td>

                    {/* Visit Count */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF3EE] text-[#4E2714] font-semibold text-[11px]">
                        {v.visit_count}
                      </span>
                    </td>

                    {/* Page Views */}
                    <td className="py-3 px-4 text-[#261B16] font-medium whitespace-nowrap">
                      {v.page_views_count}
                    </td>

                    {/* Device / OS */}
                    <td className="py-3 px-4 text-[#703D24] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#261B16] capitalize">
                          {v.device_type} · {v.browser}
                        </span>
                        <span className="text-[10px] text-[#847269]">{v.os}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-[#261B16]">
                      <span className="truncate max-w-[160px] block" title={v.location_display || v.city || ''}>
                        {v.location_display || v.city || 'Bangalore, India'}
                      </span>
                    </td>

                    {/* Referrer */}
                    <td className="py-3 px-4 text-[#847269] truncate max-w-[120px]">
                      {v.initial_source || (v.initial_referrer ? 'Referral' : 'Direct')}
                    </td>

                    {/* Last Page */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF3EE] text-[#4E2714] font-mono text-[11px] truncate max-w-[120px] block">
                        {v.last_page}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/analytics/visitors/${v.visitor_id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#B95945] hover:bg-[#FAF3EE] transition-colors"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F0E5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#847269]">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} visitors total)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#D6C1AF] bg-white text-[#261B16] hover:bg-[#FAF6F0] disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#D6C1AF] bg-white text-[#261B16] hover:bg-[#FAF6F0] disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
