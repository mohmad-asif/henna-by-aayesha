import React from 'react';
import { HennaFloralMotif } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  title = 'No items found',
  description = 'Try selecting another category or check back soon for new additions to the collection.',
  actionLabel = 'Reset Filters',
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-[#D6C1AF] max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-full bg-[#FAF3EE] mx-auto flex items-center justify-center text-[#B95945] mb-4">
        <HennaFloralMotif size={28} />
      </div>
      <h3 className="font-serif-heading text-xl font-semibold text-[#261B16]">
        {title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-[#847269] leading-relaxed">
        {description}
      </p>

      {(onAction || actionHref) && (
        <div className="mt-6">
          <Button
            size="sm"
            variant="outline"
            onClick={onAction}
            href={actionHref}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
