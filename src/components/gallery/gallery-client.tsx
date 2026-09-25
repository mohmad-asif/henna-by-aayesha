'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GalleryItem, SiteConfig } from '@/types';
import { GalleryCard } from '@/components/cards/gallery-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { CTASection } from '@/components/sections/cta-section';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/ui/icons';
import { trackGalleryImageOpen } from '@/lib/analytics/events';

const categories = [
  { label: 'All Photos', value: 'all' },
  { label: 'Bridal Couture', value: 'bridal' },
  { label: 'Palm & Hands', value: 'hands' },
  { label: 'Bridal Feet', value: 'feet' },
  { label: 'Modern Arabic', value: 'arabic' },
  { label: 'Minimalist', value: 'minimalist' },
];

export function GalleryClient({
  initialItems,
  settings,
}: {
  initialItems: GalleryItem[];
  settings?: SiteConfig;
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return initialItems;
    return initialItems.filter((item) => item.category === activeCategory);
  }, [initialItems, activeCategory]);

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev > 0 ? prev - 1 : filteredItems.length - 1) : null
    );
  }, [filteredItems.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev < filteredItems.length - 1 ? prev + 1 : 0) : null
    );
  }, [filteredItems.length]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxIndex, handleClose, handlePrev, handleNext]);

  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;
  const city = settings?.location?.city || settings?.contact.city || 'Bengaluru';

  return (
    <div>
      {/* Page Header */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#FAF3EE] to-[#FCF9F4] border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex mb-4">
            <LocationBadge label={`Handcrafted in ${city}`} variant="accent" />
          </div>

          <SectionHeading
            as="h1"
            eyebrow="Visual Lookbook"
            title={`Mehndi Gallery & Bridal Lookbook in ${city}`}
            description={`A curated gallery of real brides, intricate bridal feet motifs, graceful Arabic trails, and festive celebrations handcrafted across ${city}.`}
            align="center"
            showMotif
          />

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => {
                    setActiveCategory(cat.value);
                    setLightboxIndex(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-[#4E2714] text-white shadow-xs'
                      : 'bg-white text-[#58463D] border border-[#EADFD3] hover:bg-[#FAF3EE] hover:border-[#D6C1AF]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-14 sm:py-20 bg-[#FCF9F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EADBCE]">
            <p className="text-xs sm:text-sm text-[#703D24] font-medium">
              Showing <strong className="text-[#261B16]">{filteredItems.length}</strong> photo highlights
            </p>
            <p className="text-xs text-[#847269] hidden sm:block">
              Click any photo to open full view and inquire on WhatsApp
            </p>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item, idx) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  priority={idx < 3}
                  phoneRaw={settings?.contact.whatsappPhoneRaw}
                  onClick={() => {
                    setLightboxIndex(idx);
                    trackGalleryImageOpen({ title: item.title, category: item.category });
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No photos in this category"
              description="Please check back shortly or explore another category."
              actionLabel="View All Photos"
              onAction={() => setActiveCategory('all')}
            />
          )}
        </div>
      </section>

      {/* Interactive Accessible Lightbox Modal */}
      {currentItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo preview: ${currentItem.title}`}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          {/* Top Bar inside Lightbox */}
          <div
            className="flex items-center justify-between text-white max-w-6xl w-full mx-auto pb-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C29B4D] bg-[#2E160C] px-3 py-1 rounded-full border border-[#522915]">
                {currentItem.categoryLabel}
              </span>
              <span className="text-xs text-white/70">
                Photo {lightboxIndex! + 1} of {filteredItems.length}
              </span>
            </div>

            <button
              onClick={handleClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              aria-label="Close photo preview"
            >
              <XIcon size={24} />
            </button>
          </div>

          {/* Center: Image with Prev/Next Controls */}
          <div
            className="relative flex-grow flex items-center justify-center max-w-6xl w-full mx-auto my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all transform -translate-y-1/2 top-1/2"
            >
              <ChevronLeftIcon size={26} />
            </button>

            {/* Main Lightbox Photo */}
            <div className="relative w-full h-[60vh] sm:h-[68vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              <Image
                src={currentItem.image}
                alt={currentItem.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all transform -translate-y-1/2 top-1/2"
            >
              <ChevronRightIcon size={26} />
            </button>
          </div>

          {/* Bottom Bar: Details & WhatsApp Action */}
          <div
            className="max-w-6xl w-full mx-auto pt-3 z-10 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-serif-heading text-xl sm:text-2xl font-semibold text-white">
                {currentItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#D4C3B3] mt-1 max-w-xl">
                {currentItem.caption}
              </p>
            </div>

            <WhatsAppButton
              message={`Hi Aayesha, I saw the photo "${currentItem.title}" in your gallery and would like to ask about a similar mehndi design in ${city}.`}
              phoneRaw={settings?.contact.whatsappPhoneRaw}
              label="Inquire on WhatsApp"
              size="md"
              variant="whatsapp"
              className="flex-shrink-0"
            />
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <CTASection
        title="Inspired by a Design in Our Lookbook?"
        description={`Save your favorite photo and send it directly to Aayesha on WhatsApp for a custom consultation for your ${city} date.`}
        phoneRaw={settings?.contact.whatsappPhoneRaw}
        emailAddress={settings?.contact.email}
        city={city}
      />
    </div>
  );
}
