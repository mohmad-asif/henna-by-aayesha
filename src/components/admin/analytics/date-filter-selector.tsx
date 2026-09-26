'use client';

import React, { useState } from 'react';

export interface DateFilterProps {
  range: string;
  onRangeChange: (range: string) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  onExportCsv?: () => void;
  isExporting?: boolean;
}

export function DateFilterSelector({
  range,
  onRangeChange,
  startDate,
  endDate,
  onCustomDateChange,
  onExportCsv,
  isExporting,
}: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd && onCustomDateChange) {
      onCustomDateChange(customStart, customEnd);
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EADFD3] shadow-xs">
      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-xs font-semibold text-[#847269] uppercase tracking-wider mr-1 hidden sm:inline">
          Filter:
        </span>
        {ranges.map((r) => {
          const active = range === r.value && !showCustom;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setShowCustom(false);
                onRangeChange(r.value);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-[#4E2714] text-white shadow-xs font-semibold'
                  : 'bg-[#FAF6F0] text-[#703D24] hover:bg-[#F2ECE4]'
              }`}
            >
              {r.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            showCustom
              ? 'bg-[#C29B4D] text-[#2E160C] font-semibold'
              : 'bg-[#FAF6F0] text-[#703D24] hover:bg-[#F2ECE4]'
          }`}
        >
          📅 Custom Range
        </button>
      </div>

      {/* CSV Export Button */}
      {onExportCsv && (
        <button
          type="button"
          onClick={onExportCsv}
          disabled={isExporting}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF3EE] hover:bg-[#F2ECE4] text-[#4E2714] border border-[#D6C1AF] transition-colors cursor-pointer disabled:opacity-50"
        >
          <span>📥</span>
          <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      )}

      {/* Custom Date Form Dropdown */}
      {showCustom && (
        <form
          onSubmit={handleApplyCustom}
          className="w-full pt-3 mt-1 border-t border-[#F0E5D8] flex flex-col sm:flex-row sm:items-center gap-3 text-xs"
        >
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-[#847269] font-medium shrink-0">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-[#D6C1AF] rounded-lg text-[#261B16] focus:outline-none focus:ring-1 focus:ring-[#C29B4D]"
              required
            />
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-[#847269] font-medium shrink-0">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-[#D6C1AF] rounded-lg text-[#261B16] focus:outline-none focus:ring-1 focus:ring-[#C29B4D]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-1.5 bg-[#4E2714] text-white font-medium rounded-lg hover:bg-[#381A0E] cursor-pointer text-center"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
