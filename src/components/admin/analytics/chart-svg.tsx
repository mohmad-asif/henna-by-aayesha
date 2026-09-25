'use client';

import React, { useState } from 'react';

export interface ChartDataPoint {
  date: string;
  displayDate: string;
  visitors: number;
  pageViews: number;
}

export function DailyTrendChart({ data }: { data: ChartDataPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[#847269] bg-[#FAF6F0] rounded-2xl border border-dashed border-[#EADFD3]">
        No trend data recorded in this period yet.
      </div>
    );
  }

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.visitors, d.pageViews)));
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const height = 220;
  const paddingBottom = 28;
  const paddingTop = 20;
  const usableHeight = height - paddingBottom - paddingTop;

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-6 border border-[#EADFD3] shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif-heading text-lg font-bold text-[#261B16]">
            Visitors & Page Views Activity
          </h3>
          <p className="text-xs text-[#847269]">
            Daily traffic volume across the selected date window
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#4E2714]" />
            <span className="text-[#261B16]">Unique Visitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#C29B4D]" />
            <span className="text-[#261B16]">Page Views</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto pt-2">
        <div className="min-w-[500px]">
          <svg viewBox={`0 0 ${data.length * 40 + 40} ${height}`} className="w-full h-56 overflow-visible">
            {/* Grid Lines */}
            {yTicks.map((tick, i) => {
              const y = paddingTop + usableHeight - (tick / maxVal) * usableHeight;
              return (
                <g key={i}>
                  <line
                    x1="30"
                    y1={y}
                    x2={data.length * 40 + 30}
                    y2={y}
                    stroke="#F0E5D8"
                    strokeDasharray={tick === 0 ? '0' : '4'}
                  />
                  <text x="24" y={y + 3} textAnchor="end" fontSize="10" fill="#A39184">
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, idx) => {
              const xCenter = 50 + idx * 40;
              const barWidth = 9;

              const vHeight = (d.visitors / maxVal) * usableHeight;
              const pvHeight = (d.pageViews / maxVal) * usableHeight;

              const vY = paddingTop + usableHeight - vHeight;
              const pvY = paddingTop + usableHeight - pvHeight;

              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={d.date}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Subtle column hover highlight */}
                  {isHovered && (
                    <rect
                      x={xCenter - 18}
                      y={paddingTop}
                      width={36}
                      height={usableHeight}
                      fill="#FAF3EE"
                      rx="4"
                    />
                  )}

                  {/* Page Views Bar */}
                  <rect
                    x={xCenter - 10}
                    y={pvY}
                    width={barWidth}
                    height={Math.max(2, pvHeight)}
                    fill={isHovered ? '#D4AC5E' : '#C29B4D'}
                    rx="3"
                  />

                  {/* Visitors Bar */}
                  <rect
                    x={xCenter + 1}
                    y={vY}
                    width={barWidth}
                    height={Math.max(2, vHeight)}
                    fill={isHovered ? '#6B3720' : '#4E2714'}
                    rx="3"
                  />

                  {/* Date label */}
                  {(data.length <= 15 || idx % 2 === 0) && (
                    <text
                      x={xCenter}
                      y={height - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#847269"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                      {d.displayDate}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIdx !== null && data[hoveredIdx] && (
            <div className="mt-2 text-center text-xs text-[#261B16] bg-[#FAF3EE] py-2 px-4 rounded-xl border border-[#EADBCE] inline-flex items-center gap-4 mx-auto block w-fit">
              <span className="font-semibold text-[#4E2714]">
                📅 {data[hoveredIdx].displayDate}
              </span>
              <span>
                👥 Visitors: <strong>{data[hoveredIdx].visitors}</strong>
              </span>
              <span>
                📄 Page Views: <strong>{data[hoveredIdx].pageViews}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
