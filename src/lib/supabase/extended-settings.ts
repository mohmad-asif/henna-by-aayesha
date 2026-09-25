import { createClient as createServerClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import {
  ExtendedSiteSettings,
  FaqItem,
  WhyChooseUsItem,
} from '@/types';
import {
  DEFAULT_EXTENDED_SETTINGS,
} from '@/config/defaults';
import { faqsData } from '@/data/faqs';
import { defaultWhyChooseUs } from '@/data/why-choose-us';
import { formatLocation } from '@/lib/settings/location';

const EXTENDED_SETTINGS_SOURCE_TYPE = 'extended_settings';
const EXTENDED_SETTINGS_SOURCE_ID = 'site_config';

async function getDb(client?: unknown): Promise<SupabaseClient> {
  if (client) {
    return client as unknown as SupabaseClient;
  }
  return (await createServerClient()) as unknown as SupabaseClient;
}

/**
 * Fetch extended site settings (location, hero, section toggles, social, nav, footer, promo, seo, maintenance).
 */
export async function getExtendedSiteSettings(): Promise<ExtendedSiteSettings> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('metadata')
      .eq('source_type', EXTENDED_SETTINGS_SOURCE_TYPE)
      .eq('source_id', EXTENDED_SETTINGS_SOURCE_ID)
      .maybeSingle();

    if (error || !data || !data.metadata) {
      return DEFAULT_EXTENDED_SETTINGS;
    }

    const m = data.metadata as Partial<ExtendedSiteSettings>;

    return {
      location: { ...DEFAULT_EXTENDED_SETTINGS.location, ...(m.location || {}) },
      hero: { ...DEFAULT_EXTENDED_SETTINGS.hero, ...(m.hero || {}) },
      sections: { ...DEFAULT_EXTENDED_SETTINGS.sections, ...(m.sections || {}) },
      socialLinks: m.socialLinks && m.socialLinks.length > 0 ? m.socialLinks : DEFAULT_EXTENDED_SETTINGS.socialLinks,
      navigation: m.navigation && m.navigation.length > 0 ? m.navigation : DEFAULT_EXTENDED_SETTINGS.navigation,
      footer: { ...DEFAULT_EXTENDED_SETTINGS.footer, ...(m.footer || {}) },
      promo: { ...DEFAULT_EXTENDED_SETTINGS.promo, ...(m.promo || {}) },
      seo: { ...DEFAULT_EXTENDED_SETTINGS.seo, ...(m.seo || {}) },
      maintenanceMode: typeof m.maintenanceMode === 'boolean' ? m.maintenanceMode : false,
    };
  } catch {
    return DEFAULT_EXTENDED_SETTINGS;
  }
}

/**
 * Save extended site settings
 */
export async function saveExtendedSiteSettings(
  partial: Partial<ExtendedSiteSettings>,
  client?: ReturnType<typeof createServerClient> extends Promise<infer U> ? U : unknown
): Promise<ExtendedSiteSettings> {
  const current = await getExtendedSiteSettings();
  const merged: ExtendedSiteSettings = {
    location: { ...current.location, ...(partial.location || {}) },
    hero: { ...current.hero, ...(partial.hero || {}) },
    sections: { ...current.sections, ...(partial.sections || {}) },
    socialLinks: partial.socialLinks || current.socialLinks,
    navigation: partial.navigation || current.navigation,
    footer: { ...current.footer, ...(partial.footer || {}) },
    promo: { ...current.promo, ...(partial.promo || {}) },
    seo: { ...current.seo, ...(partial.seo || {}) },
    maintenanceMode:
      typeof partial.maintenanceMode === 'boolean'
        ? partial.maintenanceMode
        : current.maintenanceMode,
  };

  const dbClient = await getDb(client);

  const payload = {
    source_type: EXTENDED_SETTINGS_SOURCE_TYPE,
    source_id: EXTENDED_SETTINGS_SOURCE_ID,
    title: 'Extended Site Configuration',
    content: `Service City: ${merged.location.city}. State: ${merged.location.state}. Hero: ${merged.hero.title}. Maintenance Mode: ${merged.maintenanceMode}.`,
    metadata: merged,
    content_hash: `ext-settings-${Date.now()}`,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await dbClient.from('knowledge_documents').upsert(payload);
  if (error) {
    throw new Error(`Failed to save extended settings: ${error.message}`);
  }

  return merged;
}

/**
 * Fetch FAQs dynamically. If includeUnpublished is true, returns all for admin.
 */
export async function getFaqs(includeUnpublished = false): Promise<FaqItem[]> {
  try {
    const supabase = await createServerClient();
    let query = supabase
      .from('knowledge_documents')
      .select('source_id, title, content, metadata, is_active')
      .eq('source_type', 'faq');

    if (!includeUnpublished) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data
        .map((d) => {
          const meta = (d.metadata || {}) as Record<string, unknown>;
          return {
            id: d.source_id,
            question: (meta.question as string) || d.title,
            answer:
              (meta.answer as string) ||
              d.content.replace(/^Frequently Asked Question:[\s\S]*?Answer:\s*/i, '').replace(/\nContext:[\s\S]*$/, ''),
            category: (meta.category as string) || 'general',
            displayOrder: typeof meta.display_order === 'number' ? meta.display_order : 1,
            published: d.is_active,
          };
        })
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }

    // Fallback to static faqs with dynamic location formatting
    const extended = await getExtendedSiteSettings();
    return faqsData.map((f, i) => ({
      id: `faq-${i + 1}`,
      question: formatLocation(f.question, { location: extended.location }),
      answer: formatLocation(f.answer, { location: extended.location }),
      category: f.category || 'general',
      displayOrder: i + 1,
      published: true,
    }));
  } catch {
    return faqsData.map((f, i) => ({
      id: `faq-${i + 1}`,
      question: f.question,
      answer: f.answer,
      category: f.category || 'general',
      displayOrder: i + 1,
      published: true,
    }));
  }
}

/**
 * Save FAQ
 */
export async function saveFaq(
  faq: Partial<FaqItem>,
  client?: unknown
): Promise<FaqItem> {
  const id = faq.id?.trim() || `faq-${Date.now()}`;
  const question = faq.question?.trim() || 'Untitled Question';
  const answer = faq.answer?.trim() || '';
  const category = faq.category?.trim() || 'general';
  const displayOrder = typeof faq.displayOrder === 'number' ? faq.displayOrder : 1;
  const published = typeof faq.published === 'boolean' ? faq.published : true;

  const dbClient = await getDb(client);

  const payload = {
    source_type: 'faq',
    source_id: id,
    title: question,
    content: `Frequently Asked Question: ${question}\nCategory: ${category}\nAnswer: ${answer}\nContext: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.`,
    metadata: {
      question,
      answer,
      category,
      display_order: displayOrder,
      published,
    },
    content_hash: `faq-${id}-${Date.now()}`,
    is_active: published,
    updated_at: new Date().toISOString(),
  };

  const { error } = await dbClient.from('knowledge_documents').upsert(payload);
  if (error) {
    throw new Error(`Failed to save FAQ: ${error.message}`);
  }

  return {
    id,
    question,
    answer,
    category,
    displayOrder,
    published,
  };
}

/**
 * Delete FAQ
 */
export async function deleteFaq(
  id: string,
  client?: unknown
): Promise<boolean> {
  const dbClient = await getDb(client);

  const { error } = await dbClient
    .from('knowledge_documents')
    .delete()
    .eq('source_type', 'faq')
    .eq('source_id', id);

  if (error) {
    throw new Error(`Failed to delete FAQ: ${error.message}`);
  }

  return true;
}

/**
 * Fetch Why Choose Us items
 */
export async function getWhyChooseUs(includeUnpublished = false): Promise<WhyChooseUsItem[]> {
  try {
    const supabase = await createServerClient();
    let query = supabase
      .from('knowledge_documents')
      .select('source_id, title, content, metadata, is_active')
      .eq('source_type', 'why_choose_us');

    if (!includeUnpublished) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data
        .map((d) => {
          const meta = (d.metadata || {}) as Record<string, unknown>;
          return {
            id: d.source_id,
            icon: (meta.icon as string) || '🌿',
            title: d.title,
            description: d.content,
            displayOrder: typeof meta.display_order === 'number' ? meta.display_order : 1,
            published: d.is_active,
          };
        })
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return defaultWhyChooseUs;
  } catch {
    return defaultWhyChooseUs;
  }
}

/**
 * Save Why Choose Us item
 */
export async function saveWhyChooseUs(
  item: Partial<WhyChooseUsItem>,
  client?: unknown
): Promise<WhyChooseUsItem> {
  const id = item.id?.trim() || `wcu-${Date.now()}`;
  const icon = item.icon?.trim() || '🌿';
  const title = item.title?.trim() || 'Untitled';
  const description = item.description?.trim() || '';
  const displayOrder = typeof item.displayOrder === 'number' ? item.displayOrder : 1;
  const published = typeof item.published === 'boolean' ? item.published : true;

  const dbClient = await getDb(client);

  const payload = {
    source_type: 'why_choose_us',
    source_id: id,
    title,
    content: description,
    metadata: {
      icon,
      display_order: displayOrder,
      published,
    },
    content_hash: `wcu-${id}-${Date.now()}`,
    is_active: published,
    updated_at: new Date().toISOString(),
  };

  const { error } = await dbClient.from('knowledge_documents').upsert(payload);
  if (error) {
    throw new Error(`Failed to save Why Choose Us card: ${error.message}`);
  }

  return {
    id,
    icon,
    title,
    description,
    displayOrder,
    published,
  };
}

/**
 * Delete Why Choose Us item
 */
export async function deleteWhyChooseUs(
  id: string,
  client?: unknown
): Promise<boolean> {
  const dbClient = await getDb(client);

  const { error } = await dbClient
    .from('knowledge_documents')
    .delete()
    .eq('source_type', 'why_choose_us')
    .eq('source_id', id);

  if (error) {
    throw new Error(`Failed to delete Why Choose Us card: ${error.message}`);
  }

  return true;
}
