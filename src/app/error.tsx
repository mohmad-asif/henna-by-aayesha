'use client';

import { useEffect } from 'react';
import { HennaFloralMotif } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FCF9F4] px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FAF3EE] border border-[#E8D9CD] flex items-center justify-center text-[#B95945] mb-5">
        <HennaFloralMotif size={32} />
      </div>

      <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16]">
        Something went wrong
      </h1>

      <p className="mt-3 text-sm sm:text-base text-[#58463D] max-w-md mx-auto leading-relaxed">
        We encountered an unexpected issue while loading this page. Please try refreshing or reach out to Aayesha on WhatsApp.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button onClick={() => reset()} variant="primary" size="md">
          Try Again
        </Button>
        <Button href="/" variant="outline" size="md">
          Return to Home
        </Button>
        <WhatsAppButton
          label="Inquire on WhatsApp"
          size="md"
          variant="whatsapp"
        />
      </div>
    </div>
  );
}
