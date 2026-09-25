'use client';

import React, { createContext, useContext } from 'react';
import { SiteConfig } from '@/types';

const SiteSettingsContext = createContext<SiteConfig | null>(null);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteConfig;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteConfig | null {
  return useContext(SiteSettingsContext);
}
