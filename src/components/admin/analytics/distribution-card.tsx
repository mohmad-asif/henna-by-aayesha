'use client';

import React from 'react';

export interface DistributionItem {
  label: string;
  count: number;
  percentage?: number;
  secondary?: string;
  icon?: string;
}

export interface DistributionCardProps {
  title: string;
  subtitle?: string;
  items: DistributionItem[];
  emptyMessage?: string;
  barColor?: 'brown' | 'gold' | 'green';
}

export function DistributionCard({
  title,
  subtitle,
  items,
  emptyMessage = 'No data recorded yet',
  barColor = 'brown',
}: DistributionCardProps) {
  const maxCount = Math.max(1, ...items.map((i) => i.count));

  const barStyles = {
    brown: 'bg-[#4E2714]',
    gold: 'bg-[#C29B4D]',
    green: 'bg-[#25D366]',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EADFD3] shadow-xs flex flex-col justify-between">
      <div>
        <div className="mb-3">
          <h3 className="font-serif-heading text-base font-bold text-[#261B16]">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-[#847269]">{subtitle}</p>}
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A39184]">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const widthPct = Math.max(4, Math.round((item.count / maxCount) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#261B16] truncate max-w-[200px] flex items-center gap-1.5">
                      {item.icon && <span>{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                      {item.secondary && (
                        <span className="text-[#847269] text-[11px]">{item.secondary}</span>
                      )}
                      <span className="font-semibold text-[#4E2714]">
                        {item.count.toLocaleString()}
                      </span>
                      {item.percentage !== undefined && (
                        <span className="text-[10px] text-[#A39184] w-8 text-right">
                          {item.percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-[#FAF3EE] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barStyles[barColor]}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
