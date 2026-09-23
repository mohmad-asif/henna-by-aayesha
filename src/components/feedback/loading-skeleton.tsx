import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#EADFD3] animate-pulse">
      <div className="aspect-[4/3] bg-[#EADBCE]/50 w-full" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-[#EADBCE]/60 rounded w-1/3" />
        <div className="h-6 bg-[#EADBCE]/70 rounded w-3/4" />
        <div className="h-4 bg-[#EADBCE]/40 rounded w-full" />
        <div className="h-4 bg-[#EADBCE]/40 rounded w-5/6" />
        <div className="pt-4 flex justify-between items-center">
          <div className="h-8 bg-[#EADBCE]/60 rounded-full w-24" />
          <div className="h-8 bg-[#EADBCE]/60 rounded-full w-28" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
      <div className="max-w-xl mx-auto text-center space-y-3">
        <div className="h-4 bg-[#EADBCE]/60 rounded-full w-28 mx-auto" />
        <div className="h-10 bg-[#EADBCE]/80 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-[#EADBCE]/50 rounded w-full mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
