import { HennaFloralMotif } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FCF9F4] px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FAF3EE] border border-[#E8D9CD] flex items-center justify-center text-[#C29B4D] mb-5">
        <HennaFloralMotif size={32} />
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-[#B95945] mb-2 bg-[#F9EFEA] px-3 py-1 rounded-full border border-[#F2D7D0]">
        404 Not Found
      </span>

      <h1 className="font-serif-heading text-3xl sm:text-5xl font-semibold text-[#261B16] mt-2">
        Page Not Found
      </h1>

      <p className="mt-4 text-sm sm:text-base text-[#58463D] max-w-md mx-auto leading-relaxed">
        The page you are looking for does not exist or may have been relocated. Explore our mehndi designs or chat with Aayesha directly on WhatsApp.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <Button href="/" variant="primary" size="md">
          Back to Home
        </Button>
        <Button href="/mehndi-designs" variant="outline" size="md">
          View Mehndi Designs
        </Button>
        <WhatsAppButton
          label="Chat on WhatsApp"
          size="md"
          variant="whatsapp"
        />
      </div>
    </div>
  );
}
