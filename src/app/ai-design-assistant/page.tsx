import type { Metadata } from 'next';
import { getCanonicalUrl } from '@/config/site';
import { fetchSiteSettings } from '@/lib/supabase/data';
import { AIDesignAssistantClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await fetchSiteSettings();
  const city = siteSettings.location?.city || siteSettings.contact.city;
  return {
    title: `AI Design Assistant | ${siteSettings.name}`,
    description: `Consult with Aayesha’s AI Design Assistant to explore bridal mehndi, Arabic patterns, and minimal henna styles tailored to your ${city} celebration.`,
    alternates: {
      canonical: getCanonicalUrl('/ai-design-assistant'),
    },
  };
}

export default async function AIDesignAssistantPage() {
  const siteSettings = await fetchSiteSettings();

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <AIDesignAssistantClient settings={siteSettings} />
    </div>
  );
}
