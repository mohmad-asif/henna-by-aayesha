'use client';

import React, { useState, useMemo } from 'react';
import { MehndiDesign, SiteConfig } from '@/types';
import { DesignCard } from '@/components/cards/design-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { LocationBadge } from '@/components/ui/location-badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { CTASection } from '@/components/sections/cta-section';

const categories: { label: string; value: string }[] = [
  { label: 'All Designs', value: 'all' },
  { label: 'Bridal', value: 'bridal' },
  { label: 'Arabic', value: 'arabic' },
  { label: 'Traditional', value: 'traditional' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Modern', value: 'modern' },
  { label: 'Custom', value: 'custom' },
];

export function DesignsCatalog({
  initialDesigns,
  settings,
}: {
  initialDesigns: MehndiDesign[];
  settings?: SiteConfig;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(9);

  const filteredDesigns = useMemo(() => {
    return initialDesigns.filter((design) => {
      const catLower = selectedCategory.toLowerCase();
      const designCatLower = design.category.toLowerCase();
      const designCatLabelLower = (design.categoryLabel || '').toLowerCase();

      const matchesCategory =
        selectedCategory === 'all' ||
        designCatLower === catLower ||
        designCatLabelLower.includes(catLower) ||
        (catLower === 'minimal' && (designCatLower.includes('minimal') || designCatLabelLower.includes('minimal'))) ||
        (catLower === 'modern' && (designCatLower.includes('modern') || designCatLower.includes('indo-western') || designCatLower.includes('arabic'))) ||
        (catLower === 'traditional' && (designCatLower.includes('traditional') || designCatLower.includes('mandala') || designCatLabelLower.includes('traditional'))) ||
        (catLower === 'custom' && (designCatLower.includes('custom') || designCatLower.includes('feet') || designCatLabelLower.includes('custom')));

      const matchesSearch =
        searchQuery.trim() === '' ||
        design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [initialDesigns, selectedCategory, searchQuery]);

  const visibleDesigns = useMemo(() => {
    return filteredDesigns.slice(0, displayCount);
  }, [filteredDesigns, displayCount]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setDisplayCount(9);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setDisplayCount(9);
  };

  const city = settings?.location?.city || settings?.contact.city || 'Bengaluru';
  const serviceAvailability = settings?.location?.serviceAvailability || `Appointments in ${city} Only`;

  return (
    <div>
      {/* Page Header */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#FAF3EE] to-[#FCF9F4] border-b border-[#EADFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex mb-4">
            <LocationBadge label={serviceAvailability} variant="accent" />
          </div>

          <SectionHeading
            as="h1"
            eyebrow="Artisan Portfolio"
            title={`Mehndi Design Collections in ${city}`}
            description={`Explore our signature bridal collections, intricate royal palm mandalas, modern Arabic trails, and delicate minimalist accents handcrafted across ${city}.`}
            align="center"
            showMotif
          />

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by style, motif (e.g. Lotus, Bridal, Arabic)..."
                className="w-full px-5 py-3 rounded-full bg-white border border-[#D6C1AF] text-sm text-[#261B16] placeholder-[#A39184] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#4E2714] focus:border-transparent transition-all"
                aria-label="Search mehndi designs"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#847269] hover:text-[#4E2714]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
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

      {/* Designs Grid */}
      <section className="py-14 sm:py-20 bg-[#FCF9F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EADBCE]">
            <p className="text-xs sm:text-sm text-[#703D24] font-medium">
              Showing <strong className="text-[#261B16]">{visibleDesigns.length}</strong> of {filteredDesigns.length} {filteredDesigns.length === 1 ? 'design' : 'designs'}
            </p>
            <p className="text-xs text-[#847269] hidden sm:block">
              All designs hand-applied with 100% organic Rajasthani henna
            </p>
          </div>

          {visibleDesigns.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleDesigns.map((design, idx) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    priority={idx < 3}
                    phoneRaw={settings?.contact.whatsappPhoneRaw}
                  />
                ))}
              </div>

              {displayCount < filteredDesigns.length && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setDisplayCount((prev) => prev + 6)}
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white hover:bg-[#FAF3EE] text-[#4E2714] font-semibold text-sm border-2 border-[#D6C1AF] shadow-xs hover:border-[#4E2714] transition-all"
                  >
                    Load More Designs ({filteredDesigns.length - displayCount} more)
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No designs found"
              description={`We couldn't find any designs matching "${searchQuery}". Try selecting another category or clear your search.`}
              actionLabel="Clear Filters"
              onAction={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setDisplayCount(9);
              }}
            />
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection
        title={`Found a Design You Love for Your ${city} Event?`}
        description="Share the design name or screenshot directly with Aayesha on WhatsApp to check availability and lock your date."
        phoneRaw={settings?.contact.whatsappPhoneRaw}
        emailAddress={settings?.contact.email}
        city={city}
      />
    </div>
  );
}
