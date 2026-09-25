'use client';

import React from 'react';

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'blue' | 'purple' | 'red';
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = 'green',
  highlight = false,
}: StatCardProps) {
  const badgeClasses = {
    green: 'bg-[#25D366]/15 text-[#1EBE5D] border-[#25D366]/30',
    amber: 'bg-[#C29B4D]/15 text-[#C29B4D] border-[#C29B4D]/30',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-white to-[#FAF3EE] border-[#C29B4D] shadow-sm ring-1 ring-[#C29B4D]/20'
          : 'bg-white border-[#EADFD3] shadow-2xs hover:border-[#D6C1AF]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#847269] uppercase tracking-wider truncate">
          {title}
        </span>
        {icon && <span className="text-base flex-shrink-0">{icon}</span>}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-serif-heading font-bold text-[#261B16] tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#A39184] truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
