import { HennaFloralMotif } from '@/components/ui/icons';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FCF9F4] px-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-[#EADFD3] border-t-[#B95945] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-[#C29B4D]">
          <HennaFloralMotif size={22} className="animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-xs sm:text-sm font-medium text-[#703D24] tracking-wide uppercase">
        Loading Henna Artistry...
      </p>
    </div>
  );
}
