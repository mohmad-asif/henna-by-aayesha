import React from 'react';
import { Testimonial } from '@/types';
import { StarIcon, ShieldCheckIcon } from '@/components/ui/icons';

export interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EADFD3] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        {/* Rating Stars */}
        <div className="flex items-center gap-1 text-[#C29B4D] mb-4">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              size={16}
              filled={i < testimonial.rating}
              className="text-[#C29B4D]"
            />
          ))}
          <span className="text-xs font-semibold text-[#703D24] ml-2">
            5.0 Rating
          </span>
        </div>

        {/* Quote */}
        <blockquote className="text-sm sm:text-base text-[#4E2714] leading-relaxed italic relative">
          “{testimonial.quote}”
        </blockquote>
      </div>

      {/* Author Info */}
      <div className="mt-6 pt-4 border-t border-[#F5ECE4] flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm text-[#261B16]">
            {testimonial.clientName}
          </h4>
          <p className="text-xs text-[#B95945] font-medium">
            {testimonial.eventType}
          </p>
          <p className="text-[11px] text-[#847269] mt-0.5">
            {testimonial.bangaloreArea} • {testimonial.weddingDate}
          </p>
        </div>

        {testimonial.verifiedBride && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#1EBE5D] bg-[#EAFBF0] px-2.5 py-1 rounded-full border border-[#D0F4DE]">
            <ShieldCheckIcon size={13} className="text-[#1EBE5D]" />
            <span>Verified Bride</span>
          </div>
        )}
      </div>
    </div>
  );
}
